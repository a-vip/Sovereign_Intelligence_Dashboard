import { NextResponse } from 'next/server';
import { extractSessionPayload } from '@/lib/adminAuth';
import { getUserBookmarks, addUserBookmark, removeUserBookmark } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = extractSessionPayload(request);
    if (!session?.email) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const bookmarks = await getUserBookmarks(session.email);
    return NextResponse.json({ success: true, bookmarks });
  } catch (error) {
    console.error('[/api/bookmarks GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = extractSessionPayload(request);
    if (!session?.email) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    if (!(body.eventId || body.id) || !body.title) {
      return NextResponse.json({ success: false, error: 'eventId and title are required' }, { status: 400 });
    }
    const bookmark = await addUserBookmark(session.email, body);
    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    console.error('[/api/bookmarks POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = extractSessionPayload(request);
    if (!session?.email) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const eventId = (searchParams.get('eventId') || searchParams.get('id') || '').trim();
    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }
    const result = await removeUserBookmark(session.email, eventId);
    return NextResponse.json({ success: true, deleted: result.deleted });
  } catch (error) {
    console.error('[/api/bookmarks DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
