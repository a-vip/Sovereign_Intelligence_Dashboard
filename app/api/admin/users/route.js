import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { getAllUsers, updateUserRole, deleteUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const result = await getAllUsers(page, limit, search);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json({ error: 'User ID and Role are required' }, { status: 400 });
    }

    const updated = await updateUserRole(id, role);
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
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
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Protect admin from deleting themselves
    if (id === auth.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 403 });
    }

    const result = await deleteUser(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
