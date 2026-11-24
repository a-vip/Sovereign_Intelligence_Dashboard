'use client';
import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronRight, Terminal } from 'lucide-react';

const CHANGELOG_DATA = [
  {
    version: 'v2.6.0',
    date: '2026-11-24',
    title: 'Data-Rich Ethics Overlays, Facility & Statute Inspectors',
    isMajor: true,
    bullets: [
      'Expanded Internet Censorship layer to 180+ country coordinates fusing OONI Web Connectivity, OONI Signal/Telegram/WhatsApp/Tor probes, and live Georgia Tech IODA outage alerts.',
      'Expanded AI Supply Chain to 65 nodes and 50 directed corridors across 7 stages (Critical Minerals, Refining, EUV Tooling, Logic/HBM Fabs, CoWoS Packaging, Server Racks, E-Waste).',
      'Enriched Environmental Justice with 32 global hotspots plus live Epoch AI cluster carbon (Ember 2025) and water stress (WRI Aqueduct) projections; expanded Biometrics & Welfare (44 cases) and AI Labor/RLHF (34 hubs).',
      'Upgraded Data Center clicks with PeeringDB + Nominatim address, owner, ASN/IX counts, purpose, and workload profile; fixed AI Regulation cards with working legislation links.',
      'Restored mission-colored satellite icon markers with sleek theme-native name pills, refined Support popup, and modernized theme-aware Changelog.'
    ]
  },
  {
    version: 'v2.5.0',
    date: '2026-11-24',
    title: 'Temporal Replay Lens (2020–2026), Theme CMS & Orbital Inspector',
    isMajor: true,
    bullets: [
      'Added interactive 2020–2026 Longitudinal Temporal Replay Scrubber & Before/After Compute–Regulation Gap Lens across 49+ cited statutes, safety institutes, and GW clusters.',
      'Rebuilt Admin CMS in theme-native tokens with live search, anomaly bulk actions, Nominatim autocomplete, and feedback coordinate resolution.',
      'Upgraded Orbital Telemetry API (42 spacecraft + live CelesTrak GP station feeds) and draggable Orbital Intelligence Inspector.',
      'Code-split heavy modals, deferred idle evaluations, and hardened cross-device Cesium WebGL settings and error recovery.'
    ]
  },
  {
    version: 'v2.4.0',
    date: '2026-11-23',
    title: 'Blind-Spot Regional Feeds, Weather & Verified Refineries',
    isMajor: true,
    bullets: [
      'Expanded multi-city geocoding and 18 new verified Global South, APAC, Africa, West Asia, and Latin America intelligence feeds (55 built-in feeds).',
      'Applied 2.45° cosine-corrected spherical node dispersion for clearer default-zoom node separation.',
      'Added real global precipitation/storm layers (NASA GIBS IMERG, RainViewer Doppler, NASA EONET) and 85+ verified refineries + 20+ LNG terminals.'
    ]
  },
  {
    version: 'v2.3.0',
    date: '2026-11-22',
    title: '38-Jurisdiction Global Majority Monitors & Theme Consistency',
    isMajor: true,
    bullets: [
      'Expanded Flagship AI Governance Atlas & SAGRI Readiness Index from 24 to 38 jurisdictions and added 12 statutory diff profiles.',
      'Unified Obsidian, Cambridge, Emerald, and Editorial Light themes across all 12 observatory sub-pages and interactive windows.',
      'Implemented Postgres & guest profile signal bookmarks alongside verified conflict, agentic AI, and cybersecurity dossiers.'
    ]
  },
  {
    version: 'v2.2.0',
    date: '2026-11-08',
    title: 'Watchlists, Citation-Locked Copilot & GeoJSON API v1',
    isMajor: true,
    bullets: [
      'Launched public `/api/v1` GeoJSON & tabular-datapackage endpoints, Executive Brief generator, and citation-locked Governance Copilot.',
      'Added SSRF-guarded jurisdiction Watchlists & alert webhooks plus embeddable jurisdiction/readiness widgets.'
    ]
  },
  {
    version: 'v2.1.0',
    date: '2026-11-07',
    title: 'Regulatory Diff Matrix, SAGRI Index & Epistemic Parity',
    isMajor: false,
    bullets: [
      'Introduced multi-jurisdiction statutory comparison matrix (`/compare`), SAGRI Readiness & Epistemic Parity Index (`/readiness`), and Cmd/Ctrl+K command palette.'
    ]
  },
  {
    version: 'v2.0.0',
    date: '2026-11-06',
    title: 'Observatory Foundation, Provenance, Epoch Compute & Labs Watch',
    isMajor: true,
    bullets: [
      'Integrated SHA-256 provenance, NATO Admiralty grading, OSCOLA/APA/BibTeX citations, MIT AI Risk 7-Domain taxonomy, Epoch AI frontier clusters, and Frontier Lab Watch.',
      'Shipped non-destructive Postgres archival lifecycle, methodology/whitepaper routes, and 200-item classifier evaluation benchmark.'
    ]
  },
  {
    version: 'v1.12.0',
    date: '2026-10-28',
    title: 'Precision Classifier, Custom Source Ingestion & Security Hardening',
    isMajor: false,
    bullets: [
      'Enforced 5-pillar AI/Cyber policy classification, 115+ land-verified geocoder hubs, custom RSS/Atom source ingestion, and HMAC-SHA256 session lockdown.'
    ]
  },
  {
    version: 'v1.11.0',
    date: '2026-08-24',
    title: 'Pipeline Restoration & Staleness Self-Healing',
    isMajor: false,
    bullets: [
      'Restored GDELT, RSS, and AI Regulations pipelines, added 6h ingestion cadence, staleness auto-refresh, and Cesium render-loop graceful recovery.'
    ]
  },
  {
    version: 'v1.10.0',
    date: '2026-06-13',
    title: 'Guided Onboarding & Core Globe Infrastructure',
    isMajor: false,
    bullets: [
      'Released interactive onboarding tour, global subsea cable & oil/gas vectors, Admin CMS, diagnostics anomalies hub, and offline/Vercel Neon persistence.'
    ]
  }
];

