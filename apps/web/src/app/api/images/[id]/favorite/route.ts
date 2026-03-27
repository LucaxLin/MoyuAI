import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@moyu/db";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

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

    const existingImage = await prisma.image.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingImage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "图片不存在",
          },
        },
        { status: 404 }
      );
    }

    const image = await prisma.image.update({
      where: {
        id,
      },
      data: {
        isFavorite: !existingImage.isFavorite,
      },
      select: {
        id: true,
        url: true,
        prompt: true,
        width: true,
        height: true,
        isFavorite: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          image,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Toggle favorite error:", error);
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
