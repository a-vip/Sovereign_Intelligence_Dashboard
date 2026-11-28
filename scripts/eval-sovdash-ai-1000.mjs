import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { syncKnowledgeIndex } = await import('../lib/sovdashRag.js');
const { executeStratified1000Audit } = await import('../lib/sovdashEval1000.js');

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
  const seedArg = args.find((a) => a.startsWith('--seed='));
  const variantSeed = seedArg ? parseInt(seedArg.split('=')[1], 10) : 0;

  console.log('[eval:1000] Syncing knowledge index (skip if already populated unless --reindex)...');
  const syncRes = await syncKnowledgeIndex({ force: args.includes('--reindex') });
  console.log(
    `[eval:1000] Corpus ready: ${syncRes.totalChunks} chunks (pgvector=${syncRes.hasPgVector})`
  );

  console.log(`[eval:1000] Executing Stratified 1,050-Case Hallucination & Groundedness Audit (seed=${variantSeed})...`);
  const summary = await executeStratified1000Audit({
    triggeredBy: 'cli-eval-1000',
    variantSeed,
    limit,
    concurrency: 12,
    persist: false
  });

  const benchDir = path.resolve('benchmarks');
  fs.mkdirSync(benchDir, { recursive: true });
  const outFile = path.join(benchDir, 'sovdash-ai-eval-1000.json');
  fs.writeFileSync(outFile, JSON.stringify({ ...summary, indexStats: syncRes }, null, 2), 'utf8');

  // Update longitudinal scaling ledger (tracks cumulative audited turns scaling 1,050 -> 10,000 -> 100,000)
  const ledgerPath = path.join(benchDir, 'sovdash-ai-longitudinal.json');
  let ledger = {
    targetScale: 100000,
    cumulativeAuditedCases: 0,
    cumulativePassedCases: 0,
    cumulativePhantomCitations: 0,
    batches: []
  };
  if (fs.existsSync(ledgerPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
      if (parsed && Array.isArray(parsed.batches)) ledger = parsed;
    } catch {}
  }

  const batchEntry = {
    batchId: `batch-${Date.now()}`,
    generatedAt: summary.generatedAt,
    variantSeed,
    totalTests: summary.totalTests,
    passedCount: summary.passedCount,
    passRate: summary.passRate,
    abstentionAccuracy: summary.abstentionAccuracy,
    citationCoverageAvg: summary.citationCoverageAvg,
    groundingAvg: summary.groundingAvg,
    phantomCitationCount: summary.phantomCitationCount,
    durationMs: summary.durationMs,
    failureTaxonomy: summary.failureTaxonomy
  };

  // Replace initial baseline seed=0 batch cleanly if re-run, otherwise append new longitudinal cohort
  const existingIdx = ledger.batches.findIndex((b) => b.variantSeed === variantSeed && variantSeed === 0);
  if (existingIdx >= 0) ledger.batches[existingIdx] = batchEntry;
  else ledger.batches.push(batchEntry);

  ledger.cumulativeAuditedCases = ledger.batches.reduce((a, b) => a + b.totalTests, 0);
  ledger.cumulativePassedCases = ledger.batches.reduce((a, b) => a + b.passedCount, 0);
  ledger.cumulativePhantomCitations = ledger.batches.reduce((a, b) => a + b.phantomCitationCount, 0);
  ledger.cumulativePassRate = ledger.cumulativeAuditedCases
    ? Number(((ledger.cumulativePassedCases / ledger.cumulativeAuditedCases) * 100).toFixed(2))
    : 0;
  ledger.updatedAt = summary.generatedAt;
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');

  console.log('\n=== SOVDASH AI 1,050-CASE STRATIFIED AUDIT SUMMARY ===');
  console.log(JSON.stringify({
    totalTests: summary.totalTests,
    passedCount: summary.passedCount,
    failedCount: summary.failedCount,
    passRate: `${summary.passRate}% (95% Wilson CI: ${summary.passRateCI95.low}%–${summary.passRateCI95.high}%)`,
    factualPassRate: `${summary.factualPassRate}% (${summary.factualPassed}/${summary.factualTotal})`,
    abstentionAccuracy: `${summary.abstentionAccuracy}% (${summary.trapPassed}/${summary.trapTotal})`,
    citationCoverageAvg: `${summary.citationCoverageAvg}%`,
    groundingAvg: `${summary.groundingAvg}%`,
    phantomCitationCount: summary.phantomCitationCount,
    medianLatencyMs: summary.medianLatencyMs,
    p95LatencyMs: summary.p95LatencyMs,
    durationSec: Number((summary.durationMs / 1000).toFixed(1)),
    failureTaxonomy: summary.failureTaxonomy
  }, null, 2));

  console.log('\n--- PER-STRATUM BREAKDOWN ---');
  for (const st of summary.strataSummary) {
    console.log(
      `  ${st.stratum.padEnd(46)} | ${String(st.passed).padStart(3)}/${String(st.total).padEnd(3)} (${String(st.passRate).padStart(6)}%, CI ${st.wilsonCI95.low}-${st.wilsonCI95.high}%) | cov=${st.citationCoverageAvg}% | gnd=${st.groundingAvg}% | ph=${st.phantomCitations}`
    );
  }

  const failures = summary.results.filter((r) => !r.passed);
  if (failures.length > 0) {
    console.log(`\n--- SAMPLE FAILURE MODES (${failures.length} total, showing first 15) ---`);
    for (const f of failures.slice(0, 15)) {
      console.log(`  [FAIL:${f.failureMode}] ${f.id} | "${f.prompt.slice(0, 82)}" -> "${f.answerPreview.slice(0, 110)}"`);
    }
  }
}

main().catch((err) => {
  console.error('[eval:1000] Fatal error:', err);
  process.exit(1);
});
