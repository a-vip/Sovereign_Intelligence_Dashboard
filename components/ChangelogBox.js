'use client';
import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronRight, Terminal, Info } from 'lucide-react';

const CHANGELOG_DATA = [
  {
    version: 'v1.6.0',
    date: '2026-05-26',
    title: 'Operator Profile CTA & Chronological OSINT Alignments',
    isMajor: true,
    bullets: [
      'v1.6.0 - Guest Feedback Integration: Released a guest-accessible suggestions & bug reporting module inside the profile panel, prompting anonymous operators with secure sign-up CTAs to promote registration.',
      'v1.6.0 - Chronological Source Timestamps: Upgraded RSS & GDELT OSINT intelligence crawlers to parse original publication parsed timestamps rather than database ingestion timestamps, ensuring feeds reflect true chronological updates.',
      'v1.6.0 - Auto-Rotate Engagement: Enabled Cesium 3D camera auto-rotation as the default boot behavior to yield immediate dynamic geospatial awareness.',
      'v1.6.0 - Secure Channel Status indicators: Replaced transient connection/reconnection alerts with premium, cybernetic status reports (e.g. SECURE CHANNEL ACTIVE and CONNECTING...) next to live map signals.'
    ]
  },
  {
    version: 'v1.5.x',
    date: '2026-05-19',
    title: 'Geospatial Camera Culling & Memory Optimization',
    isMajor: true,
    bullets: [
      'v1.5.2 - Flat-Mode Camera Depth bypass: Set flat-map overlay disableDepthTestDistance to 1.0m to guarantee billboard markers bypass depth buffer culling at all tactical zooms.',
      'v1.5.1 - CMS Persistence & Horizon Clipping: Fixed bugs causing billboard entities to clip/vanish behind the physical horizon when camera pitch transitions, and reinforced CMS event persistence layers.',
      'v1.5.0 - Border Ray-Casting: Re-architected boundary and country highlighting overlays utilizing a memory-resident point-in-polygon ray-casting engine, saving up to 600MB+ WebGL memory overhead.'
    ]
  },
  {
    version: 'v1.4.x',
    date: '2026-05-12',
    title: 'AI Regulations Live-Sync & Tactical Label Refinements',
    isMajor: false,
    bullets: [
      'v1.4.5 - Interactive Panning: Programmed interactive geocoded coordinate camera panning and high-contrast polygon boundary fills on selection.',
      'v1.4.4 - Render Loop Optimizations: Fixed leaflet resize triggers and implemented Cesium requestRenderMode & ScreenSpaceError throttling to scale framerates.',
      'v1.4.3 - Evaluated Property Bag Parsing: Implemented plain object property resolvers to parse multi-layered JSON metadata fields on LEFT_CLICK entity select.',
      'v1.4.2 - Rotating Globe Default: Re-instated the 3D rotating Cesium globe as the primary landing interface, relegating the 2D Leaflet canvas to fallback.',
      'v1.4.1 - Spatial & Regional Balancing: Excluded specific high-density drone strikes from live mapping datasets to maintain performance, and decommissioned the GeoConfirmed API engine.',
      'v1.4.0 - Google My Maps AI Sync: Synced active Google My Maps layers mapping 450+ international AI guidelines and legal frameworks with automatic database synchronization.'
    ]
  },
  {
    version: 'v1.3.x',
    date: '2026-05-05',
    title: 'Secure Mailer Integrations & Session Handshakes',
    isMajor: false,
    bullets: [
      'v1.3.2 - NodeMailer v6 Downgrade: Downgraded nodemailer dependencies from v8 to v6 to resolve compiling discrepancies and host building failures on Vercel.',
      'v1.3.1 - Gmail SMTP Integration: Integrated direct secure Gmail SMTP gateways as the primary transactional mailer, replacing unverified mail fallbacks.',
      'v1.3.0 - Mount Cycle Event Locks: Relocated temporal dead zone window event listeners under component lifecycle callbacks, resolving mounting loop crashes.'
    ]
  },
  {
    version: 'v1.2.x',
    date: '2026-04-28',
    title: 'ATLAS Grid, Hexagonal GPS Jamming & Cloud Radars',
    isMajor: true,
    bullets: [
      'v1.2.3 - Golden-Angle deterministic Geojittering: Applied mathematical golden-angle spiral offsets to overlapping geolocated map signals to prevent overlapping icon clipping.',
      'v1.2.2 - ATLAS Infrastructure Overlay: Synced global undersea fiber-optic network cables and regional server database centers directly onto physical map vectors.',
      'v1.2.1 - H3-like GPS Jamming hexes: Constructed active signal degradation honeycomb maps utilizing localized epicenters with interactive telemetry tooltips.',
      'v1.2.0 - RainViewer public radar integration: Wired real-time satellite precipitation overlays using a styled cyan/blue weather tile system.'
    ]
  },
  {
    version: 'v1.1.x',
    date: '2026-04-21',
    title: 'Control Panels, Archiving & 3D metropolitan views',
    isMajor: false,
    bullets: [
      'v1.1.2 - Feedback CMS module: Integrated custom screenshot lightbox displays and resolve action triggers to clear reported coordinates directly inside the CMS panel.',
      'v1.1.1 - Lightweight CMS Backend CRUD: Released a secure, administrative console to add, edit, and archive custom event markers with complete database integrations.',
      'v1.1.0 - Extruded 3D Buildings: Rendered extruded 3D metropolitan outline toggle buttons for dense urban districts (e.g. Geneva, London, New York).'
    ]
  },
  {
    version: 'v1.0.x',
    date: '2026-04-07',
    title: 'Core Architecture & High-Density Braille Lotus Release',
    isMajor: true,
    bullets: [
      'v1.0.2 - 8-Frame bird\'s eye view bloom: Upgraded AsciiLoader blooming sequence to utilize a sequential bird\'s-eye view bloom for smooth upward animations.',
      'v1.0.1 - Braille Lotus Ascii Art: Created the growable high-density Braille lotus loading sequence holding frame to maximize loading visuals.',
      'v1.0.0 - Semantic Geocoder & Core Release: Built the primary geospatial system mapping real-time international OSINT reports, featuring a fallback geocoding engine and HTML entity decoders.'
    ]
  }
];

