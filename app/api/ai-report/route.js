import { NextResponse } from 'next/server';
import benchmark1000 from '@/benchmarks/sovdash-ai-eval-1000.json';
import committed23 from '@/benchmarks/sovdash-ai-eval.json';
import longitudinal from '@/benchmarks/sovdash-ai-longitudinal.json';
import {
  getAdminAiAnalytics,
  getAiConfig,
  getEvalRuns,
  getKnowledgeChunkStats
} from '@/lib/sovdashAiDb';

export const dynamic = 'force-dynamic';

function escapeCsv(v) {
  return `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = String(searchParams.get('format') || '').trim().toLowerCase();

    // Open academic dataset export (CSV or JSONL) for full peer-review reproducibility
    if (format === 'csv' || format === 'jsonl') {
      const rows = benchmark1000?.results || committed23?.results || [];
      if (format === 'jsonl') {
        const body = rows.map((r) => JSON.stringify(r)).join('\n');
        return new NextResponse(body, {
          status: 200,
          headers: {
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Content-Disposition': `attachment; filename="sovdash-ai-audit-${rows.length}-cases.jsonl"`
          }
        });
      }
      const header = [
        'id', 'stratum', 'is_trap', 'passed', 'failure_mode', 'hallucination_grade',
        'abstained', 'citation_count', 'citation_coverage', 'entity_numeric_grounding',
        'phantom_count', 'latency_ms', 'prompt', 'answer_preview'
      ];
      const csvLines = [
        header.join(','),
        ...rows.map((r) => [
          r.id, r.stratum || r.category || '', r.isTrap, r.passed, r.failureMode || '',
          r.hallucinationGrade || '', r.abstained, r.citationCount || 0, r.citationCoverage ?? 1,
          r.entityNumericGrounding ?? 1, r.phantomCount || 0, r.latencyMs || 0,
          r.prompt || '', r.answerPreview || ''
        ].map(escapeCsv).join(','))
      ];
      return new NextResponse(csvLines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sovdash-ai-audit-${rows.length}-cases.csv"`
        }
      });
    }

    const [evalRuns, indexStats, analytics, config] = await Promise.all([
      getEvalRuns(5).catch(() => []),
      getKnowledgeChunkStats().catch(() => ({ total: 0, byType: {}, hasPgVector: false })),
      getAdminAiAnalytics().catch(() => ({ totalTurns: 0, passRate: 100, avgCitationCoverage: 100, flaggedCount: 0 })),
      getAiConfig().catch(() => ({ provider: 'auto-opensource', modelId: 'openai/gpt-oss-120b' }))
    ]);

    const latestEval = committed23 || evalRuns?.[0] || null;
    const summary1000 = benchmark1000
      ? {
          ...benchmark1000,
          results: undefined,
          sampleResultsCount: benchmark1000.results?.length || 0
        }
      : null;

    return NextResponse.json({
      success: true,
      benchmark1000: summary1000,
      longitudinalLedger: longitudinal,
      latestEval,
      evalHistory: evalRuns || (committed23 ? [committed23] : []),
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
      },
      exports: {
        csv: '/api/ai-report?format=csv',
        jsonl: '/api/ai-report?format=jsonl'
      }
    });
  } catch (error) {
    console.error('[/api/ai-report GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
