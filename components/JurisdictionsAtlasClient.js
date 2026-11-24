'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, Globe2, Scale, Zap } from 'lucide-react';

const GLOBAL_NORTH_NAMES = new Set([
  'United States',
  'California (USA)',
  'European Union',
  'United Kingdom',
  'Canada',
  'Japan',
  'South Korea',
  'Australia',
  'New Zealand',
  'Singapore',
  'Taiwan',
  'Switzerland',
  'Norway',
  'Germany',
  'France',
  'Netherlands',
  'Italy',
  'Spain',
  'Israel',
  'United Nations / Multilateral'
]);

const REGION_FILTERS = [
  'All',
  'Global South / Majority',
  'MENA & Africa',
  'Indo-Pacific',
  'Americas',
  'Europe',
  'Multilateral'
];

export default function JurisdictionsAtlasClient({ jurisdictions = [] }) {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [postureFilter, setPostureFilter] = useState('All');

  const isGlobalMajority = (j) => !GLOBAL_NORTH_NAMES.has(j.name) && j.region !== 'Multilateral';

  const stats = useMemo(() => {
    const bindingCount = jurisdictions.filter((j) => /binding|statute|enacted/i.test(j.posture || '')).length;
    const majorityCount = jurisdictions.filter(isGlobalMajority).length;
    const totalSignals = jurisdictions.reduce((acc, j) => acc + (j.signalCount || 0), 0);
    const totalLaws = jurisdictions.reduce((acc, j) => acc + (j.regCount || 0), 0);
    return {
      total: jurisdictions.length,
      bindingCount,
      majorityPct: jurisdictions.length ? Math.round((majorityCount / jurisdictions.length) * 100) : 0,
      majorityCount,
      totalSignals,
      totalLaws
    };
  }, [jurisdictions]);

  const postures = useMemo(() => {
    const unique = [...new Set(jurisdictions.map((j) => j.posture).filter(Boolean))];
    return ['All', ...unique];
  }, [jurisdictions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jurisdictions.filter((j) => {
      if (regionFilter === 'Global South / Majority') {
        if (!isGlobalMajority(j)) return false;
      } else if (regionFilter !== 'All' && j.region !== regionFilter) {
        return false;
      }
      if (postureFilter !== 'All' && j.posture !== postureFilter) return false;
      if (q) {
        const hay = `${j.name} ${j.iso} ${j.region} ${j.posture} ${j.treatyStatus} ${j.regulator || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [jurisdictions, search, regionFilter, postureFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top 4 KPI Summary Strip */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '12px' }}>
        {[
          { label: 'Sovereign Authorities', value: stats.total, sub: 'Tracked in Global Atlas', color: 'var(--sov-accent)', icon: Globe2 },
          { label: 'Binding Statutes Active', value: stats.bindingCount, sub: 'Statutory & risk regimes', color: 'var(--sov-emerald)', icon: Scale },
          { label: 'Global Majority Share', value: `${stats.majorityCount} (${stats.majorityPct}%)`, sub: 'Africa, LATAM, Asia, MENA', color: 'var(--sov-purple)', icon: ShieldCheck },
          { label: 'Live Telemetry Links', value: `${stats.totalSignals} sig • ${stats.totalLaws} law`, sub: 'Verified corpus mappings', color: 'var(--sov-amber)', icon: Zap }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              style={{
                background: 'var(--sov-panel-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {kpi.label}
                </span>
                <Icon size={14} style={{ color: kpi.color }} />
              </div>
              <div style={{ fontSize: '21px', fontWeight: 800, color: kpi.color, fontFamily: 'var(--font-jetbrains-fallback)' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>{kpi.sub}</div>
            </div>
          );
        })}
      </section>

      {/* Search & Filter Controls */}
      <section
        style={{
          background: 'var(--sov-panel-bg)',
          border: '1px solid var(--sov-border)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sov-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter jurisdiction, ISO code, treaty, or statutory posture..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '7px',
                border: '1px solid var(--sov-border)',
                background: 'var(--sov-card-bg)',
                color: 'var(--sov-text)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={postureFilter}
            onChange={(e) => setPostureFilter(e.target.value)}
            aria-label="Filter by statutory posture"
            style={{
              padding: '8px 10px',
              borderRadius: '7px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-text)',
              fontSize: '12px',
              flex: '0 1 260px',
              maxWidth: '100%'
            }}
          >
            {postures.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All Governance Postures' : p}
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Region Pills */}
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
          {REGION_FILTERS.map((reg) => {
            const active = regionFilter === reg;
            return (
              <button
                key={reg}
                type="button"
                onClick={() => setRegionFilter(reg)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: active ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                  background: active ? 'var(--sov-card-bg)' : 'transparent',
                  color: active ? 'var(--sov-accent)' : 'var(--sov-text)',
                  fontSize: '11.5px',
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer'
                }}
              >
                {reg}
              </button>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)' }}>
            Showing {filtered.length} of {jurisdictions.length}
          </span>
        </div>
      </section>

      {/* Responsive Cards Grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: '28px', textAlign: 'center', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', color: 'var(--sov-muted)', fontSize: '13.5px' }}>
          No jurisdictions match the current filter. Clear search or switch region filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 285px), 1fr))', gap: '14px' }}>
          {filtered.map((j) => (
            <Link
              key={j.slug}
              href={`/jurisdiction/${j.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                background: 'var(--sov-panel-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '10px',
                padding: '16px',
                textDecoration: 'none',
                color: 'var(--sov-text)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '16.5px', fontWeight: 800, color: 'var(--sov-text)' }}>{j.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>{j.region}</div>
                  </div>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', border: '1px solid var(--sov-border)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                    {j.iso}
                  </span>
                </div>

                {/* SAGRI Score Pill + Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '6px', padding: '6px 9px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>SAGRI</span>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: j.sagriColor || 'var(--sov-emerald)' }}>
                    {j.sagriScore ?? 0}/100
                  </span>
                  <div style={{ flex: 1, height: '5px', background: 'rgba(148,163,184,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${j.sagriScore ?? 0}%`, height: '100%', background: j.sagriColor || '#10b981' }} />
                  </div>
                </div>

                <div style={{ display: 'inline-flex', width: 'fit-content', fontSize: '10.5px', fontWeight: 700, fontFamily: 'var(--font-jetbrains-fallback)', color: j.postureColor, background: `${j.postureColor}18`, border: `1px solid ${j.postureColor}44`, padding: '3px 8px', borderRadius: '4px' }}>
                  {j.posture}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--sov-muted)', lineHeight: 1.5, margin: 0 }}>{j.treatyStatus}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--sov-border)', paddingTop: '10px', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                <span style={{ color: 'var(--sov-sky)' }}>
                  {j.signalCount} SIG • {j.regCount} LAW{j.powerMw ? ` • ${Math.round(j.powerMw)}MW` : ''}
                </span>
                <span style={{ color: 'var(--sov-accent)', fontWeight: 700 }}>OPEN DOSSIER →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