export default function ChangelogBox({ onClose }) {
  const [expandedVersions, setExpandedVersions] = useState({ 'v2.6.0': true });
  const [pos, setPos] = useState({ x: 100, y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 900;
      if (mobile) {
        setPos({ x: Math.max(10, (window.innerWidth - 320) / 2), y: 60 });
      } else {
        setPos({
          x: Math.max(20, window.innerWidth - 470),
          y: Math.max(20, (window.innerHeight - 530) / 2)
        });
      }
    }
  }, []);

  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setDragging(true);
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPosX: pos.x, startPosY: pos.y };
  };

  useEffect(() => {
    const handleDrag = (e) => {
      if (!dragging) return;
      const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY || 0;
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 120, dragRef.current.startPosX + (clientX - dragRef.current.startX))),
        y: Math.max(52, Math.min(window.innerHeight - 80, dragRef.current.startPosY + (clientY - dragRef.current.startY)))
      });
    };
    const handleDragEnd = () => setDragging(false);

    if (dragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [dragging]);

  const toggleVersion = (version) => {
    setExpandedVersions((prev) => ({ ...prev, [version]: !prev[version] }));
  };

  return (
    <div
      className="sov-modal-shell"
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: '430px',
        maxWidth: 'calc(100vw - 20px)',
        height: '520px',
        maxHeight: 'calc(100vh - 100px)',
        background: 'var(--sov-panel-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '12px',
        boxShadow: 'var(--sov-shadow, 0 20px 50px rgba(0, 0, 0, 0.45))',
        zIndex: 1005,
        fontFamily: 'var(--font-inter-fallback), system-ui, sans-serif',
        color: 'var(--sov-text)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 15px',
          borderBottom: '1px solid var(--sov-border)',
          cursor: dragging ? 'grabbing' : 'grab',
          background: 'var(--sov-card-bg)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} style={{ color: 'var(--sov-accent)' }} />
          <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--sov-text)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
            CHANGELOG
          </span>
          <span style={{ fontSize: '10px', color: 'var(--sov-accent)', fontWeight: 700, fontFamily: 'var(--font-jetbrains-fallback)' }}>
            v2.6.0
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close changelog"
          style={{
            background: 'transparent',
            border: '1px solid var(--sov-border)',
            color: 'var(--sov-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '6px'
          }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Release Accordions */}
      <div
        style={{
          padding: '10px 12px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
        className="changelog-scrollbar"
      >
        {CHANGELOG_DATA.map((item) => {
          const isExpanded = !!expandedVersions[item.version];
          return (
            <div
              key={item.version}
              style={{
                border: `1px solid ${isExpanded ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                borderRadius: '8px',
                background: 'var(--sov-card-bg)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <button
                type="button"
                onClick={() => toggleVersion(item.version)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 11px',
                  cursor: 'pointer',
                  background: isExpanded ? 'var(--sov-accent-soft)' : 'transparent',
                  border: 'none',
                  gap: '10px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-jetbrains-fallback)',
                      color: item.isMajor ? 'var(--sov-accent)' : 'var(--sov-sky)',
                      background: 'var(--sov-panel-bg)',
                      border: '1px solid var(--sov-border)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}
                  >
                    {item.version}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', flexShrink: 0 }}>
                    {item.date}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isExpanded ? 700 : 600,
                      color: 'var(--sov-text)',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: isExpanded ? 'normal' : 'nowrap'
                    }}
                  >
                    {item.title}
                  </span>
                </div>
                {isExpanded ? <ChevronDown size={14} style={{ color: 'var(--sov-accent)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--sov-muted)', flexShrink: 0 }} />}
              </button>

              {isExpanded && (
                <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--sov-border)' }}>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.bullets.map((bullet, bidx) => (
                      <li key={bidx} style={{ fontSize: '11.5px', color: 'var(--sov-text)', lineHeight: 1.5 }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--sov-border)',
          background: 'var(--sov-card-bg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '9.5px',
          fontFamily: 'var(--font-jetbrains-fallback)',
          color: 'var(--sov-muted)',
          userSelect: 'none'
        }}
      >
        <span>VERIFIED RELEASE HISTORY</span>
        <span style={{ color: 'var(--sov-accent)', fontWeight: 700 }}>SOVEREIGN OBSERVATORY v2.6.0</span>
      </div>
    </div>
  );
}
