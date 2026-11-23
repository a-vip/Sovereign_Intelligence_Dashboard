'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Copy, Check, Scale } from 'lucide-react';
import EditorialThemeToggle from './EditorialThemeToggle';
import { DIFF_DIMENSIONS, REGULATORY_DIFF_PROFILES } from '@/lib/governanceIndex';

const PRESETS = [
  { id: 'big4', label: 'Frontier Safety Big 4', slugs: ['eu', 'us-ca', 'kr', 'gb'] },
  { id: 'superpowers', label: 'US Fed vs. EU vs. China vs. UK', slugs: ['us', 'eu', 'cn', 'gb'] },
  { id: 'indopac', label: 'Indo-Pacific & Global South', slugs: ['kr', 'sg', 'cn', 'br'] }
];

export default function RegulatoryCompareClient() {
  const [selectedSlugs, setSelectedSlugs] = useState(['eu', 'us-ca', 'kr', 'gb']);
  const [copiedMd, setCopiedMd] = useState(false);

  const selectedProfiles = useMemo(
    () => selectedSlugs.map((s) => REGULATORY_DIFF_PROFILES.find((p) => p.slug === s)).filter(Boolean),
    [selectedSlugs]
  );

  const toggleJurisdiction = (slug) => {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.length <= 2 ? prev : prev.filter((s) => s !== slug);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), slug];
      }
      return [...prev, slug];
    });
  };

  const handleCopyMarkdown = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    const header = `| Legal Dimension | ${selectedProfiles.map((p) => `${p.name} (${p.iso})`).join(' | ')} |`;
    const divider = `| :--- | ${selectedProfiles.map(() => ':---').join(' | ')} |`;
    const rows = DIFF_DIMENSIONS.map(
      (dim) => `| **${dim.label}** | ${selectedProfiles.map((p) => String(p[dim.key] || '').replace(/\|/g, '/')).join(' | ')} |`
    );
    navigator.clipboard.writeText([header, divider, ...rows].join('\n'));
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Controls Bar */}
      <div
        className="no-print editorial-card"
        style={{
          background: 'var(--sov-panel-bg)',
          border: '1px solid var(--sov-border)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>
              PRESETS:
            </span>
            {PRESETS.map((pr) => (
              <button
                key={pr.id}
                type="button"
                className="editorial-btn"
                onClick={() => setSelectedSlugs(pr.slugs)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '5px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  color: 'var(--sov-sky)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {pr.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="editorial-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 11px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                background: copiedMd ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)',
                color: 'var(--sov-emerald)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-fallback)',
                cursor: 'pointer'
              }}
            >
              {copiedMd ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedMd ? 'MARKDOWN COPIED' : 'COPY MARKDOWN TABLE'}</span>
            </button>
            <EditorialThemeToggle />
          </div>
        </div>

        {/* Jurisdiction Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>
            SELECT 2–4 JURISDICTIONS ({selectedSlugs.length}/4):
          </span>
          {REGULATORY_DIFF_PROFILES.map((j) => {
            const active = selectedSlugs.includes(j.slug);
            return (
              <button
                key={j.slug}
                type="button"
                onClick={() => toggleJurisdiction(j.slug)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: active ? `1px solid ${j.postureColor}` : '1px solid rgba(148, 163, 184, 0.25)',
                  background: active ? `${j.postureColor}1f` : 'rgba(15, 23, 42, 0.55)',
                  color: active ? j.postureColor : '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {active ? '✓ ' : ''}
                {j.name} ({j.iso})
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div
        className="editorial-card"
        style={{
          overflowX: 'auto',
          background: 'var(--sov-panel-bg)',
          border: '1px solid var(--sov-border)',
          borderRadius: '10px'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(56, 189, 248, 0.25)' }}>
              <th style={{ padding: '14px 16px', width: '210px', minWidth: '180px', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', color: 'var(--sov-muted)', textTransform: 'uppercase' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={13} style={{ color: 'var(--sov-accent)' }} />
                  <span>Legal Dimension</span>
                </div>
              </th>
              {selectedProfiles.map((p) => (
                <th key={p.slug} style={{ padding: '14px 16px', minWidth: '220px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Link href={`/jurisdiction/${p.slug}`} style={{ fontSize: '15px', fontWeight: 800, color: 'var(--sov-text)', textDecoration: 'none' }}>
                      {p.name} ({p.iso}) ↗
                    </Link>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 'fit-content',
                        fontSize: '10px',
                        fontFamily: 'var(--font-jetbrains-fallback)',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        color: p.postureColor,
                        background: `${p.postureColor}1a`,
                        border: `1px solid ${p.postureColor}44`
                      }}
                    >
                      {p.postureTag}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIFF_DIMENSIONS.map((dim) => (
              <tr key={dim.key} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--sov-sky)', verticalAlign: 'top' }}>
                  {dim.label}
                </td>
                {selectedProfiles.map((p) => (
                  <td key={p.slug} style={{ padding: '13px 16px', color: 'var(--sov-text)', lineHeight: 1.55, verticalAlign: 'top' }}>
                    {p[dim.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
