"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { Moon, Sun, Monitor, MessageSquare, User as UserIcon, Settings } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "react-hot-toast";
import { MoyuLogo } from "@/components/common/moyu-logo";

export function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, updateProfile, updatePassword, updateTheme, logout, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">("system");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (user) {
      console.log("Settings page - user updated:", user);
      console.log("Settings page - user avatar:", user.avatar);
      setName(user.name || "");
      setSelectedTheme((user.theme as "light" | "dark" | "system") || "system");
    }
  }, [user]);

  useEffect(() => {
    console.log("Settings page - session updated:", session);
    console.log("Settings page - session user avatar:", session?.user?.avatar);
  }, [session]);

  const handleSaveProfile = async () => {
    const result = await updateProfile({ name });
    if (result.success) {
      toast.success("个人信息更新成功");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("新密码至少8位");
      return;
    }

    const result = await updatePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleChangeTheme = async (newTheme: "light" | "dark" | "system") => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
    await updateTheme(newTheme);
  };

  const handleLogout = async () => {
    if (confirm("确定要退出登录吗？")) {
      await logout();
      router.push("/login");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data?.url) {
        const avatarUrl = result.data.url;
        await updateProfile({ avatar: avatarUrl });
        setAvatarPreview(undefined);
      } else {
        toast.error(result.error?.message || "头像上传失败");
      }
    } catch (error) {
      toast.error("头像上传失败，请稍后重试");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-cream-100 dark:bg-warm-dark safe-top">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-cream-100 dark:bg-warm-dark flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card dark:bg-card border-b border-border px-4 py-4 md:py-5 flex items-center justify-between flex-shrink-0 pt-safe-top">
        <div className="flex items-center gap-2">
          <MoyuLogo className="w-8 h-8 md:w-10 md:h-10" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">设置</h1>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/chat"
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-xl transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 w-full pb-safe-bottom">
          {/* Profile Section */}
          <div className="bg-card dark:bg-card rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              个人信息
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  头像
                </label>
                <div className="flex items-center gap-4">
                  {avatarPreview || user?.avatar ? (
                    <div className="relative">
                      <img
                        src={avatarPreview || user?.avatar || ""}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                      {name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="text-sm text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingAvatar ? "上传中..." : "点击更换头像"}
                    </button>
                    <span className="text-xs text-muted-foreground">支持 JPG、PNG，最大 5MB</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  昵称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="请输入昵称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">邮箱不可修改</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-xl transition-colors"
              >
                保存修改
              </button>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-card dark:bg-card rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              账号安全
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  当前密码
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="请输入当前密码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="请输入新密码（至少8位，包含数字和字母）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="请再次输入新密码"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-xl transition-colors"
              >
                修改密码
              </button>
            </div>
          </div>

          {/* Theme Section */}
          <div className="bg-card dark:bg-card rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">偏好设置</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                主题
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleChangeTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${selectedTheme === "light"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }`}
                >
                  <Sun className="w-6 h-6" />
                  <span className="text-sm">浅色</span>
                </button>

                <button
                  onClick={() => handleChangeTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${selectedTheme === "dark"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }`}
                >
                  <Moon className="w-6 h-6" />
                  <span className="text-sm">深色</span>
                </button>

                <button
                  onClick={() => handleChangeTheme("system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${selectedTheme === "system"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }`}
                >
                  <Monitor className="w-6 h-6" />
                  <span className="text-sm">跟随系统</span>
                </button>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="bg-card dark:bg-card rounded-2xl p-6 shadow-sm">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 border-2 border-destructive text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
