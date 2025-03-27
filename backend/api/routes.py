from fastapi import APIRouter, UploadFile, File as FastAPIFile, HTTPException, Depends
from models.schemas import QueryRequest, ChatResponse, ListFilesResponse, FilesResponse
from services.document_processor import process_pdf, process_excel
from services.vector_store import store_documents, pc_vectorstore, delete_documents
from langchain_openai import ChatOpenAI
from core.config import OPENAI_API_KEY
from sqlalchemy.orm import Session
from models.database import get_db, File as FileModel
import tempfile
import os
import uuid
import logging
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain.chains import create_retrieval_chain, create_history_aware_retriever
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.delete("/files/{file_id}")
async def delete_file(file_id: str, db: Session = Depends(get_db)):
    """
    Endpoint to delete a file from the database.
    """
    logger.info(f"Deleting file with ID: {file_id}")
    delete_documents(file_id)
    db.query(FileModel).filter(FileModel.file_id == file_id).delete()
    db.commit()
    return {"message": "File deleted successfully"}

@router.get("/files", response_model=ListFilesResponse)
async def get_files(db: Session = Depends(get_db)):
    """
    Endpoint to get all files from the database.
    """
    logger.info("Getting all files from the database")
    files = db.query(FileModel).all()
    logger.info(f"Found {len(files)} files in the database")
    return ListFilesResponse(files=[FilesResponse(file_id=file.file_id, filename=file.filename, upload_date=file.upload_date, filetype=file.filetype, size=file.size) for file in files])

@router.post("/upload")
async def upload_file(file: UploadFile = FastAPIFile(...), db: Session = Depends(get_db)):
    """
    Endpoint to upload a file and process it for document QA.
    """
    try:
        # Check file size before processing
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        
        # Read the file content
        content = await file.read()
        
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File size exceeds the 5MB limit")
        
        # Create a temporary file
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_path = temp_file.name
            temp_file.write(content)

        # Generate a unique ID for the file
        file_id = str(uuid.uuid4())

        logger.info(f"Processing document: {file.filename}")
        # Process the document based on its type
        documents = []
        if file_extension == ".pdf":
            documents = process_pdf(temp_path, file_id, file.filename)
        elif file_extension in [".xlsx", ".xls"]:
            documents = process_excel(temp_path, file_id, file.filename)
        
        # Store documents in vector database
        logger.info(f"Storing {len(documents)} documents in vector database")
        store_documents(documents)

        # Sleep for 10 seconds to allow the vectors to be indexed
        time.sleep(10)
        
        # Store file information in SQLite database
        db_file = FileModel(
            file_id=file_id,
            filename=file.filename,
            filetype=file_extension,
            size=len(content)
        )
        db.add(db_file)
        db.commit()

        logger.info(f"File {file.filename} uploaded successfully")

        return {"file_id": file_id, "filename": file.filename, "document_count": len(documents)}
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up the temporary file
        os.unlink(temp_path)

@router.post("/query", response_model=ChatResponse)
async def query_document(request: QueryRequest):
    """
    Endpoint to query documents using RAG with chat history context.
    """
    logger.info(f"Querying document: {request.query}")
    
    # Convert the chat history into Langchain message format
    history = ChatMessageHistory()
    for msg in request.messages[:-1]:  # Exclude the latest message
        if msg.role == "user":
            history.add_user_message(msg.content)
        else:
            history.add_ai_message(msg.content)

    # Create the retriever with file filter if specified
    retriever = pc_vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"top_k": 10, "fetch_k": 50, "filter": {"file_id": request.file_id} if request.file_id else None}
    )
    
    # Initialize LLM
    llm = ChatOpenAI(
        model_name="gpt-4o",
        temperature=0.4,
        openai_api_key=OPENAI_API_KEY,
    )

    contextualize_q_system_prompt = """Given a chat history and the latest user question \
which might reference context in the chat history, formulate a standalone question \
which can be understood without the chat history. Do NOT answer the question, \
just reformulate it if needed and otherwise return it as is."""

    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )
    
    qa_system_prompt = """You are an assistant for question-answering tasks. \
Use the following pieces of retrieved context to answer the question. \
If you don't know the answer, just say that you don't know. \
Use three sentences maximum and keep the answer concise.\

{context}"""
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    response = rag_chain.invoke({"input": request.query, "chat_history": history.messages})
    
    logger.info(f"Response: {response}")
    # Extract sources
    sources = []
    for doc in response.get("context", []):
        metadata = doc.metadata
        sources.append({
            "text": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
            "filename": metadata.get("filename", "Unknown"),
            "page": metadata.get("page", 0) if "page" in metadata else None,
            "row": metadata.get("row", None),
            "column": metadata.get("column", None),
        })
    
    return ChatResponse(
        answer=response["answer"],
        sources=sources
    )