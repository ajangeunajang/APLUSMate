import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf_file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 백엔드 서버로 파일 전달
    const backendFormData = new FormData();
    backendFormData.append('pdf_file', file);

    const response = await fetch('http://104.198.57.165:8002/pdfs/upload', {
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

