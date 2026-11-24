import Link from 'next/link';
import { getEvents, getFrontierClusters, getAiRegulations } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { computeSagriScores, buildLiveMetricsBySlug, DEFAULT_SAGRI_WEIGHTS } from '@/lib/governanceIndex';
import { computeAdmiraltyGrade, computeContentHash, normalizeSignalId } from '@/lib/provenance';
import { classifyMitRiskDomain } from '@/lib/mitRiskTaxonomy';
import BriefGeneratorClient from '@/components/BriefGeneratorClient';
import ObservatorySubNav from '@/components/ObservatorySubNav';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Executive Intelligence Brief Generator & Citation-Locked Copilot',
  description:
    'Generate publication-ready Markdown and PDF executive intelligence briefings over verified AI governance signals, Epoch AI compute clusters, SAGRI readiness scores, and OSCOLA academic references.',
  alternates: { canonical: '/brief' }
};

export default async function BriefPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const initialJurisdiction = String(sp.jurisdiction || 'all').trim();

  const [dbEvents, curatedEvents, clusters, regulations] = await Promise.all([
    getEvents('all').catch(() => []),
    Promise.resolve(getStopKillerRobotsSignals() || []),
    getFrontierClusters(200).catch(() => []),
    getAiRegulations().catch(() => [])
  ]);

  const seen = new Set();
  const serialSignals = [];
  for (const ev of [...(curatedEvents || []), ...(dbEvents || [])]) {
    const cid = normalizeSignalId(ev?.id);
    if (!cid || seen.has(cid)) continue;
    seen.add(cid);
    const adm = computeAdmiraltyGrade(ev);
    const mit = classifyMitRiskDomain(ev.title || '', ev.details?.summary || '', ev.details?.domainPillar || '');
    const tsRaw = ev.original_post_time || ev.timestamp;
    const tsIso = tsRaw ? new Date(tsRaw).toISOString() : null;
    serialSignals.push({
      id: cid,
      title: ev.title || 'AI Policy Signal',
      category: ev.category || 'Political',
      pillar: ev.details?.domainPillar || ev.category || 'AI Governance & Policy',
      severity: Number(ev.severity) || 2,
      location: ev.location || 'Global / Multilateral',
      source: ev.details?.source || ev.source || 'OSINT',
      url: ev.url || null,
      timestamp: tsIso,
      summary: ev.details?.summary || '',
      admiraltyGrade: adm.grade,
      mitCode: mit.code,
      sha256: computeContentHash(ev)
    });
  }

  serialSignals.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const combinedForSagri = [...(curatedEvents || []), ...(dbEvents || [])];
  const liveMetrics = buildLiveMetricsBySlug({
    events: combinedForSagri,
    clusters,
    regulations
  });
  const sagriList = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics);

  const serialClusters = (clusters || []).map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
    address: c.address,
    jurisdictionSlug: c.jurisdictionSlug,
    powerMw: Number(c.powerMw) || 0
  }));

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: 'var(--sov-bg)', color: 'var(--sov-text)', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1220px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ObservatorySubNav active="brief" />

        <header className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // EXECUTIVE BRIEFING &amp; GROUNDED COPILOT
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Executive Intelligence Brief Exporter
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '860px' }}>
            Filter live &amp; archived signals across jurisdictions and policy pillars, run citation-locked synthesis over verified records, and export print-ready PDFs or Markdown briefings with SHA-256 digests and OSCOLA citations.
          </p>
        </header>

        <BriefGeneratorClient
          jurisdictions={JURISDICTIONS}
          sagriList={sagriList}
          signals={serialSignals}
          clusters={serialClusters}
          initialJurisdiction={initialJurisdiction}
        />
      </div>
    </div>
  );
}
