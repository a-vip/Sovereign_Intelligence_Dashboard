import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { getAllSuggestions, deleteSuggestion } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await getAllSuggestions(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin feedback GET error:', error);
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
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }

    const result = await deleteSuggestion(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Admin feedback DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
