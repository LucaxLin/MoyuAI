import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join("/");

    const blobUrl = `https://public.blob.vercel-storage.com/${filePath}`;
    
    const response = await fetch(blobUrl);

    if (!response.ok) {
      return new NextResponse("Not found", { status: 404 });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Blob download error:", error);
    return NextResponse.json(
      { success: false, error: "文件获取失败" },
      { status: 500 }
    );
  }
}
