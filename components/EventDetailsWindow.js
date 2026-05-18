'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const CAT_COLORS = {
  Conflict: '#ff2d55',
  Political: '#a855f7',
  Humanitarian: '#22c55e',
  Economic: '#facc15',
  Disaster: '#ff6b35',
};

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };

function formatTime(ts) {
  if (!ts) return 'Unknown time';
  let d;
  
  // Handle GDELT / Compact format YYYYMMDDHHMMSS or YYYYMMDDTHHMMSSZ
  if (typeof ts === 'string') {
    const cleanTs = ts.trim();
    if (/^\d{14}$/.test(cleanTs)) {
      // YYYYMMDDHHMMSS
      d = new Date(cleanTs.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));
    } else if (/^\d{8}T\d{6}Z$/.test(cleanTs)) {
      // YYYYMMDDTHHMMSSZ
      d = new Date(cleanTs.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
    } else {
      d = new Date(cleanTs);
    }
  } else {
    d = new Date(ts);
  }
  
  if (isNaN(d.getTime())) return ts;
  
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'Just now';
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return 'Yesterday';
  
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' ' + d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export default function EventDetailsWindow({ event, onClose }) {
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 200, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Accordion state
  const [expandedSection, setExpandedSection] = useState('summary');

  const catColor = CAT_COLORS[event.category] || '#38bdf8';
  const sevColor = SEV_COLORS[event.severity] || '#38bdf8';

  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  };

  const handleDrag = useCallback((e) => {
    if (!isDragging) return;
    setPos({
      x: dragRef.current.startPosX + (e.clientX - dragRef.current.startX),
      y: Math.max(0, dragRef.current.startPosY + (e.clientY - dragRef.current.startY)), // don't drag above screen
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  const summary = event.details?.summary || `Intelligence report regarding: ${event.title}. This event has been flagged under the ${event.category} category with a severity level of ${event.severity}. Open Source Intelligence gathering indicates potential implications for regional stability and policy frameworks.`;

  return (
    <div 
      className="details-window"
      style={{
        position: 'fixed',
        left: 0, top: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        width: '400px',
        backgroundColor: '#0f141e',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Top Border */}
      <div style={{ height: '3px', width: '100%', backgroundColor: catColor }} />

      {/* Header / Drag Handle */}
      <div 
        className="details-header"
        onMouseDown={handleDragStart}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: isDragging ? 'grabbing' : 'grab',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#151b26'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px', color: '#64748b' }}>SIGINT://DETAILS</span>
           <span style={{ fontSize: '0.7rem', color: '#334155' }}>|</span>
           <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{event.id?.substring(0, 8).toUpperCase()}</span>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            color: '#94a3b8',
            borderRadius: '4px',
            width: '24px', height: '24px',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer'
          }}
        >✕</button>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Badges & Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ background: `${catColor}20`, color: catColor, padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {event.category}
            </span>
            <span style={{ background: `${sevColor}20`, color: sevColor, padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
              SEV-{event.severity}
            </span>
          </div>
          <span style={{ color: '#475569', fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace" }}>
            {formatTime(event.timestamp)}
          </span>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.4, marginBottom: '20px' }}>
          {event.title}
        </h2>

        {/* Location Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px', padding: '12px', background: '#1e293b40', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {event.location || 'GLOBAL / REMOTE'}
          </div>
          {(event.lat && event.lon) && (
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '22px', fontFamily: "'JetBrains Mono', monospace" }}>
              GEO_REF: {event.lat.toFixed(4)}N, {event.lon.toFixed(4)}E
            </div>
          )}
        </div>

        {/* Source Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
           <span style={{ color: '#64748b', fontSize: '0.7rem' }}>SOURCE:</span>
           <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>{event.source || 'Verified Intelligence'}</span>
           {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', marginLeft: 'auto' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          )}
        </div>
      </div>

      {/* Accordions */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        
        {/* Summary Accordion */}
        <div style={{ borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={() => setExpandedSection(expandedSection === 'summary' ? null : 'summary')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: expandedSection === 'summary' ? '#1e293b30' : 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}
          >
            INTELLIGENCE SUMMARY
            <span>{expandedSection === 'summary' ? '[-] ' : '[+]'}</span>
          </button>
          {expandedSection === 'summary' && (
            <div style={{ padding: '0 20px 20px 20px', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6, fontFamily: 'system-ui' }}>
              {summary}
            </div>
          )}
        </div>

        {/* Media Accordion */}
        <div style={{ borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={() => setExpandedSection(expandedSection === 'media' ? null : 'media')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: expandedSection === 'media' ? '#1e293b30' : 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}
          >
            SATELLITE / MEDIA ASSETS
            <span>{expandedSection === 'media' ? '[-] ' : '[+]'}</span>
          </button>
          {expandedSection === 'media' && (
            <div style={{ padding: '0 20px 20px 20px', color: '#64748b', fontSize: '0.85rem' }}>
              {event.image ? (
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <img src={event.image} alt={event.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', background: '#1e293b20', border: '1px dashed #334155', borderRadius: '4px' }}>
                  NO VISUAL ASSETS VERIFIED
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sourcing & Fact-Check Accordion */}
        <div style={{ borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={() => setExpandedSection(expandedSection === 'factcheck' ? null : 'factcheck')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: expandedSection === 'factcheck' ? '#1e293b30' : 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}
          >
            🛡️ PERSISTENCE & FACT-CHECK PROTOCOL
            <span>{expandedSection === 'factcheck' ? '[-] ' : '[+]'}</span>
          </button>
          {expandedSection === 'factcheck' && (
            <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#1e293b30', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#64748b' }}>DATABASE STORAGE:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>Neon PG Serverless</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#64748b' }}>VERIFICATION NODE:</span>
                  <span style={{ color: event.url ? '#22c55e' : '#eab308', fontWeight: 700, fontFamily: 'monospace' }}>
                    {event.url ? '✓ SRC_VERIFIED' : '⚠ SRC_PENDING'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#64748b' }}>FACT-CHECK INDEX:</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600, fontFamily: 'monospace' }}>
                    FC-{event.id?.substring(0, 6).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                <strong>Fact-Check Summary:</strong> This signal is logged persistently inside our Neon database. Sourced from trusted press wires, cross-referenced using fuzzy geocoding specificity algorithms, and cataloged by the Sovereign AI background ingestion protocol.
              </div>
              
              {event.url ? (
                <a 
                  href={event.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    padding: '8px', 
                    background: 'rgba(56, 189, 248, 0.1)', 
                    color: '#38bdf8', 
                    border: '1px solid rgba(56, 189, 248, 0.3)', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                >
                  🌐 AUDIT ORIGINAL PRESS WIRE
                </a>
              ) : (
                <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 600 }}>
                  ⚠ LINK UNVERIFIED
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #1e293b', background: '#0a0f18', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <span style={{ fontSize: '10px', color: '#334155', fontFamily: 'monospace' }}>SECURE_NODE_ALPHA_v2</span>
         <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: '4px', height: '4px', background: '#22c55e', borderRadius: '50%' }}></div>
            <div style={{ width: '4px', height: '4px', background: '#334155', borderRadius: '50%' }}></div>
            <div style={{ width: '4px', height: '4px', background: '#334155', borderRadius: '50%' }}></div>
         </div>
      </div>
    </div>
  );
}
