'use client';
import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronRight, Terminal, Info } from 'lucide-react';

const CHANGELOG_DATA = [
  {
    version: 'v1.6.0',
    date: '2026-05-26',
    title: 'Operator Expansions & Chronological Feed Alignments',
    isMajor: true,
    bullets: [
      'Guest Feedback Integration: Suggestions & bug reporting panel is now fully accessible to anonymous guests with optional name/email attributes and an elegant account sign-up invite.',
      'Default Globe Auto-Rotation: Globe auto-rotation is now engaged by default on initial page load and refresh, providing an immediate dynamic tactical view.',
      'Secure Channel Live Status: Replaced transient connection messages with premium, cybernetic connection indicators (SECURE CHANNEL ACTIVE, CONNECTING...).',
      'Chronological Source Timestamps: Extracted and parsed original feed publication times from live OSINT sources to align timelines accurately to event creation rather than database ingestion times.'
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026-05-19',
    title: 'Camera Culling & Memory Ray-Casting Optimization',
    isMajor: true,
    bullets: [
      'Flat-mode Rendering & Camera Culling Fix: Resolved Cesium camera depth clipping bugs for geopolitical boundary overlays and event markers across different zoom profiles (disableDepthTestDistance = 1.0).',
      'Database Persistence Upgrade: Re-architected CMS pipeline for structured JSON event updates and deep-indexed GIS geometries.',
      'Border Ray-Casting & Performance Optimization: Implemented point-in-polygon boundary checks, saving up to 600MB+ WebGL memory overhead.'
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-05-12',
    title: 'AI Regulations Live-Sync & Golden Jitter Overlays',
    isMajor: false,
    bullets: [
      'AI Regulation Live-Sync: Synced active Google My Maps layers mapping 450+ international guidelines and AI legal policies with real-time updates.',
      'Stacked Tooltips: Added intelligent multi-overlapping tooltip resolution for dense marker groups.',
      'Golden-Angle Geojittering: Built layout adjustments for overlapping coordinates using mathematical golden-angle offsets.'
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026-05-05',
    title: 'Mailer Transitions & Session Guards',
    isMajor: false,
    bullets: [
      'SMTP Mailer Transition: Replaced external feedback pipelines with high-resiliency local SMTP relays, securing automated alerts.',
      'Operator Authentication Enhancements: Reinforced session validation guards across administrative telemetry.'
    ]
  },
  {
    version: 'v1.2.0',
    date: '2026-04-28',
    title: 'ATLAS Grid, GPS Hex Interference & RainViewer Radar',
    isMajor: true,
    bullets: [
      'ATLAS Infrastructure Integration: Mapped regional database center rings and network nodes onto Cesium\'s physical layer.',
      'Active GPS Jamming Hexagons: Integrated live signal interference maps displaying active degraded hex bands.',
      'RainViewer Weather Radar: Wired real-time satellite precipitation/cloud-cover overlay maps.'
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-04-21',
    title: 'Admin CMS Panels & 3D Urban Metros',
    isMajor: false,
    bullets: [
      'Admin CMS Control Console: Built secure, fully featured CRUD panel for live signal mapping, geocoding overrides, and archive administration.',
      '3D Urban Buildings Layer: Added high-fidelity extruded urban 3D building outlines toggle for high-density metropolitan targets.'
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-04-07',
    title: 'Core Cybernetic Geospatial Platform Launch',
    isMajor: true,
    bullets: [
      'Core Cybernetic Architecture Release: Launched high-density Braille loading screens, cybernetic eye canvas animations, and global Cesium 3D geospatial dashboard.'
    ]
  }
];

export default function ChangelogBox({ onClose }) {
  // State storing which version codes are expanded (accordion/collapse)
  // By default, the latest version (v1.6.0) is expanded
  const [expandedVersions, setExpandedVersions] = useState({ 'v1.6.0': true });

  // Position state for dragging
  const [pos, setPos] = useState({ x: 100, y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Elegant sizing & adaptive layout on mobile mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 900;
      if (mobile) {
        const startX = Math.max(10, (window.innerWidth - 300) / 2);
        setPos({ x: startX, y: 80 });
      } else {
        // Place it elegantly towards the bottom right or center-right
        const startX = window.innerWidth - 420;
        const startY = window.innerHeight - 560;
        setPos({ x: Math.max(20, startX), y: Math.max(20, startY) });
      }
    }
  }, []);

  const handleDragStart = (e) => {
    if (e.button !== 0) return; // Left click only
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  };

  useEffect(() => {
    const handleDrag = (e) => {
      if (!dragging) return;
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      
      // Keep boundaries relatively sensible
      const newX = dragRef.current.startPosX + (clientX - dragRef.current.startX);
      const newY = dragRef.current.startPosY + (clientY - dragRef.current.startY);
      setPos({ x: newX, y: newY });
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
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }));
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: '360px',
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: '480px',
        background: 'rgba(8, 12, 24, 0.95)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.75), 0 0 25px rgba(6, 182, 212, 0.1)',
        zIndex: 1005,
        fontFamily: 'var(--font-jetbrains-fallback), monospace',
        color: '#e2e8f0',
        userSelect: 'none',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: dragging ? 'none' : 'transform 0.1s ease',
      }}
    >
      {/* Drag Handle & Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: dragging ? 'grabbing' : 'grab',
          background: 'rgba(6, 182, 212, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} style={{ color: '#06b6d4' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', color: '#ffffff' }}>
            SYSTEM CHANGELOG
          </span>
          <span style={{ fontSize: '9px', color: 'rgba(6, 182, 212, 0.7)', fontWeight: 'bold' }}>
            [OP_LOGS]
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Accordion Versions Body Container */}
      <div 
        style={{ 
          padding: '12px', 
          overflowY: 'auto', 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
        className="changelog-scrollbar"
      >
        {CHANGELOG_DATA.map((item) => {
          const isExpanded = !!expandedVersions[item.version];
          return (
            <div
              key={item.version}
              style={{
                border: isExpanded ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '6px',
                background: isExpanded ? 'rgba(6, 182, 212, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Version Banner Trigger */}
              <div
                onClick={() => toggleVersion(item.version)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: isExpanded ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => {
                  if (!isExpanded) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={e => {
                  if (!isExpanded) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: item.isMajor ? '#06b6d4' : '#38bdf8',
                      background: item.isMajor ? 'rgba(6, 182, 212, 0.15)' : 'rgba(56, 189, 248, 0.1)',
                      border: item.isMajor ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(56, 189, 248, 0.2)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {item.version}
                  </span>
                  <span style={{ fontSize: '10px', color: '#8892a4', fontFamily: 'monospace' }}>
                    {item.date}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.isMajor && (
                    <span style={{ fontSize: '8px', color: '#eab308', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
                      MAJOR
                    </span>
                  )}
                  {isExpanded ? <ChevronDown size={14} color="#8892a4" /> : <ChevronRight size={14} color="#8892a4" />}
                </div>
              </div>

              {/* Version Content */}
              {isExpanded && (
                <div 
                  style={{
                    padding: '10px 12px 12px 12px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(0, 0, 0, 0.15)',
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    💡 {item.title}
                  </div>
                  <ul 
                    style={{ 
                      margin: 0, 
                      paddingLeft: '14px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '6px' 
                    }}
                  >
                    {item.bullets.map((bullet, bidx) => (
                      <li 
                        key={bidx} 
                        style={{ 
                          fontSize: '9.5px', 
                          color: '#94a3b8', 
                          lineHeight: '1.4',
                          listStyleType: 'square'
                        }}
                      >
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

      {/* Footer Branding */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(2, 6, 23, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '8px',
          color: 'rgba(255, 255, 255, 0.3)',
          letterSpacing: '0.05em'
        }}
      >
        <span>SECURE TELEMETRY LINK</span>
        <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>SOVEREIGN OPERATOR NETWORK v1.6</span>
      </div>

      {/* Styled scrollbar injected directly */}
      <style jsx global>{`
        .changelog-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .changelog-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .changelog-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 2px;
        }
        .changelog-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}</style>
    </div>
  );
}
