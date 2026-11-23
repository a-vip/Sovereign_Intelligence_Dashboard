'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Shield, Copy, Check, ExternalLink, Archive, BookOpen, Globe } from 'lucide-react';
import {
  computeAdmiraltyGrade,
  computeContentHash,
  generateCitations,
  getWaybackUrls,
  normalizeSignalId
} from '@/lib/provenance';
import { resolveJurisdictionForLocation } from '@/lib/jurisdictions';
import { classifyMitRiskDomain } from '@/lib/mitRiskTaxonomy';

export default function CitationProvenanceCard({ event, isStandalone = false }) {
  const [citeFormat, setCiteFormat] = useState('oscola');
  const [copiedType, setCopiedType] = useState(null);

  const cleanId = useMemo(() => normalizeSignalId(event?.id), [event?.id]);
  const admiralty = useMemo(() => computeAdmiraltyGrade(event || {}), [event]);
  const contentHash = useMemo(() => computeContentHash(event || {}), [event]);
  const citations = useMemo(() => generateCitations(event || {}), [event]);
  const wayback = useMemo(() => getWaybackUrls(event?.url), [event?.url]);
  const mitRisk = useMemo(
    () =>
      event?.details?.mitRisk ||
      event?.mitRisk ||
      classifyMitRiskDomain(event?.title || event?.name || '', event?.details?.summary || event?.summary || '', event?.details?.domainPillar || ''),
    [event]
  );
  const matchedJurisdiction = useMemo(
    () => resolveJurisdictionForLocation(event?.location || event?.title || ''),
    [event?.location, event?.title]
  );

  if (!event) return null;

  const handleCopy = (value, type) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard || !value) return;
    navigator.clipboard.writeText(value);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  const activeCitation = citations[citeFormat] || citations.oscola;

  return (
    <div
      style={{
        background: 'var(--sov-card-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '8px',
        padding: isStandalone ? '18px' : '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'var(--font-inter-fallback)',
        color: 'var(--sov-text)'
      }}
    >
      {/* Top Row: NATO Admiralty Grade + Cryptographic Fingerprint */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          borderBottom: '1px solid var(--sov-border)',
          paddingBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            title={admiralty.rationale}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: `${admiralty.badgeColor}18`,
              border: `1px solid ${admiralty.badgeColor}55`,
              color: admiralty.badgeColor,
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}
          >
            <Shield size={11} />
            ADMIRALTY {admiralty.grade}
          </span>
          <span
            title={`MIT AI Risk Repository Domain: ${mitRisk.label} (${mitRisk.causalIntent} • ${mitRisk.timing})`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: `${mitRisk.color}18`,
              border: `1px solid ${mitRisk.color}55`,
              color: mitRisk.color,
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontSize: '10.5px',
              fontWeight: 700
            }}
          >
            MIT {mitRisk.code}: {mitRisk.shortLabel}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>
            {admiralty.sourceLabel} • {admiralty.infoLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleCopy(contentHash, 'hash')}
          title={`Click to copy full SHA-256 fingerprint: ${contentHash}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'var(--sov-panel-bg)',
            border: '1px solid var(--sov-border)',
            borderRadius: '4px',
            padding: '3px 8px',
            color: copiedType === 'hash' ? 'var(--sov-emerald)' : 'var(--sov-text)',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          {copiedType === 'hash' ? <Check size={10} /> : <Copy size={10} />}
          <span>SHA-256: {contentHash.slice(0, 14)}…</span>
        </button>
      </div>

      {/* Provenance Action Links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {!isStandalone && cleanId && (
          <Link
            href={`/signal/${encodeURIComponent(cleanId)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '4px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              color: '#00f0ff',
              fontSize: '10.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-jetbrains-fallback)',
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={11} />
            <span>FULL DOSSIER PAGE</span>
          </Link>
        )}

        {matchedJurisdiction && (
          <Link
            href={`/jurisdiction/${matchedJurisdiction.slug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '4px',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              color: '#c084fc',
              fontSize: '10.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-jetbrains-fallback)',
              textDecoration: 'none'
            }}
          >
            <Globe size={11} />
            <span>{matchedJurisdiction.name.toUpperCase()} ATLAS</span>
          </Link>
        )}

        {(event.archive_url || wayback) && (
          <a
            href={event.archive_url || wayback.lookupUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontSize: '10.5px',
              fontWeight: 600,
              fontFamily: 'var(--font-jetbrains-fallback)',
              textDecoration: 'none'
            }}
          >
            <Archive size={11} />
            <span>WAYBACK SNAPSHOT</span>
          </a>
        )}

        {wayback && !event.archive_url && (
          <a
            href={wayback.saveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '10px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              textDecoration: 'none'
            }}
            title="Submit primary source URL to Internet Archive Wayback Machine"
          >
            <span>+ ARCHIVE NOW</span>
          </a>
        )}
      </div>

      {/* Academic Citation Generator (OSCOLA / APA / BibTeX) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sov-text)', fontSize: '11px', fontWeight: 700 }}>
            <BookOpen size={12} style={{ color: 'var(--sov-accent)' }} />
            <span>SCHOLARLY CITATION GENERATOR</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'oscola', label: 'OSCOLA' },
              { id: 'apa', label: 'APA 7th' },
              { id: 'bibtex', label: 'BibTeX' }
            ].map((tab) => {
              const active = citeFormat === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCiteFormat(tab.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: active ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                    background: active ? 'var(--sov-accent-soft)' : 'var(--sov-panel-bg)',
                    color: active ? 'var(--sov-accent)' : 'var(--sov-muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-jetbrains-fallback)',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <pre
          style={{
            margin: 0,
            padding: '10px',
            borderRadius: '6px',
            background: 'var(--sov-bg)',
            border: '1px solid var(--sov-border)',
            color: 'var(--sov-text)',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontSize: '10.5px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {activeCitation}
        </pre>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => handleCopy(activeCitation, 'citation')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '4px',
              border: '1px solid var(--sov-accent)',
              background: copiedType === 'citation' ? 'rgba(16, 185, 129, 0.16)' : 'var(--sov-accent-soft)',
              color: copiedType === 'citation' ? 'var(--sov-emerald)' : 'var(--sov-accent)',
              fontSize: '10.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-jetbrains-fallback)',
              cursor: 'pointer'
            }}
          >
            {copiedType === 'citation' ? <Check size={11} /> : <Copy size={11} />}
            <span>{copiedType === 'citation' ? 'CITATION COPIED' : `COPY ${citeFormat.toUpperCase()} CITATION`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
