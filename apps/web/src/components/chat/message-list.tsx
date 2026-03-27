"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/useChat";
import { type Message } from "@/store/chatStore";
import { Heart, Download, Edit, Image as ImageIcon } from "lucide-react";

interface MessageListProps {
  sessionId: string;
  onImageClick?: (imageUrl: string) => void;
  onFavorite?: (imageUrl: string) => void;
}

export function MessageList({ sessionId, onImageClick, onFavorite }: MessageListProps) {
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
          />
        ))}
        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
              AI
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
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
}

function MessageBubble({ message, onImageClick, onFavorite }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
            isUser ? "bg-indigo-600" : "bg-green-600"
          }`}
        >
          {isUser ? "U" : "AI"}
        </div>
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
                src={message.imageUrl}
                alt="Generated"
                onClick={() => onImageClick?.(message.imageUrl!)}
                className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onFavorite?.(message.imageUrl!)}
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open(message.imageUrl, "_blank")}
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(message.imageUrl!);
                  }}
                  className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4" />
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
