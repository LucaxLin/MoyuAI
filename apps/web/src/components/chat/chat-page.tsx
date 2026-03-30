"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SessionList } from "./session-list";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useSessions, useMessages } from "@/hooks/useChat";
import { type Session } from "@/store/chatStore";
import { Menu, X, Moon, Sun, Settings, BookImage } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

export function ChatPage({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { fetchMessages, addMessage, setUploadedImage } = useMessages();
  const { currentSession, sessions, fetchSessions, createSession, setCurrentSession } = useSessions();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refImage, setRefImage] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const refImageParam = searchParams.get("refImage");
    if (refImageParam) {
      setRefImage(decodeURIComponent(refImageParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const existingSession = sessions.find(s => s.id === sessionId);
      if (existingSession && existingSession.id !== currentSession?.id) {
        setCurrentSession(existingSession);
      }
    }
  }, [sessionId, sessions, setCurrentSession, currentSession]);

  const handleSelectSession = async (selectedSession: Session) => {
    if (selectedSession.id === sessionId) {
      return;
    }
    
    setCurrentSession(selectedSession);
    router.push(`/chat/${selectedSession.id}`);
  };

  const handleSendMessage = async (content: string, imageUrl?: string | null) => {
    let targetSession = currentSession;
    
    if (!sessionId) {
      const result = await createSession();
      if (!result.success || !result.session) return;
      targetSession = result.session;
      setCurrentSession(targetSession);
      router.push(`/chat/${targetSession.id}`);
      return;
    }

    if (targetSession?.id !== sessionId) {
      const existingSession = sessions.find(s => s.id === sessionId);
      if (existingSession) {
        targetSession = existingSession;
        setCurrentSession(existingSession);
      } else {
        await fetchSessions();
        const foundSession = sessions.find(s => s.id === sessionId);
        if (foundSession) {
          targetSession = foundSession;
          setCurrentSession(foundSession);
        }
      }
    }

    await addMessage({
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
    });

    setIsGenerating(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.message) {
        await fetchMessages(sessionId);
      }
    } finally {
      setIsGenerating(false);
      setUploadedImage(null);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted || status === "loading") {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" />
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
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
            title="我的图库"
          >
            <BookImage className="w-5 h-5" />
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
            selectedSessionId={sessionId || currentSession?.id}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <MessageList
            sessionId={sessionId || ""}
            isGenerating={isGenerating}
            onQuoteImage={(imageUrl) => setRefImage(imageUrl)}
          />
          <ChatInput
            sessionId={sessionId || ""}
            onSend={handleSendMessage}
            disabled={isGenerating}
            initialImage={refImage}
            onInitialImageUsed={() => setRefImage(null)}
          />
        </div>
      </div>
    </div>
  );
}
