import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, File, FileText, Trash2, Info, MoreHorizontal, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadedFile } from "@/types/api";
import { formatFileSize, formatDate } from "@/lib/utils";
import { 
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  Menubar,
} from "@/components/ui/menubar";

interface SidebarProps {
  files: UploadedFile[];
  onFileUpload: (file: File) => Promise<void>;
  onFileSelect: (fileId: string) => void;
  onFileDelete: (fileId: string) => Promise<void>;
  selectedFileId?: string;
  isLoading: boolean;
  isUploading: boolean;
  isDeleting: boolean;
}

const Sidebar = ({
  files,
  onFileUpload,
  onFileSelect,
  onFileDelete,
  selectedFileId,
  isLoading,
  isUploading,
  isDeleting,
}: SidebarProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const getFileIcon = (type: string) => {
    return type.includes('xlsx') || type.includes('xls') ? (
      <FileText className="h-4 w-4 mr-2" />
    ) : (
      <File className="h-4 w-4 mr-2" />
    );
  };

  return (
    <div className="w-72 border-r border-border h-screen flex flex-col bg-background">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-4">Files</h2>
        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            variant="outline"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload File
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Max file size: 5MB, Allowed file types: .xlsx, .xls, .pdf
          </p>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center p-4">
              No files uploaded yet
            </p>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <div 
                key={file.file_id} 
                className={`flex justify-between w-full min-w-0 items-center group ${selectedFileId === file.file_id ? 'bg-accent' : ''}`
                }>
                    <Button
                      className="flex-1 justify-start text-sm font-normal min-w-0 pr-2 hover:bg-transparent focus:bg-transparent"
                      onClick={() => onFileSelect(file.file_id)}
                      variant="ghost"
                      disabled={isDeleting && selectedFileId === file.file_id}
                    >
                      <div className="flex items-center min-w-0">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.filetype)}
                        </div>
                        <span className="truncate">{file.filename}</span>
                      </div>
                  </Button>
                      <Menubar className="ml-2 border-0 bg-transparent p-0">
                        <MenubarMenu>
                          <MenubarTrigger className="p-1 h-6 w-6 hover:bg-transparent focus:bg-transparent">
                            {isDeleting && selectedFileId === file.file_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </MenubarTrigger>
                          <MenubarContent>
                            <MenubarItem
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(
                                  `File Details:\n\nName: ${file.filename}\nSize: ${formatFileSize(file.size)}\nType: ${file.filetype}\nUploaded: ${formatDate(file.upload_date)}`
                                );
                              }}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              View Details
                            </MenubarItem>
                            <MenubarItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onFileDelete(file.file_id);
                              }}
                              className="text-red-500 focus:text-red-500"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </MenubarItem>
                          </MenubarContent>
                        </MenubarMenu>
                      </Menubar>
                    </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;