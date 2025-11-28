import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url).searchParams.get("url");
    if (!url) return new NextResponse("Missing url param", { status: 400 });

    console.log("[api/proxy] proxy ->", url);

    const forwardHeaders: Record<string, string> = {};
    const cookie = req.headers.get("cookie");
    if (cookie) forwardHeaders["cookie"] = cookie;
    const authorization = req.headers.get("authorization");
    if (authorization) forwardHeaders["authorization"] = authorization;

    const res = await fetch(url, { method: "GET", headers: forwardHeaders });
    console.log("[api/proxy] backend response ->", res.status, res.headers.get("content-type"));

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[api/proxy] backend error:", res.status, text);
      return new NextResponse(`Backend error ${res.status}: ${text}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return new NextResponse(res.body, {
      status: 200,
      headers: { "content-type": contentType },
    });
  } catch (err) {
    console.error("[api/proxy] proxy exception:", err);
    return new NextResponse("Proxy fetch error", { status: 500 });
  }
}