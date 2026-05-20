import { NextResponse } from 'next/server';
import { initDb, promoteUserToAdmin } from '@/lib/db';

export async function POST(request) {
  try {
    // Protected by API token — one-time bootstrap only
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ') || auth.split(' ')[1] !== process.env.DASHBOARD_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDb();

    const body = await request.json();
    const email = body.email || 'workwithavip@gmail.com';

    const user = await promoteUserToAdmin(email);
    return NextResponse.json({
      success: true,
      message: `User ${email} promoted to admin`,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
    });
  } catch (error) {
    console.error('Admin promote error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
