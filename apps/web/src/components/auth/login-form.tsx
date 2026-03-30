"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("请填写所有必填项");
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push("/chat");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cream-100 dark:bg-warm-dark py-12 px-4 safe-top safe-bottom">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            墨语 (MoyuAI)
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            AI驱动的创意画布
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-2xl shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-border rounded-xl placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                placeholder="邮箱地址"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-border rounded-xl placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                  placeholder="密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm leading-5"
                >
                  {showPassword ? "隐藏" : "显示"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              还没有账号？{" "}
            </span>
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary/80"
            >
              去注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
