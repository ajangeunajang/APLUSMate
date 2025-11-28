import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ public_id: string }> }
) {
  try {
    const { public_id } = await params;

    // console.log("채팅 히스토리 요청:", public_id);

    // API 서버로 요청
    const backendUrl = process.env.BACKEND_URL;
    const apiUrl = `${
      backendUrl
    }/chat/history/${public_id}`;

    // console.log("API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // console.log("API 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API 에러 응답:", errorText);
      throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // console.log("받은 데이터:", data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("채팅 히스토리 로드 실패:", error);
    return NextResponse.json(
      {
        error: "채팅 히스토리를 불러오는데 실패했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
