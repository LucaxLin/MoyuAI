"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SessionList } from "./session-list";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useSessions, useMessages } from "@/hooks/useChat";
import { type Session } from "@/store/chatStore";
import { Menu, X, Moon, Sun, Settings, User } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

export function ChatPage({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { currentSession, setCurrentSession, fetchMessages, addMessage } = useMessages();
  const { sessions, fetchSessions, createSession } = useSessions();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    if (sessionId) {
      const existingSession = sessions.find(s => s.id === sessionId);
      if (existingSession) {
        setCurrentSession(existingSession);
      }
    }
  }, [sessionId, sessions, setCurrentSession]);

  const handleSelectSession = async (selectedSession: Session) => {
    setCurrentSession(selectedSession);
    router.push(`/chat/${selectedSession.id}`);
  };

  const handleSendMessage = async (content: string, imageUrl?: string | null) => {
    let targetSession = currentSession;
    
    if (!targetSession) {
      const result = await createSession();
      if (!result.success || !result.session) return;
      targetSession = result.session;
      setCurrentSession(targetSession);
      router.push(`/chat/${targetSession.id}`);
    }

    await fetchMessages(targetSession.id);
    await addMessage({
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
    });

    const response = await fetch(`/api/sessions/${targetSession.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageUrl }),
    });

    const data = await response.json();
    
    if (data.success && data.data?.message) {
      await fetchMessages(targetSession.id);
    }
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

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">墨语</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            href="/gallery"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <User className="w-5 h-5" />
          </Link>
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 overflow-hidden flex-shrink-0`}
        >
          <SessionList
            onSelectSession={handleSelectSession}
            selectedSessionId={currentSession?.id}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <MessageList
            sessionId={currentSession?.id || ""}
          />
          <ChatInput
            sessionId={currentSession?.id || ""}
            onSend={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}
