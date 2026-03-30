"use client";

import { useState, useRef, useEffect } from "react";
import { useMessages } from "@/hooks/useChat";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { getBlobProxyUrl } from "@/lib/blob-utils";

interface ChatInputProps {
  sessionId: string;
  onSend: (content: string, imageUrl?: string | null) => void;
  disabled?: boolean;
  initialImage?: string | null;
  onInitialImageUsed?: () => void;
}

export function ChatInput({ 
  sessionId, 
  onSend, 
  disabled = false,
  initialImage,
  onInitialImageUsed 
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { uploadedImage, uploadImage, setUploadedImage, isSending } = useMessages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImage && !uploadedImage) {
      setUploadedImage(initialImage);
      onInitialImageUsed?.();
    }
  }, [initialImage, uploadedImage, setUploadedImage, onInitialImageUsed]);

  const isDisabled = disabled || isSending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isDisabled) return;

    onSend(content, uploadedImage);
    setContent("");
    setUploadedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("文件大小不能超过10MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("不支持的文件格式");
      return;
    }

    setIsUploading(true);
    await uploadImage(file);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  return (
    <div className="border-t border-border bg-card dark:bg-card p-4 safe-bottom">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto w-full">
        {uploadedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={getBlobProxyUrl(uploadedImage)}
              alt="Uploaded"
              className="h-20 w-20 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2 md:gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={isDisabled || isUploading}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || isUploading}
            className="p-2 md:p-3 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDisabled ? "正在生成中..." : "请描述你想要生成的图片..."}
              rows={1}
              disabled={isDisabled}
              className="w-full px-4 py-2.5 md:py-3 bg-secondary dark:bg-secondary rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground disabled:opacity-50 transition-colors"
              style={{
                minHeight: "44px",
                maxHeight: "120px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!content.trim() || isDisabled}
            className="p-2.5 md:p-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-xl transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
