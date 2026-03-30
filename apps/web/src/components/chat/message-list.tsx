"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useMessages } from "@/hooks/useChat";
import { type Message } from "@/store/chatStore";
import { Heart, Download, Edit, Image as ImageIcon, Reply } from "lucide-react";
import { getBlobProxyUrl } from "@/lib/blob-utils";
import { GeneratingIndicator } from "./generating-indicator";
import { ImageSkeleton } from "./image-skeleton";
import { AIAvatar } from "@/components/common/ai-avatar";
import { MoyuLogo } from "@/components/common/moyu-logo";
import { ImageModal } from "@/components/common/image-modal";
import { toast } from "react-hot-toast";

interface MessageListProps {
  sessionId: string;
  isGenerating?: boolean;
  onImageClick?: (imageUrl: string) => void;
  onFavorite?: (imageUrl: string) => void;
  onQuoteImage?: (imageUrl: string) => void;
  onSendMessage?: (content: string) => void;
}

export function MessageList({ sessionId, isGenerating = false, onImageClick, onFavorite, onQuoteImage, onSendMessage }: MessageListProps) {
  const { messages, isSending, fetchMessages } = useMessages();
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId);
    }
  }, [sessionId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const userAvatar = session?.user?.avatar;
  const userName = session?.user?.name || session?.user?.email?.[0]?.toUpperCase() || "U";

  if (!sessionId || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cream-100 dark:bg-warm-dark p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent dark:bg-accent flex items-center justify-center overflow-hidden">
            <MoyuLogo className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            欢迎使用墨语
          </h2>
          <p className="text-muted-foreground mb-6">
            通过自然语言描述，快速生成AI艺术作品
          </p>
          <div className="text-sm space-y-2 bg-secondary dark:bg-secondary rounded-xl p-4">
            <p className="text-muted-foreground">示例提示词：</p>
            <button
              onClick={() => onSendMessage?.("帮我画一幅日落海景")}
              className="w-full text-left text-primary font-medium hover:text-primary/80 transition-colors"
            >
              帮我画一幅日落海景
            </button>
            <button
              onClick={() => onSendMessage?.("一只可爱的橘猫在草地上玩耍")}
              className="w-full text-left text-primary font-medium hover:text-primary/80 transition-colors"
            >
              一只可爱的橘猫在草地上玩耍
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-cream-100 dark:bg-warm-dark p-4">
      <div className="max-w-4xl mx-auto space-y-4 w-full">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onImageClick={onImageClick}
            onFavorite={onFavorite}
            onQuoteImage={onQuoteImage}
            userAvatar={userAvatar || undefined}
            userName={userName}
            onImageModal={(url) => setModalImage(url)}
          />
        ))}
        {isGenerating && (
          <div className="flex items-start gap-3">
            <AIAvatar size="md" />
            <div className="bg-card dark:bg-card rounded-xl px-4 py-3 shadow-sm flex-1 max-w-xl">
              <GeneratingIndicator message="正在生成图片，请稍候..." />
              <ImageSkeleton width={512} height={288} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {modalImage && (
        <ImageModal
          src={modalImage}
          alt="Preview"
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onImageClick?: (imageUrl: string) => void;
  onFavorite?: (imageUrl: string) => void;
  onQuoteImage?: (imageUrl: string) => void;
  userAvatar?: string;
  userName?: string;
  onImageModal?: (imageUrl: string) => void;
}

function MessageBubble({ message, onImageClick, onFavorite, onQuoteImage, userAvatar, userName, onImageModal }: MessageBubbleProps) {
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
      <div className={`flex items-start gap-3 max-w-[85%] md:max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
        {isUser ? (
          userAvatar ? (
            <img
              src={userAvatar}
              alt="User"
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium flex-shrink-0 bg-primary">
              {userName?.[0]?.toUpperCase() || "U"}
            </div>
          )
        ) : (
          <AIAvatar size="md" />
        )}
        <div className="flex flex-col gap-2">
          <div
            className={`px-4 py-2 rounded-xl ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-card dark:bg-card text-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          {message.imageUrl && (
            <div className="relative group">
              <img
                src={getBlobProxyUrl(message.imageUrl)}
                alt="Generated"
                onClick={() => onImageModal?.(getBlobProxyUrl(message.imageUrl!))}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
                className="rounded-xl max-w-full cursor-pointer hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(message.imageUrl!);
                  }}
                  className="p-2 bg-card/90 dark:bg-card/90 rounded-full shadow-md hover:bg-accent dark:hover:bg-accent backdrop-blur-sm"
                  title="收藏"
                >
                  <Heart className="w-4 h-4 text-pink-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(message.imageUrl!);
                  }}
                  className="p-2 bg-card/90 dark:bg-card/90 rounded-full shadow-md hover:bg-accent dark:hover:bg-accent backdrop-blur-sm"
                  title="下载"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuoteImage(message.imageUrl!);
                  }}
                  className="p-2 bg-card/90 dark:bg-card/90 rounded-full shadow-md hover:bg-accent dark:hover:bg-accent backdrop-blur-sm"
                  title="引用图片"
                >
                  <Reply className="w-4 h-4 text-green-500" />
                </button>
              </div>
            </div>
          )}
          <p className={`text-xs text-muted-foreground ${isUser ? "text-right" : ""}`}>
            {new Date(message.createdAt).toLocaleString("zh-CN")}
          </p>
        </div>
      </div>
    </div>
  );
}
