import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, FileText, ExternalLink, RefreshCw } from "lucide-react";
import { Message, DocumentSource } from "@/types/api";

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  selectedFile?: { id: string; name: string };
  isLoading: boolean;
  onRefreshChat: () => void;
}

const Chat = ({ messages, onSendMessage, selectedFile, isLoading, onRefreshChat }: ChatProps) => {
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {selectedFile ? (
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">
            Discussing: <span className="text-primary">{selectedFile.name}</span>
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefreshChat} 
            title="Clear chat history"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Chat</h2>
            <p className="text-xs text-muted-foreground mt-1">
              No file selected. All uploaded files will be used. Select a specific file for more focused Q&A.
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefreshChat} 
            title="Clear chat history"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start a conversation!</p>
              {!selectedFile && (
                <div className="text-sm mt-2">
                  <p>No file selected - all uploaded files will be used for answering queries.</p>
                  <p className="mt-1">Try selecting a specific file from the sidebar for more focused Q&A.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    
                    {/* Display sources if they exist and the message is from AI */}
                    {message.role === "ai" && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold mb-1">Sources:</p>
                        <div className="space-y-1">
                          {message.sources.map((source, index) => (
                            <div key={index} className="flex items-start gap-1">
                              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <p className="text-xs opacity-80">
                                {source.text}
                                {source.page !== undefined && (
                                  <span className="ml-1 italic">
                                    (Page {source.page})
                                  </span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-2 rounded-lg bg-muted">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              selectedFile
                ? `Ask about ${selectedFile.name}...`
                : "Type a message..."
            }
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Chat;