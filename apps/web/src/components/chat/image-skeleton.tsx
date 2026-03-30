"use client";

interface ImageSkeletonProps {
  width?: number;
  height?: number;
  progress?: number;
}

export function ImageSkeleton({ width = 512, height = 288, progress }: ImageSkeletonProps) {
  return (
    <div 
      className="relative overflow-hidden rounded-xl bg-muted dark:bg-muted max-w-full"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* 骨架屏动画 */}
      <div className="absolute inset-0 -translate-x-full animate-pulse bg-gradient-to-r from-muted via-accent to-muted dark:from-muted dark:via-accent dark:to-muted" />
      
      {/* 加载图标 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      
      {/* 百分比进度 */}
      {progress !== undefined && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}
