import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { getAllEvents, updateEvent, archiveEvent, deleteEventPermanently } from '@/lib/db';
import { clearRouteCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const result = await getAllEvents(page, limit, search);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin events GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const updated = await updateEvent(id, fields);
    clearRouteCache();
    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    console.error('Admin events PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, permanent } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    let result;
    if (permanent) {
      result = await deleteEventPermanently(id);
    } else {
      result = await archiveEvent(id, auth.user.email);
    }
    clearRouteCache();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Admin events DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
