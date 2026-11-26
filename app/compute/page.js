import Link from 'next/link';
import { getFrontierClusters, getFrontierModels, saveFrontierClusters, saveFrontierModels } from '@/lib/db';
import { fetchEpochFrontierClusters, fetchEpochFrontierModels, computeGovernanceCoverage } from '@/lib/epochSync';
import ObservatorySubNav from '@/components/ObservatorySubNav';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Global Frontier Compute & Jurisdiction Observatory',
  description:
    'Live Epoch AI dataset mapping hyperscale AI training clusters (MW, H100 equivalents, CapEx) and frontier models against binding international AI regulations.',
  alternates: { canonical: '/compute' }
};

function formatFlop(val) {
  const num = Number(val);
  if (!num || isNaN(num)) return 'Undisclosed';
  const exp = Math.floor(Math.log10(num));
  const coeff = (num / Math.pow(10, exp)).toFixed(1);
  return `${coeff} × 10^${exp}`;
}

export default async function ComputeObservatoryPage() {
  let [clusters, models] = await Promise.all([
    getFrontierClusters(160).catch(() => []),
    getFrontierModels(140).catch(() => [])
  ]);

  if (clusters.length === 0) {
    try {
      const freshClusters = await fetchEpochFrontierClusters(160);
      if (freshClusters.length > 0) {
        clusters = freshClusters;
        await saveFrontierClusters(freshClusters);
      }
    } catch (e) {
      console.warn('/compute cluster auto-hydration skipped:', e.message);
    }
  }

  if (models.length === 0) {
    try {
      const freshModels = await fetchEpochFrontierModels(140);
      if (freshModels.length > 0) {
        models = freshModels;
        await saveFrontierModels(freshModels);
      }
    } catch (e) {
      console.warn('/compute model auto-hydration skipped:', e.message);
    }
  }

  const coverage = computeGovernanceCoverage(clusters);

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: 'var(--sov-bg)', color: 'var(--sov-text)', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <ObservatorySubNav active="compute" />

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-amber)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // EPOCH AI COMPUTE &amp; JURISDICTION CORRELATION
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.45rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Global Frontier Compute &amp; Sovereign Oversight Observatory
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '860px' }}>
            Couples live <strong>Epoch AI Frontier Data Centers</strong> and <strong>Notable AI Models</strong> directly to Sovereign&apos;s jurisdiction registry—quantifying how global AI power capacity (<code>MW</code>) and accelerator equivalents (<code>H100e</code>) distribute across binding statutory regimes vs. voluntary governance zones.
          </p>
        </header>

        {/* Top KPI Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Tracked AI Clusters', value: coverage.totalClusters, color: 'var(--sov-accent)' },
            { label: 'Aggregate Power Capacity', value: `${coverage.totalPowerGw} GW`, color: 'var(--sov-amber)' },
            { label: 'Compute Equivalents', value: `${coverage.totalH100Millions}M H100e`, color: 'var(--sov-emerald)' },
            { label: 'Recent Frontier Models', value: models.length, color: 'var(--sov-purple)' }
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sov-muted)', textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: kpi.color, fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '4px' }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </section>

        {/* Empirical Compute-Governance Coverage Breakdown */}
        <section style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--sov-text)' }}>Compute–Governance Coverage Distribution (By Cluster Power Share)</h2>
            <span style={{ fontSize: '11px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>SOURCE: EPOCH AI OPEN DATA</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {coverage.buckets.map((b) => (
              <div key={b.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--sov-text)', fontWeight: 600 }}>{b.label}</span>
                  <span style={{ color: b.color, fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700 }}>
                    {b.sharePct}% ({b.powerGw} GW • {b.clusters} clusters)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'var(--sov-card-bg)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(2, b.sharePct))}%`, height: '100%', background: b.color }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '4px', padding: '12px 14px', borderRadius: '8px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', fontSize: '12.5px', color: 'var(--sov-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--sov-text)' }}>How to interpret this gap:</strong> <strong>GW / MW</strong> measures electric power load required to train and serve frontier AI models; <strong>H100e</strong> normalizes diverse GPUs/TPUs into NVIDIA H100 equivalents; <strong>FLOP</strong> measures cumulative mathematical operations used during training. Currently <strong>{coverage.sectoralPct}%</strong> of tracked global AI cluster power operates outside comprehensive national AI statutes—see our full empirical analysis in{' '}
            <Link href="/whitepaper#sec-2" style={{ color: 'var(--sov-accent)', fontWeight: 700, textDecoration: 'none' }}>Whitepaper v2.0 →</Link>
          </div>
        </section>

        {/* Ranked Frontier Data Center Clusters */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--sov-text)' }}>Largest Frontier AI Compute Clusters ({clusters.length})</h2>
          <div className="sov-desktop-table" style={{ overflowX: 'auto', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sov-border)', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '11px 12px' }}>Cluster</th>
                  <th style={{ padding: '11px 12px' }}>Owner</th>
                  <th style={{ padding: '11px 12px' }}>Power (MW)</th>
                  <th style={{ padding: '11px 12px' }}>H100 Equiv.</th>
                  <th style={{ padding: '11px 12px' }}>CapEx ($B)</th>
                  <th style={{ padding: '11px 12px' }}>Hardware</th>
                  <th style={{ padding: '11px 12px' }}>Jurisdiction</th>
                </tr>
              </thead>
              <tbody>
                {clusters.slice(0, 45).map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--sov-text)' }}>
                      <a href={c.sourceUrl || 'https://epoch.ai/data/data-centers'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sov-text)', textDecoration: 'none' }}>
                        {c.name} ↗
                      </a>
                      <div style={{ fontSize: '11px', color: 'var(--sov-muted)', fontWeight: 400 }}>{c.address || c.country}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--sov-text)' }}>{c.owner || 'Undisclosed'}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-amber)', fontWeight: 700 }}>
                      {c.powerMw ? `${c.powerMw} MW` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-accent)' }}>
                      {c.h100Equivalents ? c.h100Equivalents.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-emerald)' }}>
                      {c.capexBillions ? `$${c.capexBillions}B` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--sov-muted)' }}>{c.chipTypes || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {c.jurisdictionSlug ? (
                        <Link
                          href={`/jurisdiction/${c.jurisdictionSlug}`}
                          style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-purple)', textDecoration: 'none', fontWeight: 700 }}
                        >
                          {c.jurisdictionSlug.toUpperCase()} DOSSIER →
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--sov-muted)' }}>{c.country}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sov-mobile-cards">
            {clusters.slice(0, 30).map((c) => (
              <div key={c.id} style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <a href={c.sourceUrl || 'https://epoch.ai/data/data-centers'} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--sov-text)', textDecoration: 'none' }}>
                    {c.name} ↗
                  </a>
                  <span style={{ fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-amber)', fontWeight: 800, fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                    {c.powerMw ? `${c.powerMw} MW` : '—'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--sov-muted)' }}>
                  {c.owner || 'Undisclosed'} · {c.address || c.country}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                  <span style={{ color: 'var(--sov-accent)' }}>{c.h100Equivalents ? `${c.h100Equivalents.toLocaleString()} H100e` : 'Hardware TBA'}</span>
                  <span style={{ color: 'var(--sov-emerald)' }}>{c.capexBillions ? `$${c.capexBillions}B` : ''}</span>
                  {c.jurisdictionSlug && (
                    <Link href={`/jurisdiction/${c.jurisdictionSlug}`} style={{ color: 'var(--sov-purple)', fontWeight: 700, textDecoration: 'none' }}>
                      {c.jurisdictionSlug.toUpperCase()} DOSSIER →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Frontier Models */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--sov-text)' }}>Recent Notable &amp; Frontier AI Models (Epoch AI)</h2>
          <div className="sov-desktop-table" style={{ overflowX: 'auto', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sov-border)', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '11px 12px' }}>Model</th>
                  <th style={{ padding: '11px 12px' }}>Organization</th>
                  <th style={{ padding: '11px 12px' }}>Release Date</th>
                  <th style={{ padding: '11px 12px' }}>Compute (FLOP)</th>
                  <th style={{ padding: '11px 12px' }}>Weights</th>
                  <th style={{ padding: '11px 12px' }}>Origin</th>
                </tr>
              </thead>
              <tbody>
                {models.slice(0, 35).map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                      <a href={m.link || 'https://epoch.ai/data/ai-models'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sov-sky)', textDecoration: 'none' }}>
                        {m.model} ↗
                      </a>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--sov-text)' }}>{m.organization}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)' }}>{m.publicationDate}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-amber)' }}>{formatFlop(m.trainingComputeFlop)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: m.openWeights ? '#34d399' : '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                        {m.openWeights ? 'Open Weights' : 'Restricted / API'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--sov-muted)' }}>{m.country || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sov-mobile-cards">
            {models.slice(0, 25).map((m) => (
              <div key={m.id} style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <a href={m.link || 'https://epoch.ai/data/ai-models'} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--sov-sky)', textDecoration: 'none' }}>
                    {m.model} ↗
                  </a>
                  <span style={{ color: m.openWeights ? 'var(--sov-emerald)' : 'var(--sov-muted)', fontSize: '10.5px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {m.openWeights ? 'Open Weights' : 'Restricted'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--sov-muted)' }}>
                  <span>{m.organization}</span>
                  <span style={{ color: 'var(--sov-amber)', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700 }}>{formatFlop(m.trainingComputeFlop)} FLOP</span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                  {m.publicationDate} · {m.country || 'Global'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
