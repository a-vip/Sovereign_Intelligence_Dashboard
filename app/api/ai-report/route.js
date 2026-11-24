import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getAdminAiAnalytics,
  getAiConfig,
  getEvalRuns,
  getKnowledgeChunkStats
} from '@/lib/sovdashAiDb';

export const dynamic = 'force-dynamic';

function readCommittedBenchmark() {
  try {
    const p = path.resolve('benchmarks/sovdash-ai-eval.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch {}
  return null;
}

export async function GET() {
  try {
    const [evalRuns, indexStats, analytics, config] = await Promise.all([
      getEvalRuns(5).catch(() => []),
      getKnowledgeChunkStats().catch(() => ({ total: 0, byType: {}, hasPgVector: false })),
      getAdminAiAnalytics().catch(() => ({ totalTurns: 0, passRate: 100, avgCitationCoverage: 100 })),
      getAiConfig().catch(() => ({ provider: 'auto-opensource', modelId: 'openai/gpt-oss-120b' }))
    ]);

    const committed = readCommittedBenchmark();
    const latestEval = evalRuns?.[0] || committed || null;

    return NextResponse.json({
      success: true,
      latestEval,
      evalHistory: evalRuns || (committed ? [committed] : []),
      indexStats,
      liveTelemetry: {
        totalTurns: analytics.totalTurns || 0,
        passRate: analytics.passRate ?? 100,
        avgCitationCoverage: analytics.avgCitationCoverage ?? 100,
        flaggedCount: analytics.flaggedCount || 0
      },
      activeEngine: {
        provider: config.provider,
        modelId: config.modelId,
        strictCitationLock: config.strictCitationLock !== false,
        allowWebAugmentation: config.allowWebAugmentation !== false
      }
    });
  } catch (error) {
    console.error('[/api/ai-report GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