export default function ChangelogBox({ onClose }) {
  // All versions start fully expanded by default as requested
  const [expandedVersions, setExpandedVersions] = useState({
    'v1.6.0': true,
    'v1.5.x': true,
    'v1.4.x': true,
    'v1.3.x': true,
    'v1.2.x': true,
    'v1.1.x': true,
    'v1.0.x': true
  });

  // Position state for dragging
  const [pos, setPos] = useState({ x: 100, y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Elegant sizing & adaptive layout on mobile mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 900;
      if (mobile) {
        const startX = Math.max(10, (window.innerWidth - 320) / 2);
        setPos({ x: startX, y: 60 });
      } else {
        // Positioned elegantly on the right side of the globe
        const startX = window.innerWidth - 440;
        const startY = Math.max(20, (window.innerHeight - 560) / 2);
        setPos({ x: Math.max(20, startX), y: startY });
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
        width: '400px',
        maxWidth: 'calc(100vw - 20px)',
        height: '520px',
        maxHeight: 'calc(100vh - 100px)',
        background: 'rgba(8, 12, 24, 0.96)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(6, 182, 212, 0.12)',
        zIndex: 1005,
        fontFamily: 'var(--font-jetbrains-fallback), monospace',
        color: '#e2e8f0',
        userSelect: 'none',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: dragging ? 'none' : 'transform 0.1s ease',
      }}
    >
      {/* Drag Handle & Header (Updated branding labels) */}
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
          background: 'rgba(6, 182, 212, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} style={{ color: '#06b6d4' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', color: '#ffffff' }}>
            DASHBOARD CHANGELOG
          </span>
          <span style={{ fontSize: '9px', color: 'rgba(6, 182, 212, 0.7)', fontWeight: 'bold' }}>
            [UPDATE_LOGS]
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

      {/* Accordion Versions Body Container with visible scrollbar */}
      <div 
        style={{ 
          padding: '12px', 
          overflowY: 'auto', 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
        className="changelog-scrollbar"
      >
        {CHANGELOG_DATA.map((item) => {
          const isExpanded = !!expandedVersions[item.version];
          return (
            <div
              key={item.version}
              style={{
                border: isExpanded ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)',
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
                  background: isExpanded ? 'rgba(6, 182, 212, 0.04)' : 'transparent',
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
                    background: 'rgba(0, 0, 0, 0.2)',
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
                          lineHeight: '1.45',
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
          background: 'rgba(2, 6, 23, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '8px',
          color: 'rgba(255, 255, 255, 0.35)',
          letterSpacing: '0.05em'
        }}
      >
        <span>SECURE HANDSHAKE VERIFIED</span>
        <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>SOVEREIGN NETWORK v1.6.0</span>
      </div>

      {/* Styled visible scrollbar injected directly */}
      <style jsx global>{`
        .changelog-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .changelog-scrollbar::-webkit-scrollbar-track {
          background: rgba(2, 6, 23, 0.3);
          border-radius: 3px;
        }
        .changelog-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.35);
          border: 1px solid rgba(8, 12, 24, 0.96);
          border-radius: 3px;
        }
        .changelog-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.55);
        }
      `}</style>
    </div>
  );
}
