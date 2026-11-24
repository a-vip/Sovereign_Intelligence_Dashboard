'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { X, Scale, MapPin, ExternalLink, GripHorizontal, Clock } from 'lucide-react';

const STATUTORY_CLIFFS = [
  {
    id: 'eu-art5',
    jurisdiction: 'European Union',
    slug: 'eu',
    title: 'EU AI Act: Prohibited AI Practices & AI Literacy',
    date: '2025-02-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'EUR-Lex Reg. (EU) 2024/1689 Art. 5',
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    note: 'Subliminal/biometric categorization & social scoring bans.'
  },
  {
    id: 'eu-gpai',
    jurisdiction: 'European Union',
    slug: 'eu',
    title: 'EU AI Act: GPAI & Systemic-Risk Model Duties',
    date: '2025-08-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'European AI Office (Chapter V)',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
    note: 'Mandatory systemic evaluations & copyright summaries (>10^25 FLOP).'
  },
  {
    id: 'cn-synth',
    jurisdiction: 'China',
    slug: 'cn',
    title: 'CAC Mandatory AI Synthetic Content Labeling Measures',
    date: '2025-09-01',
    lat: 39.9042,
    lon: 116.4074,
    authority: 'Cyberspace Administration of China',
    url: 'https://www.cac.gov.cn/',
    note: 'Explicit + implicit cryptographic metadata watermarking nationwide.'
  },
  {
    id: 'kr-basic',
    jurisdiction: 'South Korea',
    slug: 'kr',
    title: 'South Korea Basic AI Act Takes Binding Effect',
    date: '2026-01-22',
    lat: 37.5665,
    lon: 126.9780,
    authority: 'MSIT South Korea',
    url: 'https://www.msit.go.kr/eng/',
    note: 'High-impact AI transparency, risk management & safety duties.'
  },
  {
    id: 'coe-treaty',
    jurisdiction: 'Council of Europe (Treaty)',
    slug: 'eu',
    title: 'Council of Europe AI Convention (CETS No. 225) Ratifications',
    date: '2026-05-15',
    lat: 48.5734,
    lon: 7.7521,
    authority: 'Council of Europe Strasbourg',
    url: 'https://www.coe.int/en/web/artificial-intelligence',
    note: 'First binding international human-rights treaty for AI systems.'
  },
  {
    id: 'co-sb205',
    jurisdiction: 'Colorado (USA)',
    slug: 'us',
    title: 'Colorado AI Act (SB 24-205) High-Risk Discrimination Rules',
    date: '2026-06-30',
    lat: 39.7392,
    lon: -104.9903,
    authority: 'Colorado Attorney General',
    url: 'https://leg.colorado.gov/bills/sb24-205',
    note: 'Duty of reasonable care against algorithmic employment/housing bias.'
  },
  {
    id: 'eu-art50',
    jurisdiction: 'European Union',
    slug: 'eu',
    title: 'EU AI Act: Art. 50 Transparency & Sandbox Deadlines',
    date: '2026-08-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'European AI Office',
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    note: 'Deepfake disclosure, chatbot notice, and national regulatory sandboxes.'
  },
  {
    id: 'ca-sb53',
    jurisdiction: 'California (USA)',
    slug: 'us-ca',
    title: 'California SB 53 Frontier Safety & Whistleblower Enforcement',
    date: '2026-01-01',
    lat: 38.5816,
    lon: -121.4944,
    authority: 'California Attorney General / CalOES',
    url: 'https://leginfo.legislature.ca.gov/',
    note: 'Mandatory safety framework publication & catastrophic incident reporting.'
  },
  {
    id: 'ca-sb942',
    jurisdiction: 'California (USA)',
    slug: 'us-ca',
    title: 'California AI Transparency Act (SB 942) Provenance Detection',
    date: '2026-08-02',
    lat: 38.5816,
    lon: -121.4944,
    authority: 'California Attorney General',
    url: 'https://leginfo.legislature.ca.gov/',
    note: 'Free public AI provenance detectors & latent watermarking for >1M MAU.'
  },
  {
    id: 'eu-omnibus-hr',
    jurisdiction: 'European Union',
    slug: 'eu',
    title: 'Digital Omnibus: Standalone High-Risk AI Deadline (Annex III)',
    date: '2027-12-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'Reg. (EU) 2026/1744 / European AI Office',
    url: 'https://eur-lex.europa.eu/',
    note: 'Full conformity assessments for employment, credit, asylum & policing AI.'
  },
  {
    id: 'eu-omnibus-emb',
    jurisdiction: 'European Union',
    slug: 'eu',
    title: 'Digital Omnibus: Embedded Product High-Risk AI (Annex I)',
    date: '2028-08-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'European Commission / EASA / Medical',
    url: 'https://eur-lex.europa.eu/',
    note: 'Safety-critical medical, aviation, machinery & autonomous vehicle AI.'
  }
];

function computeDayDelta(dateStr) {
  const target = new Date(`${dateStr}T00:00:00Z`).getTime();
  if (isNaN(target)) return { days: 0, inForce: true, label: 'ACTIVE' };
  const diffDays = Math.ceil((target - Date.now()) / 86400000);
  if (diffDays <= 0) return { days: diffDays, inForce: true, label: 'IN FORCE' };
  return { days: diffDays, inForce: false, label: `T-${diffDays}d` };
}

