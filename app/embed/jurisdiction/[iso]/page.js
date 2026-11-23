import { notFound } from 'next/navigation';
import { getJurisdictionBySlug, eventMatchesJurisdiction } from '@/lib/jurisdictions';
import { getEvents, getEventsByJurisdiction, getFrontierClusters, getAiRegulations } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { computeSagriScores, buildLiveMetricsBySlug, DEFAULT_SAGRI_WEIGHTS } from '@/lib/governanceIndex';
import { normalizeSignalId } from '@/lib/provenance';

export const dynamic = 'force-dynamic';

export default async function EmbedJurisdictionWidget({ params, searchParams }) {
  const { iso } = await params;
  const sp = (await searchParams) || {};
  const isLight = sp.theme === 'light';

  const jurisdiction = getJurisdictionBySlug(decodeURIComponent(String(iso || '')));
  if (!jurisdiction) {
    notFound();
  }

  const [allEvents, dbJurisdictionSignals, clusters, regulations] = await Promise.all([
    getEvents('90d').catch(() => []),
    getEventsByJurisdiction(jurisdiction.matchPatterns, 50).catch(() => []),
    getFrontierClusters(200).catch(() => []),
    getAiRegulations().catch(() => [])
  ]);

  const curated = (getStopKillerRobotsSignals() || []).filter((s) =>
    eventMatchesJurisdiction(s, jurisdiction)
  );
  const seen = new Set();
  for (const s of [...curated, ...(dbJurisdictionSignals || [])]) {
    const cid = normalizeSignalId(s?.id);
    if (cid) seen.add(cid);
  }

  const domesticClusters = (clusters || []).filter((c) => {
    if (c.jurisdictionSlug && c.jurisdictionSlug === jurisdiction.slug) return true;
    const hay = `${c.country || ''} ${c.address || ''}`.toLowerCase();
    return jurisdiction.matchPatterns?.some((pat) => hay.includes(pat.toLowerCase()));
  });
  const totalMw = Math.round(domesticClusters.reduce((acc, c) => acc + (Number(c.powerMw) || 0), 0));

  const combinedSagriEvents = [...(getStopKillerRobotsSignals() || []), ...(allEvents || [])];
  const liveMetrics = buildLiveMetricsBySlug({ events: combinedSagriEvents, clusters, regulations });
  const sagriList = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics);
  const sagri = sagriList.find((s) => s.slug === jurisdiction.slug);
  const flagship = jurisdiction.flagshipInstruments?.[0] || null;

  const bg = isLight ? '#ffffff' : '#080e1a';
  const cardBg = isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.78)';
  const textMain = isLight ? '#0f172a' : '#f8fafc';
  const textMuted = isLight ? '#475569' : '#94a3b8';
  const borderCol = isLight ? '#cbd5e1' : 'rgba(56, 189, 248, 0.28)';
  const accentCol = isLight ? '#0369a1' : '#00f0ff';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', fontFamily: 'var(--font-inter-fallback)' }}>
      <div style={{ border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '14px', background: isLight ? '#ffffff' : 'rgba(11, 17, 32, 0.94)', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: textMuted, fontWeight: 700 }}>
              {jurisdiction.iso} · {jurisdiction.region.toUpperCase()}
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: textMain, marginTop: '2px', lineHeight: 1.2 }}>
              {jurisdiction.name}
            </h1>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-jetbrains-fallback)', padding: '3px 8px', borderRadius: '4px', color: isLight ? '#0f172a' : jurisdiction.postureColor, background: isLight ? '#e2e8f0' : `${jurisdiction.postureColor}1f`, border: `1px solid ${isLight ? '#94a3b8' : `${jurisdiction.postureColor}55`}` }}>
            {jurisdiction.posture.toUpperCase()}
          </span>
        </div>

        {/* 3 KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '6px', padding: '8px 10px' }}>
            <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: textMuted, fontWeight: 700 }}>SAGRI SCORE</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: isLight ? '#047857' : '#34d399' }}>
              {sagri?.score ?? 0}<span style={{ fontSize: '11px', color: textMuted }}>/100</span>
            </div>
          </div>
          <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '6px', padding: '8px 10px' }}>
            <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: textMuted, fontWeight: 700 }}>SIGNALS</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: accentCol }}>{seen.size}</div>
          </div>
          <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: '6px', padding: '8px 10px' }}>
            <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: textMuted, fontWeight: 700 }}>COMPUTE</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: isLight ? '#b45309' : '#facc15' }}>
              {totalMw > 0 ? `${totalMw}` : domesticClusters.length}<span style={{ fontSize: '10px', color: textMuted }}> {totalMw > 0 ? 'MW' : 'hubs'}</span>
            </div>
          </div>
        </div>

        {/* Flagship Law + Regulator */}
        <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.45 }}>
          {flagship ? (
            <div>
              <strong style={{ color: textMain }}>Flagship Law:</strong> {flagship.name} ({flagship.status} · {flagship.effectiveDate})
            </div>
          ) : null}
          <div style={{ marginTop: '3px' }}>
            <strong style={{ color: textMain }}>Regulator:</strong> {jurisdiction.regulator}
          </div>
        </div>

        {/* Footer Backlink */}
        <div style={{ borderTop: `1px solid ${borderCol}`, paddingTop: '9px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
          <a
            href={`https://app.sovdash.com/jurisdiction/${jurisdiction.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: accentCol, fontWeight: 700, textDecoration: 'none' }}
          >
            Full Dossier &amp; Citations ↗
          </a>
          <a
            href="https://app.sovdash.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: textMuted, textDecoration: 'none' }}
          >
            Powered by Sovereign Observatory
          </a>
        </div>
      </div>
    </div>
  );
}
