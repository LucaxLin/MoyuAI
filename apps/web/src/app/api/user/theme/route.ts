import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@moyu/db";

const updateThemeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "未登录",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateThemeSchema.safeParse(body);

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

    const { theme } = validation.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        theme,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        theme: true,
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
            avatar: user.avatar,
            theme: user.theme,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update theme error:", error);
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