export default function LegislativeCountdownWidget({ onClose, onFocusLocation }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'in_force'
  const [recentRegs, setRecentRegs] = useState([]);
  const [pos, setPos] = useState({ x: 350, y: 84 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 900;
      setPos({
        x: mobile ? 10 : Math.max(24, Math.min(window.innerWidth - 410, 340)),
        y: mobile ? 66 : 84
      });
    }
    fetch('/api/ai-regulations')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.aiRegulations)) {
          setRecentRegs(d.aiRegulations.slice(0, 8));
        }
      })
      .catch(() => {});
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target?.closest?.('button, a')) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPos({
        x: Math.max(8, Math.min(vw - 140, dragRef.current.startPosX + (e.clientX - dragRef.current.startX))),
        y: Math.max(52, Math.min(vh - 90, dragRef.current.startPosY + (e.clientY - dragRef.current.startY)))
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  const enrichedCliffs = useMemo(() => {
    return STATUTORY_CLIFFS.map((item) => ({ ...item, delta: computeDayDelta(item.date) }))
      .filter((item) => {
        if (filter === 'upcoming') return !item.delta.inForce;
        if (filter === 'in_force') return item.delta.inForce;
        return true;
      })
      .sort((a, b) => {
        if (a.delta.inForce !== b.delta.inForce) return a.delta.inForce ? 1 : -1;
        return new Date(a.date) - new Date(b.date);
      });
  }, [filter]);

  const upcomingCount = useMemo(() => STATUTORY_CLIFFS.filter((x) => !computeDayDelta(x.date).inForce).length, []);
  const inForceCount = STATUTORY_CLIFFS.length - upcomingCount;

  return (
    <aside
      className="sov-modal-shell"
      aria-label="Legislative & Enforcement Countdown Tracker"
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: 'min(94vw, 390px)',
        maxHeight: 'calc(100dvh - 140px)',
        zIndex: 1450,
        background: 'var(--sov-panel-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '12px',
        boxShadow: 'var(--sov-shadow, 0 20px 44px rgba(0, 0, 0, 0.45))',
        backdropFilter: 'blur(16px)',
        color: 'var(--sov-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 13px',
          background: 'var(--sov-card-bg)',
          borderBottom: '1px solid var(--sov-border)',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <GripHorizontal size={13} style={{ color: 'var(--sov-muted)' }} />
          <Scale size={14} style={{ color: 'var(--sov-purple)' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', letterSpacing: '0.05em' }}>
            ENFORCEMENT TRACKER
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Legislative Tracker"
          style={{ background: 'transparent', border: '1px solid var(--sov-border)', borderRadius: '5px', color: 'var(--sov-muted)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--sov-border)', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'all', label: `All (${STATUTORY_CLIFFS.length})` },
            { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
            { id: 'in_force', label: `In Force (${inForceCount})` }
          ].map((tab) => {
            const on = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${on ? 'var(--sov-purple)' : 'var(--sov-border)'}`,
                  background: on ? 'rgba(168, 85, 247, 0.14)' : 'var(--sov-card-bg)',
                  color: on ? 'var(--sov-purple)' : 'var(--sov-muted)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <Link href="/compare" style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-accent)', textDecoration: 'none' }}>
          Compare Matrix ↗
        </Link>
      </div>

      {/* Countdown Cards */}
      <div style={{ padding: '10px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {enrichedCliffs.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              borderLeft: `3px solid ${item.delta.inForce ? 'var(--sov-emerald)' : 'var(--sov-amber)'}`,
              borderRadius: '7px',
              padding: '9px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>
                {item.jurisdiction} · {item.date}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: item.delta.inForce ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: item.delta.inForce ? 'var(--sov-emerald)' : 'var(--sov-amber)'
                }}
              >
                <Clock size={9} />
                {item.delta.label}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sov-text)', lineHeight: 1.35 }}>
              {item.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--sov-muted)', lineHeight: 1.4 }}>
              {item.note}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {onFocusLocation && (
                  <button
                    type="button"
                    onClick={() => onFocusLocation(item.lat, item.lon)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-accent)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <MapPin size={10} /> Locate
                  </button>
                )}
                <Link
                  href={`/jurisdiction/${item.slug}`}
                  style={{ padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)', fontSize: '10px', fontWeight: 600, textDecoration: 'none' }}
                >
                  Atlas ↗
                </Link>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, color: 'var(--sov-purple)', textDecoration: 'none' }}
              >
                Statute <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ))}

        {recentRegs.length > 0 && (
          <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--sov-border)' }}>
            <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: 'var(--sov-muted)', marginBottom: '6px' }}>
              LATEST TRACKED BILLS (/API/AI-REGULATIONS)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {recentRegs.slice(0, 4).map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '5px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', color: 'var(--sov-text)', fontSize: '11px', textDecoration: 'none' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>{r.jurisdiction}:</strong> {r.title}
                  </span>
                  <ExternalLink size={10} style={{ color: 'var(--sov-purple)', flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
