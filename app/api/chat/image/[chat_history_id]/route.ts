import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chat_history_id: string }> }
) {
  try {
    const { chat_history_id } = await params;
    
    console.log('채팅 이미지 요청:', chat_history_id);
    
    // API 서버로 요청
    const backendUrl = process.env.BACKEND_URL;
    const apiUrl = `${backendUrl}/chat/image/${chat_history_id}`;
    
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
    });

    console.log('API 응답 상태:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 });
      }
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    // 이미지를 그대로 반환
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('채팅 이미지 로드 실패:', error);
    return NextResponse.json(
      { error: '이미지를 불러오는데 실패했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
