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
import { MoyuLogo } from "@/components/common/moyu-logo";

export function ChatPage({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { fetchMessages, addMessage, setUploadedImage } = useMessages();
  const { currentSession, sessions, fetchSessions, createSession, setCurrentSession } = useSessions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<{ content: string; imageUrl?: string | null } | null>(null);
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

  useEffect(() => {
    if (sessionId && pendingMessage && currentSession?.id === sessionId) {
      const { content, imageUrl } = pendingMessage;
      setPendingMessage(null);
      const sendPendingMessage = async () => {
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
      sendPendingMessage();
    }
  }, [sessionId, pendingMessage, currentSession]);

  const handleSelectSession = async (selectedSession: Session) => {
    if (selectedSession.id === sessionId) {
      setSidebarOpen(false);
      return;
    }
    
    setCurrentSession(selectedSession);
    setSidebarOpen(false);
    router.push(`/chat/${selectedSession.id}`);
  };

  const handleSendMessage = async (content: string, imageUrl?: string | null) => {
    let targetSession = currentSession;
    
    if (!sessionId) {
      const result = await createSession();
      if (!result.success || !result.session) return;
      targetSession = result.session;
      setCurrentSession(targetSession);
      setPendingMessage({ content, imageUrl });
      setSidebarOpen(false);
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

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (!mounted || status === "loading") {
    return (
      <div className="h-screen w-full flex flex-col bg-cream-100 dark:bg-warm-dark safe-top" />
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-cream-100 dark:bg-warm-dark overflow-hidden">
      {/* Header */}
      <header className="bg-card dark:bg-card border-b border-border px-4 py-4 md:py-5 flex items-center justify-between flex-shrink-0 pt-safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors md:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <MoyuLogo className="w-10 h-10 md:w-12 md:h-12" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">墨语</h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            href="/gallery"
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors"
            title="我的图库"
          >
            <BookImage className="w-5 h-5" />
          </Link>
          <Link
            href="/settings"
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeSidebar}
          />
        )}
        
        {/* Sidebar Drawer */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed md:relative z-50 md:translate-x-0 md:z-auto h-screen md:h-full w-80 md:w-72 transition-transform duration-300 ease-in-out flex-shrink-0 top-0`}
        >
          <div className="h-full overflow-y-auto bg-secondary dark:bg-secondary pt-safe-top">
            <SessionList
              onSelectSession={handleSelectSession}
              selectedSessionId={sessionId || currentSession?.id}
              onClose={closeSidebar}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col w-full min-w-0">
          <MessageList
            sessionId={sessionId || ""}
            isGenerating={isGenerating}
            onQuoteImage={(imageUrl) => setRefImage(imageUrl)}
            onSendMessage={handleSendMessage}
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
