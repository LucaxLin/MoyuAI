import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@moyu/db";

const verifySchema = z.object({
  email: z.string().email("无效的邮箱格式"),
  code: z.string().length(6, "验证码必须是6位数字"),
});

const MAX_VERIFY_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

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

    const { email, code } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_EXISTS",
            message: "该邮箱已注册",
          },
        },
        { status: 400 }
      );
    }

    const verification = await prisma.verification.findFirst({
      where: {
        email,
        type: "register",
        isUsed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CODE",
            message: "验证码不存在或已过期",
          },
        },
        { status: 400 }
      );
    }

    if (new Date() > verification.expiresAt) {
      await prisma.verification.update({
        where: { id: verification.id },
        data: { isUsed: true },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CODE",
            message: "验证码已过期",
          },
        },
        { status: 400 }
      );
    }

    if (verification.code !== code) {
      const attemptCount =
        (verification.metadata as { attemptCount?: number } | null)
          ?.attemptCount || 0;

      if (attemptCount >= MAX_VERIFY_ATTEMPTS - 1) {
        await prisma.verification.update({
          where: { id: verification.id },
          data: {
            isUsed: true,
            metadata: { attemptCount: attemptCount + 1 },
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_CODE",
              message: "验证码错误次数过多，请重新获取",
            },
          },
          { status: 400 }
        );
      }

      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          metadata: { attemptCount: attemptCount + 1 },
        },
      });

      const remainingAttempts = MAX_VERIFY_ATTEMPTS - attemptCount - 1;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CODE",
            message: `验证码错误，剩余 ${remainingAttempts} 次尝试机会`,
          },
        },
        { status: 400 }
      );
    }

    await prisma.verification.update({
      where: { id: verification.id },
      data: { isUsed: true },
    });

    const passwordHash = (verification.metadata as { passwordHash?: string })
      ?.passwordHash;

    if (!passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "注册信息不完整，请重新注册",
          },
        },
        { status: 500 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: null,
        avatar: null,
        theme: "system",
      },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        title: "新会话",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify code error:", error);
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
