"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/useChat";
import { type Message } from "@/store/chatStore";
import { Heart, Download, Edit, Image as ImageIcon, Reply } from "lucide-react";
import { getBlobProxyUrl } from "@/lib/blob-utils";
import { GeneratingIndicator } from "./generating-indicator";
import { ImageSkeleton } from "./image-skeleton";
import { AIAvatar } from "@/components/common/ai-avatar";
import { toast } from "react-hot-toast";

interface MessageListProps {
  sessionId: string;
  isGenerating?: boolean;
  onImageClick?: (imageUrl: string) => void;
  onFavorite?: (imageUrl: string) => void;
  onQuoteImage?: (imageUrl: string) => void;
}

export function MessageList({ sessionId, isGenerating = false, onImageClick, onFavorite, onQuoteImage }: MessageListProps) {
  const { messages, isSending, fetchMessages } = useMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId);
    }
  }, [sessionId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            欢迎使用墨语
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            通过自然语言描述，快速生成AI艺术作品
          </p>
          <div className="text-sm text-gray-400 dark:text-gray-500 space-y-1">
            <p>示例提示词：</p>
            <p className="text-indigo-500 dark:text-indigo-400">帮我画一幅日落海景</p>
            <p className="text-indigo-500 dark:text-indigo-400">一只可爱的橘猫在草地上玩耍</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onImageClick={onImageClick}
            onFavorite={onFavorite}
            onQuoteImage={onQuoteImage}
          />
        ))}
        {isGenerating && (
          <div className="flex items-start gap-3">
            <AIAvatar size="md" />
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm flex-1 max-w-xl">
              <GeneratingIndicator message="正在生成图片，请稍候..." />
              <ImageSkeleton width={512} height={288} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onImageClick?: (imageUrl: string) => void;
  onFavorite?: (imageUrl: string) => void;
  onQuoteImage?: (imageUrl: string) => void;
}

function MessageBubble({ message, onImageClick, onFavorite, onQuoteImage }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const handleFavorite = async (imageUrl: string) => {
    try {
      const response = await fetch("/api/gallery/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("已添加到收藏");
      } else {
        toast.error(result.error?.message || "收藏失败");
      }
    } catch (error) {
      toast.error("收藏失败，请稍后重试");
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const proxyUrl = getBlobProxyUrl(imageUrl);
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moyu-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("下载成功");
    } catch (error) {
      toast.error("下载失败，请稍后重试");
    }
  };

  const handleCopyLink = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl).then(() => {
      toast.success("链接已复制到剪贴板");
    }).catch(() => {
      toast.error("复制失败");
    });
  };

  const handleQuoteImage = (imageUrl: string) => {
    onQuoteImage?.(imageUrl);
    toast.success("已引用图片到输入框");
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
        {isUser ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 bg-purple-600">
            8
          </div>
        ) : (
          <AIAvatar size="md" />
        )}
        <div className="flex flex-col gap-2">
          <div
            className={`px-4 py-2 rounded-lg ${
              isUser
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          {message.imageUrl && (
            <div className="relative group">
              <img
                src={getBlobProxyUrl(message.imageUrl)}
                alt="Generated"
                onClick={() => onImageClick?.(message.imageUrl!)}
                className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(message.imageUrl!);
                  }}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-sm"
                  title="收藏"
                >
                  <Heart className="w-4 h-4 text-pink-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(message.imageUrl!);
                  }}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-sm"
                  title="下载"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuoteImage(message.imageUrl!);
                  }}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-sm"
                  title="引用图片"
                >
                  <Reply className="w-4 h-4 text-green-500" />
                </button>
              </div>
            </div>
          )}
          <p className={`text-xs text-gray-400 ${isUser ? "text-right" : ""}`}>
            {new Date(message.createdAt).toLocaleString("zh-CN")}
          </p>
        </div>
      </div>
    </div>
  );
}
