import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const imageFile = formData.get("image_file") as File | null;
    const publicId = formData.get("public_id") as string;
    const pageNumber = formData.get("page_number") as string;
    const questionQuery = formData.get("question_query") as string;

    // 필수 파라미터 검증
    if (!publicId || !pageNumber || !questionQuery) {
      return NextResponse.json(
        { 
          detail: [
            {
              loc: ["body"],
              msg: "필수 파라미터가 누락되었습니다.",
              type: "value_error"
            }
          ]
        },
        { status: 422 }
      );
    }

    // 백엔드 URL 확인
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { error: "BACKEND_URL이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 백엔드로 전송할 FormData 구성
    const backendFormData = new FormData();
    backendFormData.append("public_id", publicId);
    backendFormData.append("page_number", pageNumber);
    backendFormData.append("question_query", questionQuery);
    
    if (imageFile) {
      backendFormData.append("image_file", imageFile);
    }

    // 백엔드 API 호출
    const backendResponse = await fetch(`${backendUrl}/chat/query`, {
      method: "POST",
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error("백엔드 API 오류:", errorData);
      return NextResponse.json(
        errorData,
        { status: backendResponse.status }
      );
    }

    // 백엔드 응답을 텍스트로 받음 (200 응답: "string")
    const responseText = await backendResponse.text();

    // JSON 파싱 시도, 실패하면 텍스트 그대로 반환
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Chat query 처리 중 오류:", error);
    return NextResponse.json(
      { 
        detail: [
          {
            loc: ["server"],
            msg: error instanceof Error ? error.message : "Unknown error",
            type: "server_error"
          }
        ]
      },
      { status: 500 }
    );
  }
}
