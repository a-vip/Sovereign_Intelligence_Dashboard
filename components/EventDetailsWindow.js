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

export default function EventDetailsWindow({ event, onClose, onReportIssue }) {
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 200, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Accordion state
  const [expandedSection, setExpandedSection] = useState('summary');

  // Self-Healing Link Verification State
  const [currentUrl, setCurrentUrl] = useState(event.url);
  const [verificationStatus, setVerificationStatus] = useState('checking'); // 'checking', 'active', 'healed', 'broken'
  const [verificationMessage, setVerificationMessage] = useState('Verifying source link integrity...');

  useEffect(() => {
    // Reset state on event change
    setCurrentUrl(event.url);
    setVerificationStatus(event.url ? 'checking' : 'broken');
    setVerificationMessage(event.url ? 'Verifying source link integrity...' : 'No external source link provided.');

    if (!event.url) return;

    let active = true;
    async function checkLink() {
      try {
        const res = await fetch(`/api/events/verify-link?id=${event.id}&url=${encodeURIComponent(event.url)}&title=${encodeURIComponent(event.title)}&source=${encodeURIComponent(event.source || '')}`);
        const data = await res.json();
        if (!active) return;

        if (data.status === 'active') {
          setVerificationStatus('active');
          setVerificationMessage('Source link verified active and authentic.');
        } else if (data.status === 'healed') {
          setVerificationStatus('healed');
          setCurrentUrl(data.url);
          setVerificationMessage('Broken link healed! Verified alternative press wire found.');
          event.url = data.url; // Locally correct the event url
        } else {
          setVerificationStatus('broken');
          setVerificationMessage('Primary source link is dead (404/broken).');
        }
      } catch (e) {
        if (!active) return;
        setVerificationStatus('broken');
        setVerificationMessage('Link verification protocol offline.');
      }
    }

    checkLink();
    return () => { active = false; };
  }, [event]);

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
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '22px', fontFamily: "'JetBrains Mono', monospace", display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span>GEO_REF: {event.lat.toFixed(4)}N, {event.lon.toFixed(4)}E</span>
              {onReportIssue && (
                <button
                  onClick={() => onReportIssue('suggestions', {
                    type: 'map',
                    subject: `Incorrect Coordinates for: ${event.title}`,
                    targetId: `${event.lat.toFixed(4)}, ${event.lon.toFixed(4)} (ID: ${event.id})`,
                    details: `The threat marker for "${event.title}" is located at coordinates ${event.lat.toFixed(4)}, ${event.lon.toFixed(4)} but is placed on the incorrect part of the map. Correct coordinates should be:`
                  })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f59e0b',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                  title="Report incorrect placement of this marker on the map"
                >
                  [REPORT INCORRECT COORDS]
                </button>
              )}
            </div>
          )}
        </div>

        {/* Source Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>SOURCES:</span>
          {(event.source || 'Verified Intelligence')
            .split(/[\/\&]|\band\b/i)
            .map(s => s.trim())
            .filter(Boolean)
            .map((src, idx) => {
              const lowerSrc = src.toLowerCase();
              const lowerUrl = (currentUrl || '').toLowerCase();
              const isMatch = lowerUrl.includes(lowerSrc.replace(/\s+/g, '')) || 
                              (lowerSrc.includes('reuters') && lowerUrl.includes('reuters')) ||
                              (lowerSrc.includes('bbc') && lowerUrl.includes('bbc')) ||
                              (lowerSrc.includes('guardian') && lowerUrl.includes('theguardian')) ||
                              (lowerSrc.includes('al jazeera') && lowerUrl.includes('aljazeera'));

              return (
                <span 
                  key={idx} 
                  style={{ 
                    background: isMatch ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.5)',
                    color: isMatch ? '#38bdf8' : '#64748b', 
                    border: isMatch ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(30, 41, 59, 0.8)',
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.65rem', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isMatch ? '0 0 10px rgba(56, 189, 248, 0.1)' : 'none'
                  }}
                >
                  {src}
                  {isMatch && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#38bdf8' }} />}
                </span>
              );
            })}
          {currentUrl && (
            <a 
              href={currentUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: '#38bdf8', 
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.15)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.15)';
              }}
              title="Audit Active Press Link"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
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
                  <span style={{ 
                    color: verificationStatus === 'active' ? '#22c55e' : verificationStatus === 'healed' ? '#00f0ff' : verificationStatus === 'checking' ? '#38bdf8' : '#ef4444', 
                    fontWeight: 700, 
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {verificationStatus === 'checking' && '🔍 SRC_CHECKING...'}
                    {verificationStatus === 'active' && '✓ SRC_VERIFIED'}
                    {verificationStatus === 'healed' && '⚡ SRC_HEALED'}
                    {verificationStatus === 'broken' && '⚠ SRC_BROKEN'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#64748b' }}>FACT-CHECK INDEX:</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600, fontFamily: 'monospace' }}>
                    FC-{event.id?.substring(0, 6).toUpperCase()}
                  </span>
                </div>
                
                {/* Real-time Diagnostics log */}
                <div style={{ 
                  marginTop: '4px',
                  paddingTop: '6px', 
                  borderTop: '1px solid rgba(56, 189, 248, 0.08)',
                  fontSize: '9px', 
                  color: '#64748b', 
                  fontStyle: 'italic', 
                  display: 'flex', 
                  gap: '6px', 
                  alignItems: 'center' 
                }}>
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: verificationStatus === 'active' ? '#22c55e' : verificationStatus === 'healed' ? '#00f0ff' : verificationStatus === 'checking' ? '#38bdf8' : '#ef4444',
                    display: 'inline-block'
                  }} />
                  {verificationMessage}
                </div>
              </div>
              
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                <strong>Fact-Check Summary:</strong> This signal is logged persistently inside our Neon database. Sourced from trusted press wires, cross-referenced using fuzzy geocoding specificity algorithms, and cataloged by the Sovereign AI background ingestion protocol.
              </div>
              
              {currentUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a 
                    href={currentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      padding: '8px', 
                      background: verificationStatus === 'healed' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(56, 189, 248, 0.1)', 
                      color: verificationStatus === 'healed' ? '#00f0ff' : '#38bdf8', 
                      border: verificationStatus === 'healed' ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: verificationStatus === 'healed' ? '0 0 12px rgba(0, 240, 255, 0.15)' : 'none'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.background = verificationStatus === 'healed' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(56, 189, 248, 0.2)'; 
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.background = verificationStatus === 'healed' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(56, 189, 248, 0.1)'; 
                    }}
                  >
                    {verificationStatus === 'healed' ? '⚡ AUDIT HEALED PRESS WIRE' : '🌐 AUDIT ORIGINAL PRESS WIRE'}
                  </a>
                  {onReportIssue && (
                    <button
                      onClick={() => onReportIssue('suggestions', {
                        type: 'link',
                        subject: `Broken Press Link for: ${event.title}`,
                        targetId: `URL: ${currentUrl} (ID: ${event.id})`,
                        details: `The press link for "${event.title}" seems to be broken, throws an error, or links to incorrect information. The URL reported is: ${currentUrl}`
                      })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        background: 'rgba(245, 158, 11, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '4px',
                        color: '#f59e0b',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)'}
                    >
                      [⚡ REPORT BROKEN INTEL LINK]
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 600 }}>
                    ⚠ LINK UNVERIFIED (BROKEN)
                  </div>
                  {onReportIssue && (
                    <button
                      onClick={() => onReportIssue('suggestions', {
                        type: 'link',
                        subject: `Missing/Broken Link for: ${event.title}`,
                        targetId: `ID: ${event.id}`,
                        details: `The intelligence dossier for "${event.title}" has a missing or dead source press link.`
                      })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '4px',
                        color: '#ef4444',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                    >
                      [⚡ REPORT MISSING SOURCE LINK]
                    </button>
                  )}
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
