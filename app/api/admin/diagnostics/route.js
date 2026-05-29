import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { getDiagnosticAnomalies } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const anomalies = await getDiagnosticAnomalies();
    return NextResponse.json({ success: true, anomalies });
  } catch (error) {
    console.error('Admin diagnostics GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
