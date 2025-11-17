import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { detail: [{ loc: ['query', 'user_id'], msg: 'Field required', type: 'value_error.missing' }] },
        { status: 422 }
      );
    }

    // 백엔드 서버 전달
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { error: '백엔드 서버 URL이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const response = await fetch(`${backendUrl}/pdfs/my_pdfs?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: '서버에서 오류가 발생했습니다.',
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('PDF 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버에 연결할 수 없습니다.' },
      { status: 500 }
    );
  }
}
