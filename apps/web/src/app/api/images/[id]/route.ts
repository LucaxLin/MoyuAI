import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@moyu/db";
import { deleteImage } from "@/lib/blob";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const image = await prisma.image.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        url: true,
        localPath: true,
        prompt: true,
        width: true,
        height: true,
        isFavorite: true,
        createdAt: true,
        sessionId: true,
        messageId: true,
      },
    });

    if (!image) {
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
          image,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get image error:", error);
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

const updateImageSchema = z.object({
  prompt: z.string().optional(),
});

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

    const body = await request.json();
    const validation = updateImageSchema.safeParse(body);

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

    const { prompt } = validation.data;

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
        ...(prompt !== undefined && { prompt }),
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
    console.error("Update image error:", error);
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    try {
      await deleteImage(existingImage.url);
    } catch (blobError) {
      console.error("Failed to delete blob:", blobError);
    }

    await prisma.image.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "图片已删除",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete image error:", error);
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
