"use client";

import { useEffect, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useAuthStore, type User } from "@/store/authStore";
import { authApi, userApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export function useAuth() {
  const { data: session, status } = useSession();
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    setLoading(status === "loading");
    if (session?.user) {
      setUser(session.user as User);
    }
  }, [session, status, setUser, setLoading]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authApi.login(email, password);
      
      if (result.success && result.data?.user) {
        setUser(result.data.user as User);
        await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        toast.success("登录成功");
        return { success: true };
      } else {
        toast.error(result.error?.message || "登录失败");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("登录失败，请稍后重试");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      storeLogout();
      await signOut({ redirect: false });
      toast.success("已退出登录");
    } catch (error) {
      toast.error("退出登录失败");
    }
  }, [storeLogout]);

  const updateProfile = useCallback(async (data: { name?: string; avatar?: string | null }) => {
    try {
      const result = await userApi.updateProfile(data);
      
      if (result.success && result.data?.user) {
        setUser(result.data.user as User);
        toast.success("更新成功");
        return { success: true };
      } else {
        toast.error(result.error?.message || "更新失败");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("更新失败，请稍后重试");
      return { success: false };
    }
  }, [setUser]);

  const updateTheme = useCallback(async (theme: "light" | "dark" | "system") => {
    try {
      const result = await userApi.updateTheme(theme);
      
      if (result.success && result.data?.user) {
        setUser(result.data.user as User);
        return { success: true };
      } else {
        toast.error(result.error?.message || "更新失败");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("更新失败，请稍后重试");
      return { success: false };
    }
  }, [setUser]);

  const updatePassword = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      const result = await userApi.updatePassword(data);
      
      if (result.success) {
        toast.success("密码修改成功");
        return { success: true };
      } else {
        toast.error(result.error?.message || "修改失败");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("修改失败，请稍后重试");
      return { success: false };
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || status === "loading",
    login,
    logout,
    updateProfile,
    updateTheme,
    updatePassword,
  };
}
