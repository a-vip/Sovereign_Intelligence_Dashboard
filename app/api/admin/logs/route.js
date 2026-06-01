import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { getAccessLogs, getActiveUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const activeUsers = await getActiveUsers();
    const accessLogs = await getAccessLogs();
    
    return NextResponse.json({
      success: true,
      activeUsers,
      accessLogs
    });
  } catch (error) {
    console.error('Admin operations logs fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
