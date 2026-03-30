"use client";

interface GeneratingIndicatorProps {
  message?: string;
}

export function GeneratingIndicator({ message = "正在生成中" }: GeneratingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
