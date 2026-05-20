import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { getArchivedEvents, restoreArchivedEvent, deleteArchivedEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await getArchivedEvents(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin archive GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Archive event ID is required' }, { status: 400 });
    }

    const result = await restoreArchivedEvent(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Admin archive POST (restore) error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Archive event ID is required' }, { status: 400 });
    }

    const result = await deleteArchivedEvent(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Admin archive DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
