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
      <div className="min-h-screen w-full flex items-center justify-center bg-cream-100 dark:bg-warm-dark safe-top">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (selectedImageId) {
    return <ImageDetailPage imageId={selectedImageId} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen w-full bg-cream-100 dark:bg-warm-dark">
      {/* Header */}
      <header className="bg-card dark:bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10 safe-top">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">我的图库</h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            href="/chat"
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
          <Link
            href="/settings"
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-secondary dark:bg-secondary border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3 md:gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground">筛选:</span>
            <select
              value={filter}
              onChange={(e) => updateFilter(e.target.value)}
              className="px-3 py-1.5 bg-background dark:bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">全部</option>
              <option value="today">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground">排序:</span>
            <select
              value={sort}
              onChange={(e) => updateSort(e.target.value)}
              className="px-3 py-1.5 bg-background dark:bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="desc">最新</option>
              <option value="asc">最旧</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 w-full">
        {images.length === 0 && !isLoading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">暂无收藏的图片</p>
            <Link
              href="/chat"
              className="text-primary hover:text-primary/80"
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
                  className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-xl transition-colors"
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
