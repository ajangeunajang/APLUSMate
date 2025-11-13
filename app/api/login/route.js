export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch('http://104.198.57.165:8002/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { detail: text } : null;
      }
    } catch (parseError) {
      console.error('Failed to parse login response:', parseError);
    }

    // FastAPI 에러 반환
    if (!response.ok) {
      return Response.json(data || { detail: '로그인에 실패했습니다.' }, {
        status: response.status,
      });
    }

    // 성공
    return Response.json(
      data || { message: '로그인이 성공적으로 완료되었습니다.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Login proxy error:', error);
    return Response.json({ detail: 'Server error' }, { status: 500 });
  }
}
