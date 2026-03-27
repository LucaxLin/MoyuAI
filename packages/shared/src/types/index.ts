export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  theme: "light" | "dark" | "system";
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  imageUrl: string | null;
  metadata: {
    prompt?: string;
    width?: number;
    height?: number;
    model?: string;
  } | null;
  createdAt: Date;
}

export interface Image {
  id: string;
  userId: string;
  sessionId: string | null;
  messageId: string | null;
  url: string;
  localPath: string;
  prompt: string | null;
  width: number | null;
  height: number | null;
  isFavorite: boolean;
  createdAt: Date;
}

export interface Verification {
  id: string;
  email: string;
  code: string;
  type: "register" | "login" | "reset";
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface EditRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}
