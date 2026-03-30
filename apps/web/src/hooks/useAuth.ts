"use client";

import { useEffect, useCallback } from "react";
import { signIn, signOut, useSession, update } from "next-auth/react";
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
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("邮箱或密码错误");
        return { success: false, error: { code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" } };
      }

      const sessionResult = await authApi.getSession();
      if (sessionResult.success && sessionResult.data?.user) {
        setUser(sessionResult.data.user as User);
        toast.success("登录成功");
        return { success: true };
      } else {
        toast.error("登录状态获取失败");
        return { success: false };
      }
    } catch (error) {
      console.error("Login error:", error);
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
      
      console.log("updateProfile result:", result);
      
      if (result.success && result.data?.user) {
        const updatedUser = result.data.user as User;
        console.log("Updated user:", updatedUser);
        console.log("Updating with avatar:", updatedUser.avatar);
        setUser(updatedUser);
        await update({ name: updatedUser.name, avatar: updatedUser.avatar });
        toast.success("更新成功");
        return { success: true };
      } else {
        console.error("Update profile failed:", result.error);
        toast.error(result.error?.message || "更新失败");
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Update profile error:", error);
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
