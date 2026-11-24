import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import {
  OPEN_SOURCE_MODEL_PRESETS,
  getAdminAiAnalytics,
  getAdminAiLogs,
  getAiConfig,
  getEvalRuns,
  getKnowledgeChunkStats,
  saveAiConfig,
  updateAdminMessageNotes
} from '@/lib/sovdashAiDb';
import { getProviderKeyStatus } from '@/lib/sovdashAiEngine';
import { syncKnowledgeIndex } from '@/lib/sovdashRag';
import { executeHallucinationEvalSuite } from '@/lib/sovdashEvalSuite';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 25);
    const search = searchParams.get('search') || '';
    const grade = searchParams.get('grade') || 'all';

    const [analytics, logsData, config, indexStats, evalRuns] = await Promise.all([
      getAdminAiAnalytics(),
      getAdminAiLogs({ page, limit, search, grade }),
      getAiConfig(),
      getKnowledgeChunkStats(),
      getEvalRuns(8)
    ]);

    return NextResponse.json({
      success: true,
      analytics,
      logs: logsData.logs,
      totalLogs: logsData.total,
      config,
      presets: OPEN_SOURCE_MODEL_PRESETS,
      keyStatus: getProviderKeyStatus(),
      indexStats,
      evalRuns
    });
  } catch (error) {
    console.error('[/api/admin/ai GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'update_note') {
      const res = await updateAdminMessageNotes(body.messageId, body.adminNotes);
      return NextResponse.json({ success: true, ...res });
    }

    const updatedConfig = await saveAiConfig(body.config || body, auth.user.email || 'admin');
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error('[/api/admin/ai PATCH] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'reindex') {
      const syncResult = await syncKnowledgeIndex({ force: true });
      return NextResponse.json({ success: true, action: 'reindex', result: syncResult });
    }

    if (body.action === 'run_eval') {
      const evalSummary = await executeHallucinationEvalSuite({
        triggeredBy: auth.user.email || 'admin-cms',
        persist: true
      });
      return NextResponse.json({ success: true, action: 'run_eval', evalSummary });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('[/api/admin/ai POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
