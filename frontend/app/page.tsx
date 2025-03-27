'use client';

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import { v4 as uuidv4 } from "uuid";
import { getFiles, deleteFile, uploadDocument, queryDocument } from "@/lib/api";
import { UploadedFile, Message } from "@/types/api";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
  const [isFileDeleting, setIsFileDeleting] = useState<boolean>(false);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await getFiles();
      if (response.success && response.data) {
        setFiles(response.data);
      } else {
        toast({
          title: "Error fetching files",
          description: response.error || "Failed to load files",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (file: File) => {
    // Check file size - 5MB limit
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsFileUploading(true);
      const response = await uploadDocument(file);
      if (response.success) {
        await fetchFiles(); // Refresh the file list
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } else {
        toast({
          title: "Upload failed",
          description: response.error || "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload error",
        description: "An unexpected error occurred while uploading",
        variant: "destructive",
      });
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      setIsFileDeleting(true);
      const response = await deleteFile(fileId);
      if (response.success) {
        if (selectedFileId === fileId) {
          setSelectedFileId(undefined);
        }
        await fetchFiles(); // Refresh the file list
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
      } else {
        toast({
          title: "Delete failed",
          description: response.error || "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
          title: "Delete error",
          description: "An unexpected error occurred while deleting",
          variant: "destructive",
      });
    } finally {
      setIsFileDeleting(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessageId = uuidv4();
    const userMessage = {
      id: userMessageId,
      content,
      role: "user" as "user" | "ai",
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage as Message]);
    setIsSendingMessage(true);

    // Convert messages to API format
    const apiMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toString(),
      sources: msg.sources
    }));

    try {
      const response = await queryDocument({
        query: content,
        file_id: selectedFileId,
        messages: [...apiMessages, {
          id: userMessageId,
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        }]
      });

      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            content: response?.data?.answer || '',
            role: "ai",
            timestamp: new Date().toISOString(),
            sources: response?.data?.sources || []
          },
        ]);
      } else {
        toast({
          title: "Query failed",
          description: response.error || "Failed to get response",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      console.error('Error querying document:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRefreshChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "Chat history has been cleared",
    });
  };

  const selectedFile = files.find((f) => f.file_id === selectedFileId);

  return (
    <main className="flex h-screen overflow-hidden">
      <Sidebar
        files={files}
        onFileUpload={handleFileUpload}
        onFileSelect={setSelectedFileId}
        onFileDelete={handleFileDelete}
        selectedFileId={selectedFileId}
        isLoading={isLoading}
        isUploading={isFileUploading}
        isDeleting={isFileDeleting}
      />
      <div className="flex-1">
        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          selectedFile={selectedFile ? { id: selectedFile.file_id, name: selectedFile.filename } : undefined}
          isLoading={isSendingMessage}
          onRefreshChat={handleRefreshChat}
        />
      </div>
      <Toaster />
    </main>
  );
}