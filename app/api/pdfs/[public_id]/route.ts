import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  params: Promise<{
    public_id: string;
  }>;
};

const buildValidationError = (loc: string, msg: string) => ({
  detail: [
    {
      loc: [loc],
      msg,
      type: 'value_error',
    },
  ],
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { public_id } = await params;
  const publicId = public_id;

  if (!publicId) {
    return NextResponse.json(buildValidationError('path.public_id', 'Field required'), {
      status: 422,
    });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { error: '백엔드 서버 URL이 설정되지 않았습니다. 환경변수 BACKEND_URL을 확인하세요.' },
      { status: 500 }
    );
  }

  const targetUrl = `${backendUrl}/pdfs/${encodeURIComponent(publicId)}`;
  const download = request.nextUrl.searchParams.get('download') === '1';

  try {
    const backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf',
      },
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorPayload = await backendResponse
        .json()
        .catch(() => ({ error: 'PDF를 불러오지 못했습니다.' }));
      return NextResponse.json(errorPayload, { status: backendResponse.status });
    }

    const contentType = backendResponse.headers.get('content-type') ?? 'application/pdf';
    const suggestedFileName =
      backendResponse.headers.get('x-file-name') ?? `${decodeURIComponent(publicId)}.pdf`;

    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'Content-Disposition': download ? `attachment; filename="${suggestedFileName}"` : 'inline',
    });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers,
    });
  } catch (error) {
    console.error('PDF 스트림 프록시 오류:', error);
    return NextResponse.json(
      { error: 'PDF 스트림 요청에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 }
    );
  }
}

