import { getEvents, getFrontierClusters, getAiRegulations } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { computeSagriScores, buildLiveMetricsBySlug, DEFAULT_SAGRI_WEIGHTS } from '@/lib/governanceIndex';

export const dynamic = 'force-dynamic';

export default async function EmbedReadinessWidget({ searchParams }) {
  const sp = (await searchParams) || {};
  const isLight = sp.theme === 'light';
  const limit = Math.min(Math.max(parseInt(sp.limit || '8', 10) || 8, 3), 24);

  const [events, clusters, regulations] = await Promise.all([
    getEvents('90d').catch(() => []),
    getFrontierClusters(200).catch(() => []),
    getAiRegulations().catch(() => [])
  ]);

  const combinedSagriEvents = [...(getStopKillerRobotsSignals() || []), ...(events || [])];
  const liveMetrics = buildLiveMetricsBySlug({ events: combinedSagriEvents, clusters, regulations });
  const ranked = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics).slice(0, limit);

  const bg = isLight ? '#ffffff' : '#080e1a';
  const rowBg = isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.72)';
  const textMain = isLight ? '#0f172a' : '#f8fafc';
  const textMuted = isLight ? '#475569' : '#94a3b8';
  const borderCol = isLight ? '#cbd5e1' : 'rgba(56, 189, 248, 0.25)';
  const accentCol = isLight ? '#0369a1' : '#00f0ff';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain, padding: '14px', fontFamily: 'var(--font-inter-fallback)' }}>
      <div style={{ border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '14px', background: isLight ? '#ffffff' : 'rgba(11, 17, 32, 0.94)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: accentCol, fontWeight: 700 }}>
              SOVEREIGN AI GOVERNANCE READINESS INDEX (SAGRI)
            </div>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: textMain, marginTop: '2px' }}>
              Top {ranked.length} Sovereign Jurisdictions
            </h1>
          </div>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: textMuted }}>LIVE 0–100</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {ranked.map((row, idx) => (
            <a
              key={row.slug}
              href={`https://app.sovdash.com/jurisdiction/${row.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 90px 44px',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                background: rowBg,
                border: `1px solid ${borderCol}`,
                textDecoration: 'none',
                color: textMain
              }}
            >
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: textMuted }}>
                #{idx + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.name}
                </div>
                <div style={{ fontSize: '10px', color: textMuted }}>{row.posture}</div>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, row.score)}%`, height: '100%', background: isLight ? '#047857' : '#34d399' }} />
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 800, textAlign: 'right', fontFamily: 'var(--font-jetbrains-fallback)', color: isLight ? '#047857' : '#34d399' }}>
                {row.score}
              </span>
            </a>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${borderCol}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
          <a
            href="https://app.sovdash.com/readiness"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: accentCol, fontWeight: 700, textDecoration: 'none' }}
          >
            Interactive Index &amp; Methodology — Sovereign Observatory ↗
          </a>
        </div>
      </div>
    </div>
  );
}
