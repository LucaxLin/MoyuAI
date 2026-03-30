import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@moyu/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "请先登录",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "缺少图片URL",
          },
        },
        { status: 400 }
      );
    }

    const existingImage = await prisma.image.findFirst({
      where: {
        url: imageUrl,
        userId: session.user.id,
        isFavorite: true,
      },
    });

    if (existingImage) {
      return NextResponse.json(
        {
          success: true,
          data: {
            message: "图片已在收藏中",
          },
        },
        { status: 200 }
      );
    }

    const image = await prisma.image.updateMany({
      where: {
        url: imageUrl,
        userId: session.user.id,
      },
      data: {
        isFavorite: true,
      },
    });

    if (image.count === 0) {
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

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "收藏成功",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Favorite error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "收藏失败，请稍后重试",
        },
      },
      { status: 500 }
    );
  }
}
