import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@moyu/db";
import { generateImage } from "@/lib/minimax";
import { uploadImage } from "@/lib/blob";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const EDIT_INTENTS = {
  REGENERATE: ["不对", "重新生成", "再来一张"],
  ADJUST: ["稍微调整", "再改改"],
  CONTINUE: ["保留这个", "继续"],
};

function detectEditIntent(content: string): "regenerate" | "adjust" | "continue" {
  const lowerContent = content.toLowerCase();

  for (const keyword of EDIT_INTENTS.REGENERATE) {
    if (lowerContent.includes(keyword)) return "regenerate";
  }

  for (const keyword of EDIT_INTENTS.ADJUST) {
    if (lowerContent.includes(keyword)) return "adjust";
  }

  return "continue";
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const dbSession = await prisma.session.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!dbSession) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "会话不存在",
          },
        },
        { status: 404 }
      );
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          sessionId: id,
        },
        orderBy: {
          createdAt: "asc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          role: true,
          content: true,
          imageUrl: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.message.count({
        where: {
          sessionId: id,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            hasMore: skip + messages.length < total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get messages error:", error);
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

const createMessageSchema = z.object({
  content: z.string().min(1, "消息内容不能为空").max(500, "消息内容不能超过500个字符"),
  imageUrl: z.string().url().optional().nullable(),
  editRegion: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1),
    })
    .optional()
    .nullable(),
});

const API_TIMEOUT = 60000;

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const validation = createMessageSchema.safeParse(body);

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

    const { content, imageUrl, editRegion } = validation.data;

    const dbSession = await prisma.session.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!dbSession) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "会话不存在",
          },
        },
        { status: 404 }
      );
    }

    const userMessage = await prisma.message.create({
      data: {
        sessionId: id,
        userId: session.user.id,
        role: "user",
        content,
        imageUrl,
      },
    });

    const editIntent = detectEditIntent(content);

    const lastAssistantMessage = await prisma.message.findFirst({
      where: {
        sessionId: id,
        role: "assistant",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const originalImageUrl = editIntent === "regenerate"
      ? imageUrl
      : lastAssistantMessage?.imageUrl;

    if (!originalImageUrl && (editIntent === "adjust" || editIntent === "continue")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "没有可编辑的图片",
          },
        },
        { status: 400 }
      );
    }

    let aiImageUrl: string | null = null;
    let imageWidth: number | null = null;
    let imageHeight: number | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const generateParams: Parameters<typeof generateImage>[0] = {
        model: "image-01",
        prompt: content,
        imageUrl: originalImageUrl || undefined,
        width: 1024,
        height: 1024,
      };

      if (editRegion) {
        generateParams.maskRegions = [editRegion];
        generateParams.maskPrompt = content;
        if (originalImageUrl) {
          generateParams.maskImageUrl = originalImageUrl;
        }
      }

      const aiResponse = await generateImage(generateParams);

      clearTimeout(timeoutId);

      if (aiResponse.data && aiResponse.data[0]) {
        const imageBase64 = aiResponse.data[0].base64;
        const imageBuffer = Buffer.from(imageBase64, "base64");
        const blob = await uploadImage(
          new File([imageBuffer], "generated.webp", { type: "image/webp" }),
          session.user.id
        );
        aiImageUrl = blob.url;
        imageWidth = aiResponse.data[0].width || 1024;
        imageHeight = aiResponse.data[0].height || 1024;
      }
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AI_SERVICE_ERROR",
            message: "AI服务调用失败，请稍后重试",
          },
        },
        { status: 500 }
      );
    }

    const assistantMessage = await prisma.message.create({
      data: {
        sessionId: id,
        userId: session.user.id,
        role: "assistant",
        content: "已为您生成图片",
        imageUrl: aiImageUrl,
        metadata: {
          prompt: content,
          width: imageWidth,
          height: imageHeight,
          model: "minimax-image-01",
          editIntent,
          editRegion,
        },
      },
    });

    if (aiImageUrl) {
      await prisma.image.create({
        data: {
          userId: session.user.id,
          sessionId: id,
          messageId: assistantMessage.id,
          url: aiImageUrl,
          localPath: aiImageUrl,
          prompt: content,
          width: imageWidth,
          height: imageHeight,
          isFavorite: false,
        },
      });
    }

    if (dbSession.title === "新会话") {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await prisma.session.update({
        where: { id },
        data: { title },
      });
    }

    await prisma.session.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: {
            id: assistantMessage.id,
            role: assistantMessage.role,
            content: assistantMessage.content,
            imageUrl: assistantMessage.imageUrl,
            metadata: assistantMessage.metadata,
            createdAt: assistantMessage.createdAt,
          },
          image: aiImageUrl
            ? {
                url: aiImageUrl,
                width: imageWidth,
                height: imageHeight,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create message error:", error);
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
