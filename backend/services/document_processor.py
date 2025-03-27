from langchain_community.document_loaders import PyMuPDFLoader, UnstructuredExcelLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.document_loaders.parsers import LLMImageBlobParser
from langchain_openai import ChatOpenAI
from core.config import OPENAI_API_KEY, OPENAI_CHAT_MODEL
import pandas as pd
from typing import List

def process_pdf(file_path: str, file_id: str, original_filename: str) -> List[Document]:
    """Process a PDF document and split it into chunks."""

    loader = PyMuPDFLoader(
        file_path,
        mode="page",
        images_inner_format="markdown-img",
        extract_tables="markdown",
        images_parser=LLMImageBlobParser(model=ChatOpenAI(api_key=OPENAI_API_KEY, model=OPENAI_CHAT_MODEL, max_tokens=1024)),
    )
    documents = loader.load()
    
    # Update metadata with original filename and file_id
    for doc in documents:
        doc.metadata["filename"] = original_filename
        doc.metadata["file_id"] = file_id
        # Add 1 to the page number to match the page number in the PDF
        doc.metadata["page"] = doc.metadata["page"] + 1

    return documents

def process_excel(file_path: str, file_id: str, original_filename: str) -> List[Document]:
    """Process an Excel document and convert it to chunks."""
    try:
        # Try using UnstructuredExcelLoader first
        loader = UnstructuredExcelLoader(file_path)
        documents = loader.load()
        
        # Update metadata with original filename and file_id
        for doc in documents:
            doc.metadata["filename"] = original_filename
            doc.metadata["file_id"] = file_id
            
        # Split documents into smaller chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=10000,
            chunk_overlap=1000,
        )
        return text_splitter.split_documents(documents)
    
    except Exception:
        # Fallback to pandas for Excel processing
        documents = []
        df = pd.read_excel(file_path)
        
        # Process sheet data
        for i, row in df.iterrows():
            # Convert row to string representation
            row_content = " | ".join([f"{col}: {val}" for col, val in row.items()])
            
            # Create document
            doc = Document(
                page_content=row_content,
                metadata={
                    "filename": original_filename,
                    "row": i,
                    "sheet": "default",  # Could extract actual sheet name if needed
                }
            )
            documents.append(doc)
        
        return documents