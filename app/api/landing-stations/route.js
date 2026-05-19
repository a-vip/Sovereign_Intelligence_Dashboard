import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.submarinecablemap.com/api/v3/landing-point/landing-point-geo.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 86400 } // Cache in Next.js data-cache for 24 hours
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from TeleGeography Landing Points: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Landing points proxy error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
