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
  const d = new Date(ts.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));
  if (isNaN(d)) return ts;
  const diff = Date.now() - d;
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return d.toLocaleDateString();
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

  // Generate a mock summary based on the title
  const summary = `Intelligence report regarding: ${event.title}. This event has been flagged under the ${event.category} category with a severity level of ${event.severity}. Open Source Intelligence gathering indicates potential implications for regional stability and policy frameworks.`;

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
        <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', color: '#94a3b8' }}>DETAILS</span>
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
        {/* Badges */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
          <span style={{ background: `${catColor}20`, color: catColor, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            {event.category}
          </span>
          <span style={{ background: `${sevColor}20`, color: sevColor, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            S{event.severity}
          </span>
          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </a>
          )}
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.4, marginBottom: '20px' }}>
          {event.title}
        </h2>

        {/* Meta Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', paddingBottom: '16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            {formatTime(event.timestamp)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {event.location || 'Global / OSINT'}
          </div>
        </div>
      </div>

      {/* Accordions */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Summary Accordion */}
        <div style={{ borderBottom: '1px solid #1e293b' }}>
          <button 
            onClick={() => setExpandedSection(expandedSection === 'summary' ? null : 'summary')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', cursor: 'pointer' }}
          >
            SUMMARY
            <span>{expandedSection === 'summary' ? '↑' : '↓'}</span>
          </button>
          {expandedSection === 'summary' && (
            <div style={{ padding: '0 20px 20px 20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {summary}
            </div>
          )}
        </div>

        {/* Media Accordion */}
        <div style={{ borderBottom: '1px solid #1e293b' }}>
          <button 
            onClick={() => setExpandedSection(expandedSection === 'media' ? null : 'media')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', cursor: 'pointer' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              MEDIA ({event.image ? '1' : '0'})
            </span>
            <span>{expandedSection === 'media' ? '↑' : '↓'}</span>
          </button>
          {expandedSection === 'media' && (
            <div style={{ padding: '0 20px 20px 20px', color: '#64748b', fontSize: '0.85rem' }}>
              {event.image ? (
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={event.image} alt={event.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                'No visual assets verified for this event.'
              )}
            </div>
          )}
        </div>

        {/* Signals Accordion */}
        <div>
          <button 
            onClick={() => setExpandedSection(expandedSection === 'signals' ? null : 'signals')}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', cursor: 'pointer' }}
          >
            SIGNALS (1)
            <span>{expandedSection === 'signals' ? '↑' : '↓'}</span>
          </button>
          {expandedSection === 'signals' && (
            <div style={{ padding: '0 20px 20px 20px' }}>
              <div style={{ background: '#1e293b50', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>@{event.source ? event.source.replace(/\s+/g, '').toLowerCase() : 'osint_monitor'}</span>
                  <span>{formatTime(event.timestamp)}</span>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '12px' }}>
                  Intelligence report retrieved from {event.source || 'OSINT network'}. Click the link below for the full source article, research, or documentation.
                </div>
                {event.url && (
                  <a href={event.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    {event.url.length > 40 ? event.url.substring(0, 40) + '...' : event.url}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
