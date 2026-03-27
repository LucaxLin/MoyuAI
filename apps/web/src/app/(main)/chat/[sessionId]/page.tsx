import { ChatPage } from "@/components/chat/chat-page";

interface ChatSessionPageProps {
  params: {
    sessionId: string;
  };
}

export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  return <ChatPage sessionId={params.sessionId} />;
}
