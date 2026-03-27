"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGallery } from "@/hooks/useGallery";
import { ImageGrid } from "./image-grid";
import { ImageDetailPage } from "./image-detail-page";
import { Moon, Sun, Settings, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

export function GalleryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { images, isLoading, hasMore, fetchImages, filter, updateFilter, sort, updateSort } = useGallery();
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchImages(true);
  }, [fetchImages, filter, sort]);

  const handleImageClick = (imageId: string) => {
    setSelectedImageId(imageId);
  };

  const handleBack = () => {
    setSelectedImageId(null);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (selectedImageId) {
    return <ImageDetailPage imageId={selectedImageId} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">我的图库</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            href="/chat"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">筛选:</span>
            <select
              value={filter}
              onChange={(e) => updateFilter(e.target.value)}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              <option value="today">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">排序:</span>
            <select
              value={sort}
              onChange={(e) => updateSort(e.target.value)}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="desc">最新</option>
              <option value="asc">最旧</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {images.length === 0 && !isLoading ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 mb-4">暂无收藏的图片</p>
            <Link
              href="/chat"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              去创作第一张图片
            </Link>
          </div>
        ) : (
          <>
            <ImageGrid images={images} onImageClick={handleImageClick} />
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={() => fetchImages(false)}
                  disabled={isLoading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  {isLoading ? "加载中..." : "加载更多"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
