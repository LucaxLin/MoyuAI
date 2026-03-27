import { ChatPage } from "@/components/chat/chat-page";

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function ChatSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  return <ChatPage sessionId={sessionId} />;
}
