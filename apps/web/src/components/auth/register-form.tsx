"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return "密码至少8位";
    }
    if (!/[0-9]/.test(pwd)) {
      return "密码必须包含数字";
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      return "密码必须包含字母";
    }
    return "";
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordError(validatePassword(pwd));
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("请输入邮箱地址");
      return;
    }

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.sendCode(email, password);
      
      if (result.success) {
        toast.success("验证码已发送到您的邮箱");
        setStep("verify");
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(result.error?.message || "发送验证码失败");
      }
    } catch (err) {
      toast.error("发送验证码失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      const result = await authApi.sendCode(email, password);
      
      if (result.success) {
        toast.success("验证码已重新发送");
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(result.error?.message || "发送验证码失败");
      }
    } catch (err) {
      toast.error("发送验证码失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || code.length !== 6) {
      setError("请输入6位验证码");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.verifyCode(email, code);
      
      if (result.success) {
        toast.success("注册成功！");
        router.push("/login");
      } else {
        toast.error(result.error?.message || "验证失败");
      }
    } catch (err) {
      toast.error("验证失败，请稍后重试");
    } finally {
      setIsLoading(false);
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
            {step === "form" ? "创建您的账号" : "输入验证码"}
          </p>
        </div>

        {step === "form" ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
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
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-border rounded-xl placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                  placeholder="密码 (至少8位，包含数字和字母)"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  确认密码
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-border rounded-xl placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                  placeholder="确认密码"
                />
              </div>
            </div>

            {passwordError && (
              <div className="text-destructive text-sm">{passwordError}</div>
            )}
            {error && (
              <div className="text-destructive text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "发送中..." : "获取验证码"}
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                已有账号？{" "}
              </span>
              <Link
                href="/login"
                className="font-medium text-primary hover:text-primary/80"
              >
                去登录
              </Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerify}>
            <div className="rounded-2xl shadow-sm">
              <div>
                <label htmlFor="code" className="sr-only">
                  验证码
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="appearance-none relative block w-full px-4 py-3 border border-border rounded-xl placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-card text-center text-lg tracking-widest"
                  placeholder="请输入6位验证码"
                />
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm text-center">{error}</div>
            )}

            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "验证中..." : "确认注册"}
              </button>
              
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || isLoading}
                className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
              >
                {countdown > 0 ? `${countdown}秒后可重新发送` : "重新发送验证码"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                返回上一步
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
