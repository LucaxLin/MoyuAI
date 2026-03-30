"use client";

import { useEffect, useState } from "react";
import { useSessions } from "@/hooks/useChat";
import { type Session } from "@/store/chatStore";
import { MessageSquare, Plus, Trash2, Check, X } from "lucide-react";

interface SessionListProps {
  onSelectSession: (session: Session) => void;
  selectedSessionId?: string;
  onClose?: () => void;
}

export function SessionList({ onSelectSession, selectedSessionId, onClose }: SessionListProps) {
  const { sessions, isLoading, fetchSessions, createSession, deleteSession } = useSessions();
  const [initialLoad, setInitialLoad] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoad && sessions.length === 0) {
      fetchSessions().finally(() => setInitialLoad(false));
    } else {
      setInitialLoad(false);
    }
  }, [fetchSessions, sessions.length, initialLoad]);

  const handleCreateSession = async () => {
    const result = await createSession();
    if (result.success && result.session) {
      onSelectSession(result.session);
    }
  };

  const handleShowDeleteConfirm = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="bg-secondary dark:bg-secondary flex flex-col h-full pt-safe-top">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">消息列表</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="p-4 border-b border-border">
        <button
          onClick={handleCreateSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建会话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            暂无会话
          </div>
        ) : (
          <div className="py-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`group mx-2 mb-1 px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                  selectedSessionId === session.id
                    ? "bg-primary/10 dark:bg-primary/20"
                    : "hover:bg-accent dark:hover:bg-accent"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{session.title || "新会话"}</span>
                </div>
                {confirmDeleteId === session.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleConfirmDelete(e, session.id)}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded-xl transition-colors"
                      title="确认删除"
                    >
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="p-1 hover:bg-destructive/10 rounded-xl transition-colors"
                      title="取消删除"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleShowDeleteConfirm(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded-xl transition-opacity"
                    title="删除会话"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
