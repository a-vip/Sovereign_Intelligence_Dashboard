import Link from 'next/link';
import { getEvents, getFrontierClusters, getAiRegulations } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { computeSagriScores } from '@/lib/governanceIndex';
import { computeAdmiraltyGrade, computeContentHash, normalizeSignalId } from '@/lib/provenance';
import { classifyMitRiskDomain } from '@/lib/mitRiskTaxonomy';
import BriefGeneratorClient from '@/components/BriefGeneratorClient';

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

  const sagriList = computeSagriScores({
    events: [...(curatedEvents || []), ...(dbEvents || [])],
    clusters,
    regulations
  });

  const serialClusters = (clusters || []).map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
    address: c.address,
    jurisdictionSlug: c.jurisdictionSlug,
    powerMw: Number(c.powerMw) || 0
  }));

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: '#060a12', color: '#e2e8f0', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1220px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <nav className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: '#00f0ff', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/watchlists" style={{ color: '#c084fc', textDecoration: 'none' }}>WATCHLISTS</Link>
            <Link href="/developers" style={{ color: '#34d399', textDecoration: 'none' }}>API &amp; EMBEDS</Link>
            <Link href="/compare" style={{ color: '#00f0ff', textDecoration: 'none' }}>DIFF MATRIX</Link>
            <Link href="/readiness" style={{ color: '#38bdf8', textDecoration: 'none' }}>READINESS INDEX</Link>
          </div>
        </nav>

        <header className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: '#00f0ff', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // EXECUTIVE BRIEFING &amp; GROUNDED COPILOT
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
            Executive Intelligence Brief Exporter
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, maxWidth: '860px' }}>
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
