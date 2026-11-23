import Link from 'next/link';
import ReadinessIndexClient from '@/components/ReadinessIndexClient';
import { JURISDICTIONS, eventMatchesJurisdiction } from '@/lib/jurisdictions';
import { getEvents, getAiRegulations, getFrontierClusters } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { computeEpistemicParity } from '@/lib/governanceIndex';
import { normalizeSignalId } from '@/lib/provenance';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SAGRI Readiness Index & Epistemic Parity Lens',
  description:
    'Interactive Sovereign AI Governance & Safety Readiness Index (0–100) paired with live empirical Global North vs. Global South epistemic representation and MIT AI Risk Repository analytics.',
  alternates: { canonical: '/readiness' }
};

export default async function ReadinessIndexPage() {
  const [dbEvents, regs, clusters] = await Promise.all([
    getEvents('all').catch(() => []),
    getAiRegulations().catch(() => []),
    getFrontierClusters(200).catch(() => [])
  ]);

  const curated = getStopKillerRobotsSignals() || [];
  const seen = new Set();
  const combinedSignals = [];
  for (const ev of [...curated, ...(dbEvents || [])]) {
    const cid = normalizeSignalId(ev?.id);
    if (!cid || seen.has(cid)) continue;
    seen.add(cid);
    combinedSignals.push(ev);
  }

  const liveMetricsBySlug = {};
  for (const j of JURISDICTIONS) {
    const signalCount = combinedSignals.filter((ev) => eventMatchesJurisdiction(ev, j)).length;
    const regulationCount = (regs || []).filter((r) => {
      const hay = `${r.jurisdiction || ''} ${r.title || ''}`.toLowerCase();
      return (
        hay.includes(j.name.toLowerCase()) ||
        j.matchPatterns.some((pat) => new RegExp(`\\b${pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay))
      );
    }).length;
    const powerMw = (clusters || [])
      .filter((c) => c.jurisdictionSlug === j.slug)
      .reduce((acc, c) => acc + (Number(c.powerMw) || 0), 0);

    liveMetricsBySlug[j.slug] = { signalCount, regulationCount, powerMw };
  }

  const parityData = computeEpistemicParity(combinedSignals, clusters || []);

  return (
    <div className="editorial-page" style={{ padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1260px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <nav className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: '#00f0ff', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/compare" style={{ color: '#00f0ff', textDecoration: 'none' }}>LEGAL DIFF MATRIX</Link>
            <Link href="/jurisdictions" style={{ color: '#c084fc', textDecoration: 'none' }}>JURISDICTION ATLAS</Link>
            <Link href="/labs" style={{ color: '#38bdf8', textDecoration: 'none' }}>LAB WATCH</Link>
            <Link href="/compute" style={{ color: '#facc15', textDecoration: 'none' }}>COMPUTE</Link>
            <Link href="/methodology" style={{ color: '#94a3b8', textDecoration: 'none' }}>METHODOLOGY</Link>
          </div>
        </nav>

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: '#10b981', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // PROPRIETARY INDEX &amp; EPISTEMIC PARITY
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.45rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
            Sovereign AI Readiness Index &amp; Global Parity Observatory
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, maxWidth: '880px' }}>
            Composite governance readiness benchmark paired with real-time epistemic representation telemetry—designed for transparent sensitivity testing in institutional policy audits and graduate sociotechnical AI research.
          </p>
        </header>

        <ReadinessIndexClient
          liveMetricsBySlug={liveMetricsBySlug}
          parityData={parityData}
          totalSignals={combinedSignals.length}
          totalClusters={(clusters || []).length}
        />
      </div>
    </div>
  );
}
