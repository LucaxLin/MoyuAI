"use client";

import { useState, useRef } from "react";
import { useMessages } from "@/hooks/useChat";
import { Send, Image as ImageIcon, X } from "lucide-react";

interface ChatInputProps {
  sessionId: string;
  onSend: (content: string, imageUrl?: string | null) => void;
}

export function ChatInput({ sessionId, onSend }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { uploadedImage, uploadImage, setUploadedImage, isSending } = useMessages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending || !sessionId) return;

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

  if (!sessionId) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {uploadedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="h-20 w-20 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={isSending || isUploading}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请描述你想要生成的图片..."
              rows={1}
              disabled={isSending}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 disabled:opacity-50"
              style={{
                minHeight: "42px",
                maxHeight: "120px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!content.trim() || isSending}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </form>
    </div>
  );
}
