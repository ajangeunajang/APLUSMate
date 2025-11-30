import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<Record<string, string>>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolved = await params;
  const publicId = resolved.publicId ?? "";

  if (!publicId) {
    return NextResponse.json(
      { error: "public_id is required" },
      { status: 400 }
    );
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { error: "백엔드 서버 URL이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const decodedId = decodeURIComponent(publicId);
    const targetUrl = `${backendUrl}/pdfs/profile/${decodedId}`;
    
    console.log('[thumbnail-proxy] fetching ->', targetUrl);

    const backendResponse = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "image/*",
      },
    });

    console.log('[thumbnail-proxy] response status:', backendResponse.status);

    if (!backendResponse.ok) {
      console.error('[thumbnail-proxy] failed:', backendResponse.status);
      return new NextResponse(null, { status: backendResponse.status });
    }

    const contentType = backendResponse.headers.get("content-type") ?? "image/png";
    const imageBuffer = await backendResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // 24시간 캐시
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[thumbnail-proxy] error:", error);
    return NextResponse.json(
      { error: "썸네일 이미지를 불러오지 못했습니다." },
      { status: 502 }
    );
  }
}
