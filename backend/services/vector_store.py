from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore as LangchainPinecone
from langchain.schema import Document
from typing import List
from core.config import (
    OPENAI_API_KEY,
    OPENAI_EMBEDDING_MODEL,
    PINECONE_API_KEY,
    PINECONE_INDEX_REGION,
    PINECONE_INDEX_CLOUD,
    PINECONE_INDEX_NAME,
)
import uuid

# Initialize embedding model
embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY, model=OPENAI_EMBEDDING_MODEL)

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

# Create Pinecone index if it doesn't exist
if not pc.has_index(PINECONE_INDEX_NAME):
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        spec=ServerlessSpec(cloud=PINECONE_INDEX_CLOUD, region=PINECONE_INDEX_REGION),
        dimension=1536,
        metric="cosine",
    )

# initialize langchain pinecone vector store
pc_vectorstore = LangchainPinecone(pinecone_api_key=PINECONE_API_KEY, index_name=PINECONE_INDEX_NAME, embedding=embeddings)

def store_documents(documents: List[Document]):
    """Store documents in Pinecone vector database."""
    # Update document ids to follow family pattern for ids
    for i, doc in enumerate(documents):
        doc.id = f"{doc.metadata['file_id']}#chunk_{i+1}"
    pc_vectorstore.add_documents(documents)

def delete_documents(file_id: str):
    """Delete documents from Pinecone vector database."""
    vector_ids = pc.Index(PINECONE_INDEX_NAME).list(prefix=file_id+"#")
    for vector_id in vector_ids:
        pc.Index(PINECONE_INDEX_NAME).delete(ids=[vector_id])