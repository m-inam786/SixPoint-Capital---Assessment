# Document Chat Assistant

A full-stack application that allows users to upload PDF or Excel files and chat with them using AI. The system implements Retrieval Augmented Generation (RAG) to provide accurate responses based on document content.

## Features

### Frontend
- File upload support for PDF and Excel documents
- Real-time chat interface with AI responses
- Source attribution for answers
- Modern UI with Tailwind CSS and shadcn/ui
- Full TypeScript support
- Responsive design

### Backend
- File upload and processing (PDF and Excel)
- Document chunking and embedding
- Vector storage with Pinecone
- RAG-powered query responses using OpenAI
- History-aware retrieval

## Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn
- Pinecone account
- OpenAI API key

## Setup Instructions

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sixpoint-captial-assessment
   ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file with the required environment variables:
   ```bash
   cp .env.example .env
   ```

6. Edit the `.env` file with your API keys:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PINECONE_API_KEY`: Your Pinecone API key
   - `PINECONE_ENVIRONMENT`: Your Pinecone environment
   - `PINECONE_INDEX`: Name of your Pinecone index
   - `OPENAI_CHAT_MODEL`: OpenAI model to use (e.g., "gpt-4o")

7. Run the backend server:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a local environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Update the `.env.local` with:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application at http://localhost:3000

## Using the Application

1. Upload a PDF or Excel file using the interface.
2. Wait for the file to be processed and indexed.
3. Optionally select the file from the sidebar for specific file-focused Q/A.
4. Type your questions about the document in the chat interface.
5. View the AI responses with source attribution.

## Current Limitations

Due to development time constraints, the following features were not fully implemented:

1. **Multimodal RAG for Images**
   - Currently, the application only uses text summaries of images extracted from PDFs.
   - A more accurate approach would store the extracted images and pass them directly to the LLM through multimodal prompt.

2. **Enhanced Excel Processing**
   - The current Excel file processing could be improved with a hybrid retrieval approach.
   - This would involve temporarily pushing Excel data to a SQL database and then using both SQL queries and vector search for more precise retrieval.

3. **Chat Message Streaming**
   - The application currently doesn't support streaming responses from the AI.
   - Implementing streaming would provide a more responsive user experience with faster feedback.

## Architecture

### Backend
- FastAPI for the REST API
- LangChain for document processing and RAG pipeline
- Pinecone for vector storage
- OpenAI for embeddings and query responses
- SQLite for file metadata storage

### Frontend
- Next.js React framework
- TypeScript for type safety
- Tailwind CSS for styling

## API Endpoints
- `POST /upload` - Upload and process documents
- `POST /query` - Query documents with chat history context
- `GET /files` - List all uploaded files
- `DELETE /files/{file_id}` - Delete a file
