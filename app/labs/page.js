import Link from 'next/link';
import { FRONTIER_LABS, matchModelsToLab } from '@/lib/frontierLabs';
import { getFrontierModels, saveFrontierModels } from '@/lib/db';
import { fetchEpochFrontierModels } from '@/lib/epochSync';
import ObservatorySubNav from '@/components/ObservatorySubNav';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Frontier Lab Watch & Safety Governance Matrix',
  description:
    'Comparative tracker of frontier AI safety frameworks (RSP, Preparedness, FSF), third-party evaluations (METR, UK AISI, US CAISI), statutory exposure, and live Epoch AI model releases.',
  alternates: { canonical: '/labs' }
};

function formatFlop(val) {
  const num = Number(val);
  if (!num || isNaN(num)) return '—';
  const exp = Math.floor(Math.log10(num));
  const coeff = (num / Math.pow(10, exp)).toFixed(1);
  return `${coeff}e${exp}`;
}

function BoolBadge({ ok, label }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 7px',
        borderRadius: '4px',
        fontSize: '10px',
        fontFamily: 'var(--font-jetbrains-fallback)',
        fontWeight: 700,
        background: ok ? 'rgba(16, 185, 129, 0.14)' : 'rgba(148, 163, 184, 0.08)',
        border: ok ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
        color: ok ? '#34d399' : '#64748b'
      }}
    >
      {ok ? '✓ ' : '— '}
      {label}
    </span>
  );
}

