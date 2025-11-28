import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<Record<string, string>>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolved = await params;
  const publicId = resolved.publicId ?? "";

  if (!publicId) {
    return NextResponse.json(
      { error: "Thumbnail ID is required" },
      { status: 422 }
    );
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { error: "백엔드 서버 URL이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // Construct thumbnail path: files/profile_images/{publicId}_thumbnail.png
  const thumbnailPath = `files/profile_images/${publicId}_thumbnail.png`;
  const targetUrl = `${backendUrl}/${thumbnailPath}`;

  console.log('[thumbnail-proxy] fetching ->', targetUrl);

  try {
    const backendResponse = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "image/png,image/jpeg,image/*",
      },
    });

    console.log('[thumbnail-proxy] response status:', backendResponse.status);

    if (!backendResponse.ok || !backendResponse.body) {
      console.log('[thumbnail-proxy] backend returned non-OK status');
      return NextResponse.json(
        { error: "Thumbnail not found" },
        { status: backendResponse.status }
      );
    }

    const contentType = backendResponse.headers.get("content-type") || "image/png";
    const contentLength = backendResponse.headers.get("content-length");

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day
    headers.set("Access-Control-Allow-Origin", "*");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(backendResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Thumbnail proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch thumbnail" },
      { status: 502 }
    );
  }
}
