import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { syncKnowledgeIndex } = await import('../lib/sovdashRag.js');
const { executeStratified1000Audit, wilsonCI95 } = await import('../lib/sovdashEval1000.js');

/**
 * Continuous Longitudinal Audit Runner (1,050 -> 10,000 -> 100,000 Evaluated Turns).
 *
 * Usage:
 *   node scripts/eval-sovdash-ai-continuous.mjs --batches=5 --start-seed=1
 *
 * Each batch runs a freshly paraphrased & seeded 1,050-case stratified cohort through
 * Sovereign's real retrieval + verification pipeline, logs every newly observed failure
 * into benchmarks/sovdash-ai-failure-log.jsonl for engineering triage, and updates the
 * cumulative longitudinal ledger in benchmarks/sovdash-ai-longitudinal.json.
 */
async function main() {
  const args = process.argv.slice(2);
  const getInt = (prefix, def) => {
    const f = args.find((a) => a.startsWith(prefix));
    return f ? Math.max(1, parseInt(f.split('=')[1], 10) || def) : def;
  };
  const batches = getInt('--batches=', 1);
  const startSeed = getInt('--start-seed=', 1);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

  await syncKnowledgeIndex({ force: false });

  const benchDir = path.resolve('benchmarks');
  fs.mkdirSync(benchDir, { recursive: true });
  const ledgerPath = path.join(benchDir, 'sovdash-ai-longitudinal.json');
  const failLogPath = path.join(benchDir, 'sovdash-ai-failure-log.jsonl');

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

  for (let b = 0; b < batches; b++) {
    const seed = startSeed + b;
    console.log(`[eval:continuous] Running longitudinal cohort ${b + 1}/${batches} (seed=${seed})...`);
    const summary = await executeStratified1000Audit({
      triggeredBy: `cli-continuous-seed-${seed}`,
      variantSeed: seed,
      limit,
      concurrency: 12,
      persist: false
    });

    const fails = summary.results.filter((r) => !r.passed);
    if (fails.length > 0) {
      const lines = fails.map((f) => JSON.stringify({
        ts: summary.generatedAt,
        seed,
        id: f.id,
        stratum: f.stratum,
        failureMode: f.failureMode,
        prompt: f.prompt,
        answerPreview: f.answerPreview
      })).join('\n') + '\n';
      fs.appendFileSync(failLogPath, lines, 'utf8');
    }

    ledger.batches.push({
      batchId: `batch-${seed}-${Date.now()}`,
      generatedAt: summary.generatedAt,
      variantSeed: seed,
      totalTests: summary.totalTests,
      passedCount: summary.passedCount,
      passRate: summary.passRate,
      abstentionAccuracy: summary.abstentionAccuracy,
      citationCoverageAvg: summary.citationCoverageAvg,
      groundingAvg: summary.groundingAvg,
      phantomCitationCount: summary.phantomCitationCount,
      durationMs: summary.durationMs,
      failureTaxonomy: summary.failureTaxonomy
    });

    ledger.cumulativeAuditedCases = ledger.batches.reduce((a, x) => a + x.totalTests, 0);
    ledger.cumulativePassedCases = ledger.batches.reduce((a, x) => a + x.passedCount, 0);
    ledger.cumulativePhantomCitations = ledger.batches.reduce((a, x) => a + x.phantomCitationCount, 0);
    ledger.cumulativePassRate = Number(((ledger.cumulativePassedCases / Math.max(1, ledger.cumulativeAuditedCases)) * 100).toFixed(2));
    ledger.cumulativeCI95 = wilsonCI95(ledger.cumulativePassedCases, ledger.cumulativeAuditedCases);
    ledger.updatedAt = summary.generatedAt;

    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
    console.log(
      `[eval:continuous] Cohort seed=${seed} done: ${summary.passedCount}/${summary.totalTests} (${summary.passRate}%) | Cumulative: ${ledger.cumulativeAuditedCases.toLocaleString()}/${ledger.targetScale.toLocaleString()} (${ledger.cumulativePassRate}%)`
    );
  }
}

main().catch((err) => {
  console.error('[eval:continuous] Fatal error:', err);
  process.exit(1);
});
