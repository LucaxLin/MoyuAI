"use client";

import { useEffect, useState } from "react";
import { useSessions } from "@/hooks/useChat";
import { type Session } from "@/store/chatStore";
import { MessageSquare, Plus, Trash2, Check, X } from "lucide-react";

interface SessionListProps {
  onSelectSession: (session: Session) => void;
  selectedSessionId?: string;
}

export function SessionList({ onSelectSession, selectedSessionId }: SessionListProps) {
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
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCreateSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建会话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            暂无会话
          </div>
        ) : (
          <div className="py-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`group mx-2 mb-1 px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                  selectedSessionId === session.id
                    ? "bg-indigo-100 dark:bg-indigo-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate text-sm">{session.title || "新会话"}</span>
                </div>
                {confirmDeleteId === session.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleConfirmDelete(e, session.id)}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
                      title="确认删除"
                    >
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                      title="取消删除"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleShowDeleteConfirm(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-opacity"
                    title="删除会话"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
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
