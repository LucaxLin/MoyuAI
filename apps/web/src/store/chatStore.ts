import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

interface ChatState {
  currentSession: Session | null;
  sessions: Session[];
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  uploadedImage: string | null;
  setCurrentSession: (session: Session | null) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, data: Partial<Session>) => void;
  removeSession: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setUploadedImage: (imageUrl: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentSession: null,
  sessions: [],
  messages: [],
  isLoading: false,
  isSending: false,
  uploadedImage: null,
};

export const useChatStore = create<ChatState>()((set) => ({
  ...initialState,
  setCurrentSession: (currentSession) => set({ currentSession }),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
    })),
  updateSession: (id, data) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
      currentSession:
        state.currentSession?.id === id
          ? { ...state.currentSession, ...data }
          : state.currentSession,
    })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSession:
        state.currentSession?.id === id ? null : state.currentSession,
      messages: state.currentSession?.id === id ? [] : state.messages,
    })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSending: (isSending) => set({ isSending }),
  setUploadedImage: (uploadedImage) => set({ uploadedImage }),
  reset: () => set(initialState),
}));
