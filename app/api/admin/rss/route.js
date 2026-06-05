import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { getAllRssItems, updateRssItem, archiveRssItem, deleteRssItemPermanently } from '@/lib/db';
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

    const result = await getAllRssItems(page, limit, search);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin RSS GET error:', error);
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
      return NextResponse.json({ error: 'RSS item ID is required' }, { status: 400 });
    }

    const updated = await updateRssItem(id, fields);
    clearRouteCache();
    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Admin RSS PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, permanent, title, url } = body;

    if (!id) {
      return NextResponse.json({ error: 'RSS item ID is required' }, { status: 400 });
    }

    let result;
    if (permanent) {
      result = await deleteRssItemPermanently(id, title, url);
    } else {
      result = await archiveRssItem(id, auth.user.email, title, url);
    }
    clearRouteCache();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Admin RSS DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
