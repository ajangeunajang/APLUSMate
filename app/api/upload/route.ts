import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf_file') as File;
    const userId = formData.get('user_id') as string;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id가 제공되지 않았습니다.' },
        { status: 400 }
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

    const backendFormData = new FormData();
    backendFormData.append('pdf_file', file);
    backendFormData.append('user_id', userId);

    const response = await fetch(`${backendUrl}/pdfs/upload?user_id=${userId}`, {
      method: 'POST',
      body: backendFormData,
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
    console.error('파일 업로드 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버에 연결할 수 없습니다.' },
      { status: 500 }
    );
  }
}

