import { JURISDICTIONS, eventMatchesJurisdiction } from '@/lib/jurisdictions';
import { getEvents, getAiRegulations, getFrontierClusters } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { computeSagriScores, buildLiveMetricsBySlug, DEFAULT_SAGRI_WEIGHTS } from '@/lib/governanceIndex';
import { normalizeSignalId } from '@/lib/provenance';
import ObservatorySubNav from '@/components/ObservatorySubNav';
import JurisdictionsAtlasClient from '@/components/JurisdictionsAtlasClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Global AI Governance Jurisdiction Atlas',
  description:
    'Comparative directory of binding AI legislation, safety institutes, multilateral treaties, and live incident telemetry across 60+ global AI jurisdictions.',
  alternates: { canonical: '/jurisdictions' }
};

export default async function JurisdictionsAtlasPage() {
  const [dbEvents, regs, clusters] = await Promise.all([
    getEvents('all').catch(() => []),
    getAiRegulations().catch(() => []),
    getFrontierClusters(200).catch(() => [])
  ]);

  const curated = getStopKillerRobotsSignals() || [];
  const seenIds = new Set();
  const combinedSignals = [];
  for (const ev of [...curated, ...(dbEvents || [])]) {
    const cid = normalizeSignalId(ev?.id);
    if (!cid || seenIds.has(cid)) continue;
    seenIds.add(cid);
    combinedSignals.push(ev);
  }
  const liveMetrics = buildLiveMetricsBySlug({ events: combinedSignals, clusters, regulations: regs });
  const sagriScores = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics);
  const sagriMap = Object.fromEntries(sagriScores.map((s) => [s.slug, s]));

  const enriched = JURISDICTIONS.map((j) => {
    const signalCount = combinedSignals.filter((ev) => eventMatchesJurisdiction(ev, j)).length;
    const regCount = (regs || []).filter((r) => {
      const hay = `${r.jurisdiction || ''} ${r.title || ''}`.toLowerCase();
      return (
        hay.includes(j.name.toLowerCase()) ||
        j.matchPatterns.some((pat) => new RegExp(`\\b${pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay))
      );
    }).length;
    const s = sagriMap[j.slug];
    return {
      ...j,
      signalCount,
      regCount,
      powerMw: liveMetrics[j.slug]?.powerMw || 0,
      sagriScore: s?.score ?? 0,
      sagriTier: s?.tier || 'Tracked',
      sagriColor: s?.tierColor || '#10b981'
    };
  });

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: 'var(--sov-bg)', color: 'var(--sov-text)', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1220px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ObservatorySubNav active="jurisdictions" />

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-purple)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // COMPARATIVE LEGAL &amp; SAFETY ATLAS
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Global AI Governance &amp; Safety Jurisdictions
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '820px' }}>
            Explore statutory AI obligations, frontier safety institutes, treaty ratifications (Council of Europe CETS No. 225, UN CCW LAWS), SAGRI readiness scores, and verified OSINT telemetry across {JURISDICTIONS.length} sovereign and multilateral authorities.
          </p>
        </header>

        <JurisdictionsAtlasClient jurisdictions={enriched} />
      </div>
    </div>
  );
}
