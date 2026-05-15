import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Isolation test: DB imports removed',
      data: { markers: [], events: [] }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
