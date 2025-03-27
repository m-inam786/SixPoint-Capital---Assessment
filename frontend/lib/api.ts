import axios from 'axios';
import { ApiResponse, DocumentUploadResponse, QueryRequest, QueryResponse, UploadedFile } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadDocument = async (file: File): Promise<ApiResponse<DocumentUploadResponse>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload document',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

export const queryDocument = async (request: QueryRequest): Promise<ApiResponse<QueryResponse>> => {
  try {
    const response = await api.post('/api/query', request);
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to process query',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

export const deleteFile = async (fileId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(`/api/files/${fileId}`);
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete file',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

export const getFiles = async (): Promise<ApiResponse<UploadedFile[]>> => {
  try {
    const response = await api.get('/api/files');
    return {
      success: true,
      data: response.data.files,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get files',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};



