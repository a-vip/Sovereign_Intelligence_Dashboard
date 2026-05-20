import { getUserById, initDb } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Server-side admin verification middleware.
 * Reads x-user-id header, validates user exists and has admin role.
 * Returns the user object if valid, or a NextResponse error if not.
 */
export async function verifyAdmin(request) {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return { error: NextResponse.json({ error: 'Authentication required. Missing operator identity.' }, { status: 401 }) };
  }

  await initDb();
  const user = await getUserById(userId);

  if (!user) {
    return { error: NextResponse.json({ error: 'Operator not found. Access denied.' }, { status: 403 }) };
  }

  if (user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Insufficient clearance. Admin access required.' }, { status: 403 }) };
  }

  return { user };
}
