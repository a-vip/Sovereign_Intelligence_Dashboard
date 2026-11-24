'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, RotateCcw, Search } from 'lucide-react';
import { DEFAULT_SAGRI_WEIGHTS, computeSagriScores } from '@/lib/governanceIndex';

const WEIGHT_SLIDERS = [
  { key: 'statutory', label: 'Statutory Enforceability', color: 'var(--sov-emerald)' },
  { key: 'evaluation', label: 'Technical Safety Eval Capacity', color: 'var(--sov-sky)' },
  { key: 'treaty', label: 'Multilateral Treaty Alignment', color: 'var(--sov-purple)' },
  { key: 'compute', label: 'Compute & Chip Oversight', color: 'var(--sov-amber)' },
  { key: 'transparency', label: 'Epistemic & Audit Transparency', color: 'var(--sov-accent)' }
];

export default function ReadinessIndexClient({ liveMetricsBySlug, parityData, totalSignals, totalClusters }) {
  const [weights, setWeights] = useState(DEFAULT_SAGRI_WEIGHTS);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    setMounted(true);
  }, []);

  const ranked = useMemo(
    () => computeSagriScores(weights, liveMetricsBySlug),
    [weights, liveMetricsBySlug]
  );

  const summaryStats = useMemo(() => {
    const meanAll = ranked.length ? Math.round(ranked.reduce((a, r) => a + r.score, 0) / ranked.length) : 0;
    const majorityRows = ranked.filter((r) => ['MENA & Africa', 'Americas', 'Indo-Pacific'].includes(r.region) && !['United States', 'California (USA)', 'Canada', 'Japan', 'South Korea', 'Australia', 'New Zealand', 'Singapore', 'Taiwan', 'Israel'].includes(r.name));
    const meanMajority = majorityRows.length ? Math.round(majorityRows.reduce((a, r) => a + r.score, 0) / majorityRows.length) : 0;
    const tier1Count = ranked.filter((r) => r.score >= 70).length;
    return { meanAll, meanMajority, tier1Count };
  }, [ranked]);

  const filteredRanked = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ranked.filter((r) => {
      if (regionFilter !== 'All' && r.region !== regionFilter) return false;
      if (q && !`${r.name} ${r.iso} ${r.region} ${r.tier}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ranked, searchQuery, regionFilter]);

  const handleExportCsv = () => {
    if (typeof window === 'undefined') return;
    const headers = [
      'Rank',
      'Jurisdiction',
      'ISO',
      'Region',
      'SAGRI_Score',
      'Tier',
      'Statutory',
      'Evaluation',
      'Treaty',
      'Compute',
      'Transparency',
      'Live_Signals',
      'Tracked_Laws',
      'Compute_MW'
    ];
    const rows = ranked.map((r, i) => [
      i + 1,
      `"${r.name.replace(/"/g, '""')}"`,
      r.iso,
      `"${r.region}"`,
      r.score,
      `"${r.tier}"`,
      r.pillars.statutory,
      r.pillars.evaluation,
      r.pillars.treaty,
      r.pillars.compute,
      r.pillars.transparency,
      r.live.signalCount || 0,
      r.live.regulationCount || 0,
      r.live.powerMw || 0
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sovereign-sagri-index-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '12px' }}>
        {[
          { label: 'Global Mean SAGRI', value: `${summaryStats.meanAll}/100`, sub: `Across ${ranked.length} jurisdictions`, color: 'var(--sov-accent)' },
          { label: 'Global Majority Mean', value: `${summaryStats.meanMajority}/100`, sub: 'Africa, LATAM, South/SE Asia', color: 'var(--sov-purple)' },
          { label: 'Tier-1 Leaders (>=70)', value: summaryStats.tier1Count, sub: 'Statutory & eval leaders', color: 'var(--sov-emerald)' },
          { label: 'Empirical Corpus', value: `${totalSignals} sig • ${totalClusters} clu`, sub: 'Live telemetry & Epoch AI', color: 'var(--sov-amber)' }
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{kpi.label}</div>
            <div style={{ fontSize: '21px', fontWeight: 800, color: kpi.color, fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '4px' }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--sov-muted)', marginTop: '2px' }}>{kpi.sub}</div>
          </div>
        ))}
      </section>

      {/* Interactive Sensitivity Sliders + Export Controls */}
      <section
        className="editorial-card"
        style={{
          background: 'var(--sov-panel-bg)',
          border: '1px solid var(--sov-border)',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--sov-text)' }}>
              Sovereign AI Governance &amp; Safety Readiness Index (SAGRI 0–100)
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--sov-muted)', marginTop: '3px' }}>
              Adjust sub-index weights below to test normative assumptions across {ranked.length} sovereign and multilateral authorities.
            </p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setWeights(DEFAULT_SAGRI_WEIGHTS)}
              className="editorial-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: 'var(--sov-card-bg)',
                color: 'var(--sov-text)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-fallback)',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={12} />
              <span>RESET WEIGHTS</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="editorial-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 11px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--sov-emerald)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-fallback)',
                cursor: 'pointer'
              }}
            >
              <Download size={12} />
              <span>EXPORT CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Region Filters */}
        <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sov-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jurisdiction, ISO, or tier..."
              style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
            />
          </div>
          {['All', 'MENA & Africa', 'Indo-Pacific', 'Americas', 'Europe', 'Multilateral'].map((reg) => {
            const active = regionFilter === reg;
            return (
              <button
                key={reg}
                type="button"
                onClick={() => setRegionFilter(reg)}
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  border: active ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                  background: active ? 'var(--sov-card-bg)' : 'transparent',
                  color: active ? 'var(--sov-accent)' : 'var(--sov-text)',
                  fontSize: '11px',
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer'
                }}
              >
                {reg}
              </button>
            );
          })}
        </div>

        {/* 5 Weight Sliders */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          {WEIGHT_SLIDERS.map((s) => (
            <div
              key={s.key}
              className="editorial-subcard"
              style={{
                background: 'var(--sov-card-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 700 }}>
                <span style={{ color: 'var(--sov-text)' }}>{s.label}</span>
                <span style={{ color: s.color, fontFamily: 'var(--font-jetbrains-fallback)' }}>{weights[s.key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={weights[s.key]}
                onChange={(e) => setWeights((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: s.color, cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>

        {/* Ranked SAGRI Leaderboard (Desktop Table + Mobile Cards) */}
        <div className="sov-desktop-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sov-border)', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 10px' }}>#</th>
                <th style={{ padding: '10px 10px' }}>Jurisdiction</th>
                <th style={{ padding: '10px 10px' }}>SAGRI Score</th>
                <th style={{ padding: '10px 10px' }}>Tier</th>
                <th style={{ padding: '10px 10px' }}>Statutory</th>
                <th style={{ padding: '10px 10px' }}>Eval Cap</th>
                <th style={{ padding: '10px 10px' }}>Treaty</th>
                <th style={{ padding: '10px 10px' }}>Compute</th>
                <th style={{ padding: '10px 10px' }}>Transp</th>
                <th style={{ padding: '10px 10px' }}>Live Corpus</th>
              </tr>
            </thead>
            <tbody>
              {filteredRanked.map((row, idx) => (
                <tr key={row.slug} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                  <td style={{ padding: '9px 10px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '9px 10px', fontWeight: 700 }}>
                    <Link href={`/jurisdiction/${row.slug}`} style={{ color: 'var(--sov-text)', textDecoration: 'none' }}>
                      {row.name}
                    </Link>
                    <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                      {row.region}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px', minWidth: '130px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: row.tierColor, minWidth: '34px' }}>
                        {row.score}
                      </span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(148,163,184,0.18)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${row.score}%`, height: '100%', background: row.tierColor }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: '11px', color: row.tierColor, fontWeight: 600 }}>{row.tier}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>{row.pillars.statutory}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>{row.pillars.evaluation}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>{row.pillars.treaty}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>{row.pillars.compute}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>{row.pillars.transparency}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', color: 'var(--sov-muted)' }}>
                    {row.live.signalCount} sig • {row.live.regulationCount} law{row.live.powerMw ? ` • ${Math.round(row.live.powerMw)}MW` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sov-mobile-cards">
          {filteredRanked.map((row, idx) => (
            <Link
              key={row.slug}
              href={`/jurisdiction/${row.slug}`}
              style={{
                background: 'var(--sov-card-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '8px',
                padding: '12px',
                textDecoration: 'none',
                color: 'var(--sov-text)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800 }}>
                  #{idx + 1} {row.name}
                </div>
                <span style={{ fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: row.tierColor, fontSize: '14px' }}>
                  {row.score}/100
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(148,163,184,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${row.score}%`, height: '100%', background: row.tierColor }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--sov-muted)' }}>
                <span style={{ color: row.tierColor, fontWeight: 700 }}>{row.tier}</span>
                <span>{row.live.signalCount} sig • {row.live.regulationCount} law</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', textAlign: 'center', paddingTop: '4px', borderTop: '1px solid var(--sov-border)' }}>
                <div><div style={{ color: 'var(--sov-muted)' }}>STAT</div><div style={{ fontWeight: 700 }}>{row.pillars.statutory}</div></div>
                <div><div style={{ color: 'var(--sov-muted)' }}>EVAL</div><div style={{ fontWeight: 700 }}>{row.pillars.evaluation}</div></div>
                <div><div style={{ color: 'var(--sov-muted)' }}>TRTY</div><div style={{ fontWeight: 700 }}>{row.pillars.treaty}</div></div>
                <div><div style={{ color: 'var(--sov-muted)' }}>COMP</div><div style={{ fontWeight: 700 }}>{row.pillars.compute}</div></div>
                <div><div style={{ color: 'var(--sov-muted)' }}>TRNS</div><div style={{ fontWeight: 700 }}>{row.pillars.transparency}</div></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Epistemic Parity & Global South Representation Analytics */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sov-text)' }}>
            Epistemic Parity &amp; Global South Representation Lens
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--sov-muted)', marginTop: '4px', maxWidth: '880px' }}>
            Live empirical audit across {totalSignals} observatory signals and {totalClusters} Epoch AI compute clusters measuring geopolitical skew between rule-making hubs and Global South jurisdictions, primary vs. secondary source grading, and MIT AI Risk Repository harm distribution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Chart 1: Regional Parity */}
          <div className="editorial-card" style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--sov-accent)' }}>1. Global North vs. Global South Share (%)</div>
            <div style={{ height: '240px', width: '100%' }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={parityData.regionalParity} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={145} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--sov-bg)', border: '1px solid #334155', fontSize: '11px' }} />
                    <Bar dataKey="signalSharePct" name="Signal Share %" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="computeSharePct" name="Compute GW %" fill="#facc15" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sov-muted)', fontSize: '12px' }}>Loading chart…</div>
              )}
            </div>
          </div>

          {/* Chart 2: Admiralty Reliability */}
          <div className="editorial-card" style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--sov-emerald)' }}>2. NATO Admiralty Source Diversity</div>
            <div style={{ height: '240px', width: '100%' }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={parityData.admiraltyDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={86} paddingAngle={3}>
                      {parityData.admiraltyDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--sov-bg)', border: '1px solid #334155', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sov-muted)', fontSize: '12px' }}>Loading chart…</div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10.5px' }}>
              {parityData.admiraltyDistribution.map((a) => (
                <span key={a.name} style={{ color: a.color, fontFamily: 'var(--font-jetbrains-fallback)' }}>
                  ● {a.name.split('—')[0].trim()}: {a.count}
                </span>
              ))}
            </div>
          </div>

          {/* Chart 3: MIT AI Risk Distribution */}
          <div className="editorial-card" style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--sov-purple)' }}>3. MIT AI Risk Taxonomy (D1–D7)</div>
            <div style={{ height: '240px', width: '100%' }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={parityData.mitRiskDistribution} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={145} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--sov-bg)', border: '1px solid #334155', fontSize: '11px' }} />
                    <Bar dataKey="count" name="Signals" radius={[0, 4, 4, 0]}>
                      {parityData.mitRiskDistribution.map((entry) => (
                        <Cell key={entry.code} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sov-muted)', fontSize: '12px' }}>Loading chart…</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
