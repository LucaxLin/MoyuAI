import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@moyu/db";
import { sendVerificationCode } from "@/lib/email";

const sendCodeSchema = z.object({
  email: z.string().email("无效的邮箱格式"),
  password: z
    .string()
    .min(8, "密码至少8位")
    .regex(/[0-9]/, "密码必须包含数字")
    .regex(/[a-zA-Z]/, "密码必须包含字母"),
});

const VERIFICATION_EXPIRY_MINUTES = 10;
const RESEND_INTERVAL_MINUTES = 5;

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = sendCodeSchema.safeParse(body);

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

    const recentVerification = await prisma.verification.findFirst({
      where: {
        email,
        type: "register",
        createdAt: {
          gte: new Date(Date.now() - RESEND_INTERVAL_MINUTES * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentVerification) {
      const remainingSeconds = Math.ceil(
        (RESEND_INTERVAL_MINUTES * 60 * 1000 -
          (Date.now() - recentVerification.createdAt.getTime())) /
          1000
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: `请 ${Math.ceil(remainingSeconds / 60)} 分钟后再试`,
          },
        },
        { status: 429 }
      );
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(
      Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000
    );

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.verification.create({
      data: {
        email,
        code,
        type: "register",
        expiresAt,
        isUsed: false,
        metadata: { passwordHash },
      },
    });

    try {
      await sendVerificationCode(email, code);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "发送验证码失败，请稍后重试",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "验证码已发送到您的邮箱",
          expiresIn: VERIFICATION_EXPIRY_MINUTES * 60,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send code error:", error);
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
