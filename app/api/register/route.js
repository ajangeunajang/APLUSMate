export async function POST(req) {
  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL;

    const response = await fetch(`${backendUrl}/users/register`, {
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
      console.error('Failed to parse register response:', parseError);
    }

    // FastAPI가 에러 반환
    if (!response.ok) {
      return Response.json(data || { detail: '회원가입에 실패했습니다.' }, {
        status: response.status,
      });
    }

    // 성공
    return Response.json(
      data || { message: '회원가입이 성공적으로 완료되었습니다.' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json({ detail: 'Server error' }, { status: 500 });
  }
}
