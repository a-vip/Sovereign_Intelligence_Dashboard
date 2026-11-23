'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe, Scale, BarChart2, Shield, Cpu, BookOpen, MapPin, X } from 'lucide-react';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { FRONTIER_LABS } from '@/lib/frontierLabs';

const MODULES = [
  { id: 'mod-atlas', title: 'Global AI Jurisdiction Atlas (24 Profiles)', subtitle: 'Statutory frameworks, treaties & domestic compute', href: '/jurisdictions', icon: 'globe' },
  { id: 'mod-compare', title: 'Cross-Jurisdictional AI Law Diff Matrix', subtitle: 'Side-by-side comparison: EU AI Act vs. SB 53 vs. Korea vs. China', href: '/compare', icon: 'scale' },
  { id: 'mod-index', title: 'SAGRI Readiness Index & Epistemic Parity', subtitle: 'Interactive 0–100 benchmark sliders & Global North/South analytics', href: '/readiness', icon: 'chart' },
  { id: 'mod-labs', title: 'Frontier Lab Watch & Safety Matrix', subtitle: 'Anthropic RSP, OpenAI Preparedness, DeepMind FSF, METR & AISI evals', href: '/labs', icon: 'shield' },
  { id: 'mod-compute', title: 'Frontier Compute & Models Observatory', subtitle: 'Epoch AI megaclusters (GW / H100e) vs. binding laws', href: '/compute', icon: 'cpu' },
  { id: 'mod-method', title: 'Methodology, Codebook & Verification Protocol', subtitle: '5-pillar scope, Admiralty matrix & zero-fabrication geocoding', href: '/methodology', icon: 'book' }
];

export default function CommandPaletteModal({ isOpen, onClose, signals = [], onFlyToLocation, onSelectSignal }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const q = query.trim().toLowerCase();

  const filteredModules = useMemo(() => {
    if (!q) return MODULES;
    return MODULES.filter((m) => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q));
  }, [q]);

  const filteredJurisdictions = useMemo(() => {
    if (!q) return JURISDICTIONS.slice(0, 6);
    return JURISDICTIONS.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.iso.toLowerCase().includes(q) ||
        j.capital.toLowerCase().includes(q) ||
        j.posture.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [q]);

  const filteredLabs = useMemo(() => {
    if (!q) return [];
    return FRONTIER_LABS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.safetyFramework.name.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [q]);

  const filteredSignals = useMemo(() => {
    if (!q) return (signals || []).slice(0, 5);
    return (signals || [])
      .filter(
        (s) =>
          String(s.title || s.name || '').toLowerCase().includes(q) ||
          String(s.location || '').toLowerCase().includes(q) ||
          String(s.source || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [q, signals]);

  if (!isOpen) return null;

  const renderIcon = (kind) => {
    if (kind === 'scale') return <Scale size={14} style={{ color: '#00f0ff' }} />;
    if (kind === 'chart') return <BarChart2 size={14} style={{ color: '#10b981' }} />;
    if (kind === 'shield') return <Shield size={14} style={{ color: '#38bdf8' }} />;
    if (kind === 'cpu') return <Cpu size={14} style={{ color: '#facc15' }} />;
    if (kind === 'book') return <BookOpen size={14} style={{ color: '#94a3b8' }} />;
    return <Globe size={14} style={{ color: '#c084fc' }} />;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 10080,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '72px 16px 24px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '660px',
          maxHeight: '78vh',
          background: 'rgba(10, 16, 32, 0.98)',
          border: '1px solid rgba(0, 240, 255, 0.4)',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.9), 0 0 32px rgba(0, 240, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <Search size={16} style={{ color: '#00f0ff' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to country, AI law, frontier lab, compute hub, or live signal…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'var(--font-inter-fallback)'
            }}
          />
          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', border: '1px solid rgba(148,163,184,0.25)', padding: '2px 6px', borderRadius: '4px' }}>
            ESC
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredModules.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', padding: '0 6px', fontWeight: 700 }}>
                OBSERVATORY MODULES
              </div>
              {filteredModules.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(m.href);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    textAlign: 'left',
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    padding: '9px 10px',
                    cursor: 'pointer',
                    color: '#f8fafc'
                  }}
                >
                  {renderIcon(m.icon)}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{m.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.subtitle}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: '#00f0ff', fontFamily: 'var(--font-jetbrains-fallback)' }}>OPEN →</span>
                </button>
              ))}
            </div>
          )}

          {filteredJurisdictions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', padding: '0 6px', fontWeight: 700 }}>
                JURISDICTION DOSSIERS
              </div>
              {filteredJurisdictions.map((j) => (
                <div
                  key={j.slug}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    padding: '8px 10px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/jurisdiction/${j.slug}`);
                    }}
                    style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 700 }}>
                      {j.name} <span style={{ color: '#64748b', fontSize: '10.5px' }}>({j.iso})</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: j.postureColor }}>{j.posture}</div>
                  </button>
                  {onFlyToLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onFlyToLocation(j.lat, j.lon, j.name);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 240, 255, 0.35)',
                        background: 'rgba(0, 240, 255, 0.1)',
                        color: '#00f0ff',
                        fontSize: '10px',
                        fontFamily: 'var(--font-jetbrains-fallback)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      FLY GLOBE
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {filteredLabs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', padding: '0 6px', fontWeight: 700 }}>
                FRONTIER AI LABS
              </div>
              {filteredLabs.map((l) => (
                <button
                  key={l.slug}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push('/labs');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'left',
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    color: '#f8fafc'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{l.name}</div>
                    <div style={{ fontSize: '10.5px', color: '#38bdf8' }}>{l.safetyFramework.name}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: '#34d399', fontFamily: 'var(--font-jetbrains-fallback)' }}>LAB WATCH →</span>
                </button>
              ))}
            </div>
          )}

          {filteredSignals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', padding: '0 6px', fontWeight: 700 }}>
                LIVE GLOBE SIGNALS
              </div>
              {filteredSignals.map((sig, idx) => (
                <button
                  key={sig.id || idx}
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSelectSignal) onSelectSignal(sig);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    textAlign: 'left',
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    color: '#f8fafc'
                  }}
                >
                  <MapPin size={13} style={{ color: '#facc15', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sig.title || sig.name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      {sig.location || 'Global'} • {sig.source || 'OSINT'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
