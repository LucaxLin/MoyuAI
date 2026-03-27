import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@moyu/db";
import bcrypt from "bcryptjs";
import { signIn } from "next-auth/react";

const loginSchema = z.object({
  email: z.string().email("无效的邮箱格式"),
  password: z.string().min(1, "请输入密码"),
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error.errors[0].message,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "邮箱或密码错误",
          },
        },
        { status: 401 }
      );
    }

    const loginAttempts = (
      await prisma.verification.findFirst({
        where: {
          email,
          type: "login",
          createdAt: {
            gte: new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    )
      ? ((await prisma.verification.findFirst({
          where: {
            email,
            type: "login",
          },
          orderBy: {
            createdAt: "desc",
          },
        }))?.metadata as { attemptCount?: number } | null)?.attemptCount || 0
      : 0;

    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "登录失败次数过多，请15分钟后再试",
          },
        },
        { status: 429 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const lastAttempt = await prisma.verification.findFirst({
        where: { email, type: "login" },
        orderBy: { createdAt: "desc" },
      });

      if (lastAttempt) {
        const currentAttemptCount =
          ((lastAttempt.metadata as { attemptCount?: number } | null)
            ?.attemptCount || 0) + 1;
        await prisma.verification.update({
          where: { id: lastAttempt.id },
          data: { metadata: { attemptCount: currentAttemptCount } },
        });
      } else {
        await prisma.verification.create({
          data: {
            email,
            code: "000000",
            type: "login",
            expiresAt: new Date(
              Date.now() + LOCKOUT_MINUTES * 60 * 1000
            ),
            isUsed: false,
            metadata: { attemptCount: 1 },
          },
        });
      }

      const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginAttempts - 1;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message:
              remainingAttempts > 0
                ? `邮箱或密码错误，剩余 ${remainingAttempts} 次尝试机会`
                : "登录失败次数过多，请15分钟后再试",
          },
        },
        { status: 401 }
      );
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "登录失败，请稍后重试",
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            theme: user.theme,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "服务器内部错误",
        },
      },
      { status: 500 }
    );
  }
}
