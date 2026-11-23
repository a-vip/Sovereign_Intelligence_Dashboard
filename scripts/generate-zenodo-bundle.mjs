import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getEvents, getFrontierClusters, getAiRegulations } from '../lib/db.js';
import { getStopKillerRobotsSignals } from '../lib/researchFunnel.js';
import { JURISDICTIONS } from '../lib/jurisdictions.js';
import { computeAdmiraltyGrade, computeContentHash, normalizeSignalId } from '../lib/provenance.js';
import { classifyMitRiskDomain } from '../lib/mitRiskTaxonomy.js';
import { computeSagriScores, buildLiveMetricsBySlug, DEFAULT_SAGRI_WEIGHTS } from '../lib/governanceIndex.js';

const versionTag = new Date().toISOString().slice(0, 7);
const outDir = path.resolve(`exports/zenodo-${versionTag}`);
fs.mkdirSync(outDir, { recursive: true });

function csvCell(val) {
  const s = String(val ?? '').replace(/\r?\n/g, ' ');
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const [dbEvents, curatedEvents, clusters, regulations] = await Promise.all([
  getEvents('all').catch(() => []),
  Promise.resolve(getStopKillerRobotsSignals() || []),
  getFrontierClusters(200).catch(() => []),
  getAiRegulations().catch(() => [])
]);

const seen = new Set();
const signals = [];
for (const ev of [...curatedEvents, ...(dbEvents || [])]) {
  const cid = normalizeSignalId(ev?.id);
  if (!cid || seen.has(cid)) continue;
  seen.add(cid);
  const adm = computeAdmiraltyGrade(ev);
  const mit = classifyMitRiskDomain(ev.title || '', ev.details?.summary || '', ev.details?.domainPillar || '');
  signals.push({
    id: cid,
    title: ev.title || '',
    category: ev.category || 'Political',
    pillar: ev.details?.domainPillar || ev.category || 'AI Governance & Policy',
    severity: Number(ev.severity) || 2,
    location: ev.location || 'Global / Multilateral',
    lat: ev.lat ?? null,
    lon: ev.lon ?? null,
    timestamp: ev.original_post_time || ev.timestamp || null,
    source: ev.details?.source || ev.source || 'Sovereign OSINT',
    lifecycle_state: ev.lifecycle_state || 'active',
    admiralty_grade: adm.grade,
    mit_risk_code: mit.code,
    sha256: computeContentHash(ev),
    permalink: `https://app.sovdash.com/signal/${encodeURIComponent(cid)}`,
    url: ev.url || null
  });
}

fs.writeFileSync(path.join(outDir, 'signals.jsonl'), signals.map((s) => JSON.stringify(s)).join('\n'));

const liveMetrics = buildLiveMetricsBySlug({ events: [...curatedEvents, ...(dbEvents || [])], clusters, regulations });
const sagri = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics);
const jurHeaders = ['slug', 'iso', 'name', 'region', 'posture', 'sagri_score', 'tier', 'signals_live', 'regulations_live', 'power_mw'];
const jurCsv = [
  jurHeaders.join(','),
  ...sagri.map((s) =>
    [s.slug, s.iso, s.name, s.region, s.posture, s.score, s.tier, s.live?.signalCount || 0, s.live?.regulationCount || 0, s.live?.powerMw || 0]
      .map(csvCell)
      .join(',')
  )
].join('\n');
fs.writeFileSync(path.join(outDir, 'jurisdictions.csv'), jurCsv);

const clHeaders = ['id', 'name', 'owner', 'country', 'jurisdiction_slug', 'lat', 'lon', 'power_mw', 'h100_equivalents', 'capex_billions'];
const clCsv = [
  clHeaders.join(','),
  ...(clusters || []).map((c) =>
    [c.id, c.name, c.owner, c.country, c.jurisdictionSlug, c.lat, c.lon, c.powerMw, c.h100Equivalents, c.capexBillions]
      .map(csvCell)
      .join(',')
  )
].join('\n');
fs.writeFileSync(path.join(outDir, 'compute_clusters.csv'), clCsv);

if (fs.existsSync(path.resolve('CITATION.cff'))) {
  fs.copyFileSync(path.resolve('CITATION.cff'), path.join(outDir, 'CITATION.cff'));
}

const datapackage = {
  profile: 'tabular-data-package',
  name: 'sovereign-ai-policy-observatory',
  version: versionTag,
  created: new Date().toISOString(),
  licenses: [{ name: 'CC-BY-4.0', path: 'https://creativecommons.org/licenses/by/4.0/' }],
  counts: { signals: signals.length, jurisdictions: JURISDICTIONS.length, clusters: clusters.length },
  resources: [
    { name: 'signals', path: 'signals.jsonl', format: 'jsonl' },
    { name: 'jurisdictions', path: 'jurisdictions.csv', format: 'csv' },
    { name: 'compute_clusters', path: 'compute_clusters.csv', format: 'csv' }
  ]
};
fs.writeFileSync(path.join(outDir, 'datapackage.json'), JSON.stringify(datapackage, null, 2));
fs.writeFileSync(
  path.join(outDir, 'README.md'),
  `# Sovereign Observatory Open Dataset (${versionTag})\n\nLicense: CC-BY-4.0\nSignals: ${signals.length}\nJurisdictions: ${JURISDICTIONS.length}\nCompute Clusters: ${clusters.length}\n`
);

const checksums = ['signals.jsonl', 'jurisdictions.csv', 'compute_clusters.csv', 'datapackage.json']
  .map((fname) => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(outDir, fname))).digest('hex');
    return `${hash}  ${fname}`;
  })
  .join('\n');
fs.writeFileSync(path.join(outDir, 'SHA256SUMS.txt'), checksums);

console.log(`Zenodo bundle generated at ${outDir} (signals=${signals.length}, clusters=${clusters.length})`);
