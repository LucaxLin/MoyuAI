import { ChatPage } from "@/components/chat/chat-page";
import { Suspense } from "react";

interface ChatSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="text-gray-500">加载中...</div></div>}>
      <ChatPage sessionId={sessionId} />
    </Suspense>
  );
}
