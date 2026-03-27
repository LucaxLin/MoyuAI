"use client";

import { useCallback } from "react";
import { useChatStore, type Session, type Message } from "@/store/chatStore";
import { sessionApi, messageApi, imageApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export function useSessions() {
  const {
    sessions,
    currentSession,
    isLoading,
    setSessions,
    setCurrentSession,
    addSession,
    updateSession,
    removeSession,
    setLoading,
  } = useChatStore();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await sessionApi.list();
      
      if (result.success && result.data?.sessions) {
        setSessions(result.data.sessions as Session[]);
      }
    } catch (error) {
      toast.error("获取会话列表失败");
    } finally {
      setLoading(false);
    }
  }, [setSessions, setLoading]);

  const createSession = useCallback(async (title?: string) => {
    try {
      const result = await sessionApi.create(title);
      
      if (result.success && result.data?.session) {
        const newSession = result.data.session as Session;
        addSession(newSession);
        setCurrentSession(newSession);
        toast.success("创建会话成功");
        return { success: true, session: newSession };
      } else {
        toast.error(result.error?.message || "创建会话失败");
        return { success: false };
      }
    } catch (error) {
      toast.error("创建会话失败");
      return { success: false };
    }
  }, [addSession, setCurrentSession]);

  const deleteSession = useCallback(async (id: string) => {
    try {
      const result = await sessionApi.delete(id);
      
      if (result.success) {
        removeSession(id);
        toast.success("删除会话成功");
        return { success: true };
      } else {
        toast.error(result.error?.message || "删除会话失败");
        return { success: false };
      }
    } catch (error) {
      toast.error("删除会话失败");
      return { success: false };
    }
  }, [removeSession]);

  const updateSessionTitle = useCallback(async (id: string, title: string) => {
    try {
      const result = await sessionApi.update(id, title);
      
      if (result.success) {
        updateSession(id, { title });
        return { success: true };
      } else {
        toast.error(result.error?.message || "更新会话失败");
        return { success: false };
      }
    } catch (error) {
      toast.error("更新会话失败");
      return { success: false };
    }
  }, [updateSession]);

  return {
    sessions,
    currentSession,
    isLoading,
    fetchSessions,
    createSession,
    deleteSession,
    updateSessionTitle,
    setCurrentSession,
  };
}

export function useMessages() {
  const {
    messages,
    isSending,
    setMessages,
    addMessage,
    setSending,
    uploadedImage,
    setUploadedImage,
  } = useChatStore();

  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      setSending(true);
      const result = await messageApi.list(sessionId);
      
      if (result.success && result.data?.messages) {
        setMessages(result.data.messages as Message[]);
      }
    } catch (error) {
      toast.error("获取消息失败");
    } finally {
      setSending(false);
    }
  }, [setMessages, setSending]);

  const sendMessage = useCallback(async (
    sessionId: string,
    content: string,
    imageUrl?: string | null,
    editRegion?: { x: number; y: number; width: number; height: number } | null
  ) => {
    try {
      setSending(true);
      
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        imageUrl: imageUrl || undefined,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMessage);

      const result = await messageApi.send(sessionId, {
        content,
        imageUrl,
        editRegion,
      });
      
      if (result.success && result.data?.message) {
        setUploadedImage(null);
        return { success: true, message: result.data.message };
      } else {
        toast.error(result.error?.message || "发送消息失败");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("发送消息失败");
      return { success: false };
    } finally {
      setSending(false);
    }
  }, [addMessage, setSending, setUploadedImage]);

  const deleteMessage = useCallback(async (id: string) => {
    try {
      const result = await messageApi.delete(id);
      
      if (result.success) {
        setMessages(messages.filter(m => m.id !== id));
        toast.success("删除消息成功");
        return { success: true };
      } else {
        toast.error(result.error?.message || "删除消息失败");
        return { success: false };
      }
    } catch (error) {
      toast.error("删除消息失败");
      return { success: false };
    }
  }, [messages, setMessages]);

  const uploadImage = useCallback(async (file: File) => {
    try {
      const result = await imageApi.upload(file);
      
      if (result.success && result.data) {
        const url = (result.data as { url: string }).url;
        setUploadedImage(url);
        return { success: true, url };
      } else {
        toast.error(result.error?.message || "上传图片失败");
        return { success: false };
      }
    } catch (error) {
      toast.error("上传图片失败");
      return { success: false };
    }
  }, [setUploadedImage]);

  return {
    messages,
    isSending,
    uploadedImage,
    fetchMessages,
    sendMessage,
    deleteMessage,
    uploadImage,
    setUploadedImage,
  };
}
