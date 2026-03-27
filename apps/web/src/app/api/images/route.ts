import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@moyu/db";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "desc";
    const filter = searchParams.get("filter");

    const skip = (page - 1) * limit;

    let dateFilter: Date | undefined;
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = today;
    } else if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = weekAgo;
    } else if (filter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = monthAgo;
    }

    const whereClause: {
      userId: string;
      isFavorite: boolean;
      createdAt?: { gte: Date };
    } = {
      userId: session.user.id,
      isFavorite: true,
    };

    if (dateFilter) {
      whereClause.createdAt = { gte: dateFilter };
    }

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: whereClause,
        orderBy: {
          createdAt: sort === "desc" ? "desc" : "asc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          url: true,
          prompt: true,
          width: true,
          height: true,
          isFavorite: true,
          createdAt: true,
        },
      }),
      prisma.image.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          images,
          pagination: {
            page,
            limit,
            total,
            hasMore: skip + images.length < total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get images error:", error);
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
