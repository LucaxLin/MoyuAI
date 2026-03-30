"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGallery } from "@/hooks/useGallery";
import { useSessions } from "@/hooks/useChat";
import { ArrowLeft, Download, Heart, Trash2, Edit } from "lucide-react";
import { toast } from "react-hot-toast";
import { getBlobProxyUrl } from "@/lib/blob-utils";
interface ImageDetailPageProps {
  imageId: string;
  onBack?: () => void;
}

export function ImageDetailPage({ imageId, onBack }: ImageDetailPageProps) {
  const router = useRouter();
  const { currentImage, fetchImage, toggleFavorite, deleteImage } = useGallery();
  const { createSession } = useSessions();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      await fetchImage(imageId);
      setIsLoading(false);
    };
    loadImage();
  }, [imageId, fetchImage]);

  const handleFavorite = async () => {
    await toggleFavorite(imageId);
  };

  const handleDelete = async () => {
    if (confirm("确定要删除这张图片吗？")) {
      await deleteImage(imageId);
      onBack?.();
    }
  };

  const handleDownload = async () => {
    if (!currentImage) return;

    try {
      const proxyUrl = getBlobProxyUrl(currentImage.url);
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

  const handleEdit = async () => {
    if (!currentImage) return;

    try {
      const title = `引用创作：${currentImage.prompt?.slice(0, 30) || "无标题"}${currentImage.prompt && currentImage.prompt.length > 30 ? "..." : ""}`;
      const result = await createSession(title);
      
      if (result.success && result.session) {
        const sessionId = result.session.id;
        const imageUrl = currentImage.url;
        router.push(`/chat/${sessionId}?refImage=${encodeURIComponent(imageUrl)}`);
      } else {
        toast.error("创建会话失败");
      }
    } catch (error) {
      toast.error("创建会话失败");
    }
  };

  if (isLoading || !currentImage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack ?? (() => router.push("/gallery"))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">图片详情</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Image */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden mb-6">
          <img
            src={getBlobProxyUrl(currentImage.url)}
            alt={currentImage.prompt || "Generated image"}
            className="w-full h-auto"
          />
        </div>

        {/* Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">图片信息</h2>
          
          {currentImage.prompt && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">提示词</p>
              <p className="text-gray-900 dark:text-white">{currentImage.prompt}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">尺寸</p>
              <p className="text-gray-900 dark:text-white">
                {currentImage.width} x {currentImage.height}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">创建时间</p>
              <p className="text-gray-900 dark:text-white">
                {new Date(currentImage.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleFavorite}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
              currentImage.isFavorite
                ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${currentImage.isFavorite ? "fill-red-500" : ""}`} />
            {currentImage.isFavorite ? "取消收藏" : "收藏"}
          </button>
          
          <button
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
          >
            <Edit className="w-5 h-5" />
            引用创作
          </button>
          
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
