export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch('http://104.198.57.165:8002/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // FastAPI가 에러 반환
    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    // 성공
    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json({ detail: 'Server error' }, { status: 500 });
  }
}