export default async function FrontierLabsWatchPage() {
  let models = await getFrontierModels(140).catch(() => []);
  if (models.length === 0) {
    try {
      const fresh = await fetchEpochFrontierModels(140);
      if (fresh.length > 0) {
        models = fresh;
        await saveFrontierModels(fresh);
      }
    } catch (e) {
      console.warn('/labs Epoch model auto-hydration skipped:', e.message);
    }
  }

  const enrichedLabs = FRONTIER_LABS.map((lab) => {
    const matched = matchModelsToLab(models, lab);
    return {
      ...lab,
      trackedModelsCount: matched.length,
      latestModels: matched.slice(0, 5)
    };
  });

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: 'var(--sov-bg)', color: 'var(--sov-text)', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1220px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <ObservatorySubNav active="labs" />

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-sky)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // FRONTIER LAB GOVERNANCE &amp; EVALUATION WATCH
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.45rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Frontier AI Safety Commitments &amp; External Audit Matrix
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '860px' }}>
            Structured comparison of major frontier developers across published safety frameworks (Anthropic RSP, OpenAI Preparedness Framework, Google DeepMind FSF), external capability/safety evaluations (METR, UK AISI, US CAISI), statutory exposure, and live model tracking synced from Epoch AI.
          </p>
        </header>

        {/* KPI Summary Strip */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '12px' }}>
          {[
            { label: 'Tracked Frontier Labs', value: enrichedLabs.length, color: 'var(--sov-accent)' },
            { label: 'Published Safety Frameworks', value: enrichedLabs.filter((l) => Boolean(l.safetyFramework?.name)).length, color: 'var(--sov-emerald)' },
            { label: 'External AISI / METR Audited', value: enrichedLabs.filter((l) => l.externalEvaluations?.metrTested || l.externalEvaluations?.ukAisiTested || l.externalEvaluations?.usCaisiTested).length, color: 'var(--sov-purple)' },
            { label: 'Linked Epoch AI Models', value: enrichedLabs.reduce((a, l) => a + (l.trackedModelsCount || 0), 0), color: 'var(--sov-amber)' }
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{kpi.label}</div>
              <div style={{ fontSize: '23px', fontWeight: 800, color: kpi.color, fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '4px' }}>{kpi.value}</div>
            </div>
          ))}
        </section>

        {/* Executive Matrix Table (Desktop) */}
        <section className="sov-desktop-table" style={{ overflowX: 'auto', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sov-border)', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Developer</th>
                <th style={{ padding: '12px 14px' }}>Safety Framework</th>
                <th style={{ padding: '12px 14px' }}>Distribution Posture</th>
                <th style={{ padding: '12px 14px' }}>Independent Evals</th>
                <th style={{ padding: '12px 14px' }}>Statutory Exposure</th>
                <th style={{ padding: '12px 14px' }}>Epoch Models</th>
              </tr>
            </thead>
            <tbody>
              {enrichedLabs.map((lab) => (
                <tr key={lab.slug} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--sov-text)' }}>
                    <div>{lab.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--sov-muted)', fontWeight: 400 }}>{lab.hqLocation}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <a href={lab.safetyFramework.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sov-accent)', fontWeight: 600, textDecoration: 'none' }}>
                      {lab.safetyFramework.name} ↗
                    </a>
                    <div style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>{lab.safetyFramework.version}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ color: lab.postureColor, fontWeight: 600, fontSize: '11.5px' }}>{lab.openWeightsPosture}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <BoolBadge ok={lab.externalEvaluations.metrTested} label="METR" />
                      <BoolBadge ok={lab.externalEvaluations.ukAisiTested} label="UK AISI" />
                      <BoolBadge ok={lab.externalEvaluations.usCaisiTested} label="US CAISI" />
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {lab.statutoryExposure.map((st) => (
                        <Link
                          key={st.label}
                          href={`/jurisdiction/${st.jurisdictionSlug}`}
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(168, 85, 247, 0.12)',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            color: 'var(--sov-purple)',
                            textDecoration: 'none'
                          }}
                        >
                          {st.label}
                        </Link>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-sky)', fontWeight: 700 }}>
                    {lab.trackedModelsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Detailed Lab Dossier Cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: '16px' }}>
          {enrichedLabs.map((lab) => (
            <article key={lab.slug} style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--sov-text)' }}>{lab.name}</h2>
                  <div style={{ fontSize: '11.5px', color: 'var(--sov-muted)' }}>{lab.safetyFramework.name} • {lab.safetyFramework.lastUpdated}</div>
                </div>
                <Link
                  href={`/jurisdiction/${lab.jurisdictionSlug}`}
                  style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-purple)', border: '1px solid rgba(168,85,247,0.35)', borderRadius: '4px', padding: '3px 7px', textDecoration: 'none' }}
                >
                  HQ DOSSIER →
                </Link>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--sov-text)', lineHeight: 1.55 }}>
                {lab.externalEvaluations.summary}
              </p>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <BoolBadge ok={lab.transparency.systemCards} label="System Cards" />
                <BoolBadge ok={lab.transparency.whistleblowerPolicy} label="Whistleblower Shield" />
                <BoolBadge ok={lab.transparency.externalRedTeaming} label="Ext Red-Team" />
                <BoolBadge ok={lab.transparency.computeDisclosed} label="Compute Disclosed" />
              </div>

              {/* Commitment Change Log */}
              <div style={{ background: 'var(--sov-card-bg)', borderRadius: '6px', padding: '10px', border: '1px solid var(--sov-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, marginBottom: '6px' }}>
                  GOVERNANCE &amp; SAFETY MILESTONES
                </div>
                {lab.commitmentChangelog.map((c, idx) => (
                  <div key={idx} style={{ fontSize: '11.5px', color: 'var(--sov-text)', marginBottom: '4px', lineHeight: 1.45 }}>
                    <strong style={{ color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)' }}>{c.date}:</strong> {c.note}
                  </div>
                ))}
              </div>

              {/* Live Epoch AI Models */}
              {lab.latestModels.length > 0 && (
                <div style={{ borderTop: '1px solid var(--sov-border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--sov-sky)', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700 }}>
                    RECENT EPOCH AI TRACKED MODELS ({lab.trackedModelsCount})
                  </div>
                  {lab.latestModels.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', gap: '8px' }}>
                      <a href={m.link || 'https://epoch.ai/data/ai-models'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sov-text)', textDecoration: 'none', fontWeight: 600 }}>
                        {m.model}
                      </a>
                      <span style={{ color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', whiteSpace: 'nowrap' }}>
                        {m.publicationDate} • {formatFlop(m.trainingComputeFlop)} FLOP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
