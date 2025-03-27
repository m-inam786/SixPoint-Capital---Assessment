export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DocumentUploadResponse {
  documentId: string;
  filename: string;
  uploadedAt: string;
}

export interface UploadedFile {
  file_id: string;
  filename: string;
  upload_date: string;
  filetype: string;
  size: number;
}

export interface QueryResponse {
  answer: string;
  sources: DocumentSource[];
  confidence: number;
}

export interface DocumentSource {
  text: string;
  page: number;
  relevance: number;
}

export interface QueryRequest {
  query: string;
  file_id?: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  sources?: DocumentSource[];
}