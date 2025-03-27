from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_INDEX_REGION = os.getenv("PINECONE_INDEX_REGION")
PINECONE_INDEX_CLOUD = os.getenv("PINECONE_INDEX_CLOUD")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL")

# Validate environment variables
if not OPENAI_API_KEY or not PINECONE_API_KEY or not PINECONE_INDEX_NAME or not PINECONE_INDEX_REGION or not PINECONE_INDEX_CLOUD or not OPENAI_EMBEDDING_MODEL or not OPENAI_CHAT_MODEL:
    raise ValueError("Missing required environment variables")