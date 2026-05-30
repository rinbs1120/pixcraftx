import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get('url');
  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 });
  }
}
