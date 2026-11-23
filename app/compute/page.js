import Link from 'next/link';
import { getFrontierClusters, getFrontierModels, saveFrontierClusters, saveFrontierModels } from '@/lib/db';
import { fetchEpochFrontierClusters, fetchEpochFrontierModels, computeGovernanceCoverage } from '@/lib/epochSync';

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
    <div style={{ minHeight: '100vh', background: '#060a12', color: '#e2e8f0', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: '#00f0ff', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/labs" style={{ color: '#10b981', textDecoration: 'none' }}>FRONTIER LAB WATCH</Link>
            <Link href="/jurisdictions" style={{ color: '#c084fc', textDecoration: 'none' }}>JURISDICTION ATLAS</Link>
            <Link href="/methodology" style={{ color: '#38bdf8', textDecoration: 'none' }}>METHODOLOGY</Link>
          </div>
        </nav>

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: '#facc15', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // EPOCH AI COMPUTE &amp; JURISDICTION CORRELATION
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.45rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
            Global Frontier Compute &amp; Sovereign Oversight Observatory
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, maxWidth: '860px' }}>
            Couples live <strong>Epoch AI Frontier Data Centers</strong> and <strong>Notable AI Models</strong> directly to Sovereign&apos;s jurisdiction registry—quantifying how global AI power capacity (<code>MW</code>) and accelerator equivalents (<code>H100e</code>) distribute across binding statutory regimes vs. voluntary governance zones.
          </p>
        </header>

        {/* Top KPI Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Tracked AI Clusters', value: coverage.totalClusters, color: '#00f0ff' },
            { label: 'Aggregate Power Capacity', value: `${coverage.totalPowerGw} GW`, color: '#facc15' },
            { label: 'Compute Equivalents', value: `${coverage.totalH100Millions}M H100e`, color: '#10b981' },
            { label: 'Recent Frontier Models', value: models.length, color: '#c084fc' }
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: 'rgba(11, 17, 32, 0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: kpi.color, fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '4px' }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </section>

        {/* Empirical Compute-Governance Coverage Breakdown */}
        <section style={{ background: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(56, 189, 248, 0.22)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>Compute–Governance Coverage Distribution (By Cluster Power Share)</h2>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)' }}>SOURCE: EPOCH AI OPEN DATA</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {coverage.buckets.map((b) => (
              <div key={b.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{b.label}</span>
                  <span style={{ color: b.color, fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700 }}>
                    {b.sharePct}% ({b.powerGw} GW • {b.clusters} clusters)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(2, b.sharePct))}%`, height: '100%', background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ranked Frontier Data Center Clusters */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>Largest Frontier AI Compute Clusters ({clusters.length})</h2>
          <div style={{ overflowX: 'auto', background: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', textTransform: 'uppercase' }}>
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
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#ffffff' }}>
                      <a href={c.sourceUrl || 'https://epoch.ai/data/data-centers'} target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', textDecoration: 'none' }}>
                        {c.name} ↗
                      </a>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>{c.address || c.country}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{c.owner || 'Undisclosed'}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#facc15', fontWeight: 700 }}>
                      {c.powerMw ? `${c.powerMw} MW` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#00f0ff' }}>
                      {c.h100Equivalents ? c.h100Equivalents.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#34d399' }}>
                      {c.capexBillions ? `$${c.capexBillions}B` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{c.chipTypes || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {c.jurisdictionSlug ? (
                        <Link
                          href={`/jurisdiction/${c.jurisdictionSlug}`}
                          style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#c084fc', textDecoration: 'none', fontWeight: 700 }}
                        >
                          {c.jurisdictionSlug.toUpperCase()} DOSSIER →
                        </Link>
                      ) : (
                        <span style={{ color: '#64748b' }}>{c.country}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Frontier Models */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>Recent Notable &amp; Frontier AI Models (Epoch AI)</h2>
          <div style={{ overflowX: 'auto', background: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', textTransform: 'uppercase' }}>
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
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                      <a href={m.link || 'https://epoch.ai/data/ai-models'} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                        {m.model} ↗
                      </a>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{m.organization}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#94a3b8' }}>{m.publicationDate}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#facc15' }}>{formatFlop(m.trainingComputeFlop)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: m.openWeights ? '#34d399' : '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                        {m.openWeights ? 'Open Weights' : 'Restricted / API'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{m.country || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
