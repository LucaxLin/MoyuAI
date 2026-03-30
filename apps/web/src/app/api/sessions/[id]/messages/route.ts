import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@moyu/db";
import { generateImage } from "@/lib/minimax";
import { uploadImage } from "@/lib/blob";
import { logger } from "@/lib/logger";

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
    logger.error("Messages", "Get messages error:", error);
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

    const { content, imageUrl } = validation.data;

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

    let aiImageUrl: string | null = null;
    let imageWidth: number | null = null;
    let imageHeight: number | null = null;
    let aspectRatio = "16:9";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      const startTime = Date.now();

      logger.info("AI", `开始生成图片，提示词: "${content}"`);

      const generateParams: Parameters<typeof generateImage>[0] = {
        prompt: content,
        aspectRatio: "16:9",
      };

      let refImageWidth = 1024;
      let refImageHeight = 1024;
      let refImage: string | null = imageUrl ?? null;

      if (!refImage) {
        const lastAssistantMessage = await prisma.message.findFirst({
          where: {
            sessionId: id,
            role: "assistant",
            imageUrl: { not: null },
          },
          orderBy: { createdAt: "desc" },
        });
        if (lastAssistantMessage?.imageUrl) {
          refImage = lastAssistantMessage.imageUrl;
          logger.info("AI", `自动使用历史图片作为参考: ${refImage}`);
        }
      }
      
      if (refImage) {
        try {
          const imgResponse = await fetch(refImage);
          const imgBuffer = await imgResponse.arrayBuffer();
          const blob = new Blob([imgBuffer]);
          const imgUrl = URL.createObjectURL(blob);
          
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              refImageWidth = img.width;
              refImageHeight = img.height;
              const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
              const divisor = gcd(refImageWidth, refImageHeight);
              const ratioW = refImageWidth / divisor;
              const ratioH = refImageHeight / divisor;
              aspectRatio = `${ratioW}:${ratioH}`;
              URL.revokeObjectURL(imgUrl);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(imgUrl);
              resolve();
            };
            img.src = imgUrl;
          });
        } catch (err) {
          logger.warn("AI", "获取参考图片尺寸失败，使用默认比例");
        }

        generateParams.subjectReference = [
          {
            type: "character",
            image_file: refImage,
          },
        ];
        logger.info("AI", `使用参考图片: ${refImage}，比例: ${aspectRatio} (${refImageWidth}x${refImageHeight})`);
      }

      generateParams.aspectRatio = aspectRatio as "1:1" | "16:9" | "21:9" | "9:16" | "3:2" | "2:3" | "4:3" | "3:4";

      logger.info("AI", "完整请求体:", generateParams);

      const aiStartTime = Date.now();
      const aiResponse = await generateImage(generateParams);
      const aiEndTime = Date.now();

      clearTimeout(timeoutId);

      logger.info("AI", `API调用耗时: ${aiEndTime - aiStartTime}ms`);
      logger.info("AI", "API响应状态:", aiResponse.base_resp);

      if (aiResponse.base_resp?.status_code === 0 && aiResponse.data?.image_urls?.length > 0) {
        const aiGeneratedUrl = aiResponse.data.image_urls[0];
        logger.info("AI", `成功获取图片URL: ${aiGeneratedUrl}`);
        
        if (aiGeneratedUrl) {
          const downloadStartTime = Date.now();
          const response = await fetch(aiGeneratedUrl);
          const imageBuffer = await response.arrayBuffer();
          const downloadEndTime = Date.now();
          logger.info("AI", `图片下载耗时: ${downloadEndTime - downloadStartTime}ms, 大小: ${imageBuffer.byteLength} bytes`);

          const uploadStartTime = Date.now();
          const blob = await uploadImage(
            new File([imageBuffer], "generated.png", { type: "image/png" }),
            session.user.id
          );
          const uploadEndTime = Date.now();
          logger.info("AI", `图片上传耗时: ${uploadEndTime - uploadStartTime}ms`);
          
          aiImageUrl = blob.url;
        }
        
        if (refImage) {
          imageWidth = refImageWidth;
          imageHeight = refImageHeight;
        } else {
          imageWidth = 1024;
          imageHeight = 1024;
        }
      } else {
        logger.error("AI", `AI响应异常:`, aiResponse);
      }

      const totalEndTime = Date.now();
      logger.info("AI", `总耗时: ${totalEndTime - startTime}ms`);
    } catch (aiError) {
      logger.error("AI", "AI generation error:", aiError);
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
          aspectRatio: aspectRatio,
          model: "image-01",
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
    logger.error("Messages", "Create message error:", error);
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
