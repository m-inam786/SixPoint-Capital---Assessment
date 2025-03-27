from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class Message(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    sources: Optional[List[Dict[str, Any]]] = None

class QueryRequest(BaseModel):
    query: str
    file_id: Optional[str] = None
    messages: List[Message]

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []

class FilesResponse(BaseModel):
    file_id: str
    filename: str
    upload_date: datetime
    filetype: str
    size: int

class ListFilesResponse(BaseModel):
    files: List[FilesResponse]