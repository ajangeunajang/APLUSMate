import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BE_URL ||
    process.env.BACKEND_URL ||
    "http://34.60.150.18:8002";

  const path = (resolvedParams.path || []).join("/");
  const backendUrl = `${backend.replace(/\/+$/, "")}/${path}`;

  try {
    console.log("[api/files] proxy ->", backendUrl);
    const forwardHeaders: Record<string, string> = {};
    const cookie = req.headers.get("cookie");
    if (cookie) forwardHeaders["cookie"] = cookie;
    const authorization = req.headers.get("authorization");
    if (authorization) forwardHeaders["authorization"] = authorization;

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: forwardHeaders,
    });

    console.log("[api/files] backend response ->", res.status, res.headers.get("content-type"));

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[api/files] backend error:", res.status, text);
      return new NextResponse(`Backend error ${res.status}: ${text}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return new NextResponse(res.body, {
      status: 200,
      headers: { "content-type": contentType },
    });
  } catch (err) {
    console.error("[api/files] proxy exception:", err);
    return new NextResponse("Proxy error", { status: 500 });
  }
}
