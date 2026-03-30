import { ChatPage } from "@/components/chat/chat-page";
import { Suspense } from "react";

export default function Chat() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="text-gray-500">加载中...</div></div>}>
      <ChatPage />
    </Suspense>
  );
}
