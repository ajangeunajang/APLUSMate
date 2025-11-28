import { NextRequest, NextResponse } from 'next/server';

// Next.js App Router에서 body size 제한 설정
export const runtime = 'nodejs';
export const maxDuration = 60; // 타임아웃 (초)

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

    // 파일 크기 체크 (선택사항)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기가 50MB를 초과합니다.' },
        { status: 413 }
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

    // 타임아웃 설정 추가
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5분

    const response = await fetch(`${backendUrl}/pdfs/upload?user_id=${userId}`, {
      method: 'POST',
      body: backendFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: '업로드 시간이 초과되었습니다.' },
        { status: 408 }
      );
    }
    
    // 에러 정보를 더 자세히 출력
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('상세 오류:', errorMessage);
    
    return NextResponse.json(
      { 
        error: '서버에 연결할 수 없습니다.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}