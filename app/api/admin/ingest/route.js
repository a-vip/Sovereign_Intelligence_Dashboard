import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { GET as runCronIngest } from '@/app/api/cron/ingest/route';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    // Manually invoke the OSINT intel engine ingest logic
    // We pass a dummy request object since the cron handler just needs it to exist
    const dummyRequest = new Request('http://localhost/api/cron/ingest', { method: 'GET' });
    
    console.log('Admin triggered manual OSINT ingest sweep...');
    const ingestResponse = await runCronIngest(dummyRequest);
    
    if (!ingestResponse.ok) {
      const errorText = await ingestResponse.text();
      throw new Error(`Ingest failed with status ${ingestResponse.status}: ${errorText}`);
    }
    
    const ingestData = await ingestResponse.json();
    return NextResponse.json({ success: true, results: ingestData });
  } catch (error) {
    console.error('Admin manual ingest error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
