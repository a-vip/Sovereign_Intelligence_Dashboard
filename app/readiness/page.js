import ReadinessIndexClient from '@/components/ReadinessIndexClient';
import ObservatorySubNav from '@/components/ObservatorySubNav';
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
        <ObservatorySubNav active="readiness" />

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-emerald)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // PROPRIETARY INDEX &amp; EPISTEMIC PARITY
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.45rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Sovereign AI Readiness Index &amp; Global Parity Observatory
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '880px' }}>
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
