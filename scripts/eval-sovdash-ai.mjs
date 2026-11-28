import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { syncKnowledgeIndex } = await import('../lib/sovdashRag.js');
const { executeHallucinationEvalSuite } = await import('../lib/sovdashEvalSuite.js');
const { preloadKnowledgeMemoryCache } = await import('../lib/sovdashAiDb.js');

async function main() {
  console.log('[eval:ai] Checking & syncing full ecosystem knowledge base into Neon pgvector...');
  const syncRes = await syncKnowledgeIndex({ force: process.argv.includes('--reindex') });
  console.log(
    `[eval:ai] Indexed ${syncRes.totalChunks} chunks in ${syncRes.durationMs}ms (pgvector=${syncRes.hasPgVector}):`,
    JSON.stringify(syncRes.byType)
  );
  await preloadKnowledgeMemoryCache();

  console.log('[eval:ai] Executing 23-case Hallucination & Groundedness Benchmark Suite...');
  const useDeterministic = process.argv.includes('--deterministic');
  const summary = await executeHallucinationEvalSuite({
    triggeredBy: useDeterministic ? 'cli-deterministic' : 'cli-eval-script',
    configOverride: useDeterministic ? { provider: 'deterministic', modelId: 'sovdash-extractive-v1' } : null,
    persist: Boolean(process.env.POSTGRES_URL)
  });

  fs.mkdirSync(path.resolve('benchmarks'), { recursive: true });
  fs.writeFileSync(
    path.resolve('benchmarks/sovdash-ai-eval.json'),
    JSON.stringify({ ...summary, indexStats: syncRes }, null, 2),
    'utf8'
  );

  console.log('--- SOVDASH AI EVAL SUMMARY ---');
  console.log(
    JSON.stringify(
      {
        providerUsed: summary.providerUsed,
        modelUsed: summary.modelUsed,
        totalTests: summary.totalTests,
        passedCount: summary.passedCount,
        passRate: `${summary.passRate}%`,
        citationCoverageAvg: `${summary.citationCoverageAvg}%`,
        groundingAvg: `${summary.groundingAvg}%`,
        abstentionAccuracy: `${summary.abstentionAccuracy}%`,
        phantomCitationCount: summary.phantomCitationCount,
        hallucinationRate: `${summary.hallucinationRate}%`
      },
      null,
      2
    )
  );

  for (const r of summary.results) {
    console.log(
      `  [${r.passed ? 'PASS' : 'FAIL'}] ${r.id} | grade=${r.hallucinationGrade} | cov=${Math.round(
        r.citationCoverage * 100
      )}% | ground=${Math.round(r.entityNumericGrounding * 100)}% | phantoms=${r.phantomCount} | model=${r.modelUsed}`
    );
  }

  if (summary.phantomCitationCount > 0 || summary.abstentionAccuracy < 100 || summary.passRate < 85) {
    console.error('[eval:ai] Quality gate failed!');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[eval:ai] Fatal error:', err);
  process.exit(1);
});
