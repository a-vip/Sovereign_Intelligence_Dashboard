'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import EventDetailsWindow from './EventDetailsWindow';
import MarketQuotesBox from './MarketQuotesBox';

const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { ssr: false });

const EVENTS_POLL = 15000; // Increased frequency (15s)

const CAT_COLORS = {
  Conflict: '#ff2d55',
  Surveillance: '#00f0ff',
  Political: '#a855f7',
  Humanitarian: '#22c55e',
  Economic: '#facc15',
  Disaster: '#ff6b35',
};

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts.replace(/(d{4})(d{2})(d{2})(d{2})(d{2})(d{2})/, '$1-$2-$3T$4:$5:$6Z'));
  if (isNaN(d)) return ts;
  const diff = Date.now() - d;
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default function LiveMap() {
  const [markers, setMarkers] = useState([]);
  const [allFetchedEvents, setAllFetchedEvents] = useState([]);
  const [categories, setCategories] = useState({ Conflict: true, Surveillance: true, Political: true, Humanitarian: true, Economic: true, Disaster: true });
  const [minSeverity, setMinSeverity] = useState(1);
  const [status, setStatus] = useState('loading');
  const [feedTab, setFeedTab] = useState('feed');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMarkets, setShowMarkets] = useState(false);

  const [timeRange, setTimeRange] = useState('today'); 
  const [isVisible, setIsVisible] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [feedType, setFeedType] = useState('live'); // 'live' or 'reports'
  const [mapMode, setMapMode] = useState('2d'); // 2D satellite default for buttery performance!
  const [mapStyle, setMapStyle] = useState('dark'); // 'satellite' (Google Hybrid) or 'dark' (Tactical Dark theme)
  
  const [isMobile, setIsMobile] = useState(false);
  const mapAreaRef = useRef(null);

  // Handle window resizing and mobile status
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (mobile) {
        setIsMinimized(true); // Auto-minimize overlay on mobile
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Overlay Settings
  const [isCatExpanded, setIsCatExpanded] = useState(true);

  // 8-second live feed queue
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Drag state for overlay panel
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startPosX: panelPos.x, startPosY: panelPos.y,
    };
  };

  const handleDrag = useCallback((e) => {
    if (!isDragging) return;
    setPanelPos({
      x: dragRef.current.startPosX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.startPosY + (e.clientY - dragRef.current.startY),
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!isVisible) return; // Don't fetch if tab is hidden
    try {
      const res = await fetch(`/api/events?timespan=${timeRange}`);
      const data = await res.json();
      if (data.events?.length) {
        setAllFetchedEvents(data.events);
        setDisplayedEvents(prevDisplay => {
          if (isInitializing || prevDisplay.length === 0) {
            setIsInitializing(false);
            // On initial load, display all events instantly (no trickle queue)
            return [...data.events].reverse().map((e, idx) => ({ ...e, _displayKey: `${e.id}-init-${idx}` }));
          } else {
            // Prepend only the brand new streamed events
            const newEvents = data.events.filter(e => !prevDisplay.some(p => p.id === e.id));
            if (newEvents.length > 0) {
              setIsPulsing(true);
              setTimeout(() => setIsPulsing(false), 2000);
              return [...newEvents.reverse().map((e, idx) => ({ ...e, _displayKey: `${e.id}-stream-${idx}` })), ...prevDisplay];
            }
            return prevDisplay;
          }
        });
        setMarkers(data.markers || []);
      }
      setStatus(data.status || 'live');
    } catch { setStatus('error'); }
  }, [isInitializing, isVisible, timeRange]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, EVENTS_POLL);
    return () => clearInterval(interval);
  }, [fetchEvents, timeRange]); // Refetch when timeRange changes

  const toggleCategory = (key) => setCategories(c => ({ ...c, [key]: !c[key] }));

  // Memoize filtered data to prevent unnecessary re-renders
  const displayedMarkers = useMemo(() => {
    let filtered = markers.filter(m => categories[m.category] && m.severity >= minSeverity);
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => {
        const nameMatch = (m.name || m.title || '').toLowerCase().includes(q);
        const locMatch = (m.location || '').toLowerCase().includes(q);
        const catMatch = (m.category || '').toLowerCase().includes(q);
        const descMatch = (m.description || m.details?.summary || '').toLowerCase().includes(q);
        return nameMatch || locMatch || catMatch || descMatch;
      });
    }
    return filtered;
  }, [markers, categories, minSeverity, searchQuery]);

  const filteredEvents = useMemo(() => {
    let activeCategories = Object.keys(categories).filter(c => categories[c]);
    let filtered = displayedEvents.filter(e => {
      if (feedType === 'live') return !e.curated && !e.details?.isResearch && (e.severity < 4 || !e.source?.includes('Reuters')); 
      return e.curated || e.details?.isResearch || e.severity >= 4 || e.source?.includes('Reuters') || e.source?.includes('Guardian');
    });
    
    if (activeCategories.length > 0) {
      filtered = filtered.filter(e => activeCategories.includes(e.category));
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(e => {
        const titleMatch = (e.title || '').toLowerCase().includes(q);
        const locMatch = (e.location || '').toLowerCase().includes(q);
        const catMatch = (e.category || '').toLowerCase().includes(q);
        const srcMatch = (e.source || '').toLowerCase().includes(q);
        const summaryMatch = (e.details?.summary || e.description || '').toLowerCase().includes(q);
        return titleMatch || locMatch || catMatch || srcMatch || summaryMatch;
      });
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [displayedEvents, categories, feedType, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    markers.forEach(m => { counts[m.category] = (counts[m.category] || 0) + 1; });
    return counts;
  }, [markers]);

  return (
    <div className="sigint-container">
      {/* Event Feed Sidebar */}
      <div className="sigint-feed">
        <div className="feed-type-tabs">
          <button className={`feed-type-tab ${feedType === 'live' ? 'active' : ''}`} onClick={() => setFeedType('live')}>
            LIVE SIGNALS
          </button>
          <button className={`feed-type-tab ${feedType === 'reports' ? 'active' : ''}`} onClick={() => setFeedType('reports')}>
            INTEL REPORTS
          </button>
        </div>
        
        <div className="feed-tabs">
          <button className={`feed-tab ${timeRange === 'today' ? 'active' : ''}`} onClick={() => setTimeRange('today')}>TODAY</button>
          <button className={`feed-tab live-tab ${timeRange === '6h' ? 'active' : ''}`} onClick={() => setTimeRange('6h')}>6 HOURS</button>
        </div>
        
        {/* Live Search Bar */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.1)',
          background: 'rgba(8, 12, 24, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH SIGNAL FEED..."
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.55)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '6px',
                padding: '8px 32px 8px 12px',
                color: '#ffffff',
                fontFamily: 'Courier New, monospace',
                fontSize: '11px',
                letterSpacing: '0.05em',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00f0ff';
                e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {/* Search/Filter Indicator */}
            <div style={{
              position: 'absolute',
              right: searchQuery ? '28px' : '12px',
              color: searchQuery ? '#00f0ff' : 'rgba(56, 189, 248, 0.4)',
              fontSize: '11px',
              pointerEvents: 'none',
              fontFamily: 'monospace'
            }}>
              🔍
            </div>
            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 0.8)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  outline: 'none',
                  padding: '2px 4px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(239, 68, 68, 0.8)'}
                title="Clear Search"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <div style={{
              fontSize: '9px',
              fontFamily: 'Courier New, monospace',
              color: '#00f0ff',
              letterSpacing: '0.05em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2px'
            }}>
              <span>FILTERED: {filteredEvents.length} MATCHES</span>
              <button 
                onClick={() => setSearchQuery('')}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'rgba(56, 189, 248, 0.6)', 
                  cursor: 'pointer', 
                  fontSize: '9px',
                  textDecoration: 'underline',
                  fontFamily: 'monospace',
                  padding: 0
                }}
              >
                RESET
              </button>
            </div>
          )}
        </div>
        
        <div className="feed-list">
          {filteredEvents.map((ev, idx) => (
            <div key={ev._displayKey || `${ev.id}-${idx}`} className="feed-item" onClick={() => setSelectedEvent(ev)}>
              <div className="feed-item-header">
                <span className="feed-category" style={{ background: `${CAT_COLORS[ev.category]}20`, color: CAT_COLORS[ev.category], borderColor: `${CAT_COLORS[ev.category]}40` }}>
                  {ev.category}
                </span>
                {ev.details?.isResearch && <span className="research-badge" style={{ fontSize: '9px', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.3)', fontWeight: '800', marginLeft: '6px' }}>RESEARCH</span>}
                <span className="feed-severity" style={{ background: `${SEV_COLORS[ev.severity]}25`, color: SEV_COLORS[ev.severity] }}>
                  S{ev.severity}
                </span>
                <span className="feed-time">{formatTime(ev.timestamp)}</span>
              </div>
              <div className="feed-title">{ev.title}</div>
              {ev.location && <div className="feed-location">📍 {ev.location}</div>}
            </div>
          ))}
          {filteredEvents.length === 0 && <div className="feed-empty">No events match current filters</div>}
        </div>
      </div>

      {/* 3D Google Tiles Globe Area */}
      <div ref={mapAreaRef} className="sigint-map-area">
        <CesiumGlobe
          displayedMarkers={displayedMarkers}
          mapMode={mapMode}
          mapStyle={mapStyle}
          onPointClick={(point) => {
            const fullEvent = allFetchedEvents.find(ev => ev.id === point.id || ev.title === point.name || `db-${ev.id}` === point.id || ev.id === point.id?.replace('db-', ''));
            setSelectedEvent(fullEvent || point);
          }}
        />
      </div>

      {/* Overlay Controls */}
      <div
        className={`overlay-panel ${isMinimized ? 'minimized' : ''}`}
        style={{
          transform: isMobile ? 'none' : `translate(${panelPos.x}px, ${panelPos.y}px)`,
          cursor: isMobile || isMinimized ? 'auto' : (isDragging ? 'grabbing' : 'grab'),
          transition: isDragging ? 'none' : 'transform 0.1s ease',
          zIndex: 20,
          position: isMobile ? 'fixed' : 'absolute',
          right: isMobile ? '20px' : '20px',
          bottom: isMobile ? '20px' : '48px',
          left: isMobile ? '20px' : 'auto',
          width: isMobile ? 'auto' : (isMinimized ? '140px' : '260px'),
          maxWidth: isMobile ? 'none' : '260px'
        }}
      >
        <div
          className="overlay-drag-handle"
          onMouseDown={handleDragStart}
          style={{
            height: '24px', cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 8px', background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <span style={{ fontSize: '9px', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.05em' }}>
            🛰️ TACTICAL MONITORS
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            style={{
              background: 'none', border: 'none', color: '#8892a4', cursor: 'pointer',
              fontSize: '10px', fontWeight: 'bold'
            }}
          >
            {isMinimized ? '[+]' : '[-]'}
          </button>
        </div>

        {!isMinimized ? (
          <>
            <div className="overlay-section">
              <div className="overlay-title" onClick={() => setIsCatExpanded(!isCatExpanded)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span>CATEGORIES</span>
                <span>{isCatExpanded ? '▼' : '▶'}</span>
              </div>

              {isCatExpanded && (
                <div style={{ marginTop: '8px' }}>
                  {Object.keys(categories).map(cat => (
                    <label key={cat} className="cat-toggle">
                      <span className="cat-label">
                        <span className="cat-dot" style={{ background: CAT_COLORS[cat] }} />
                        {cat}
                        <span className="cat-count">({categoryCounts[cat] || 0})</span>
                      </span>
                      <input type="checkbox" checked={categories[cat]} onChange={() => toggleCategory(cat)} />
                      <span className="cat-check" style={{ borderColor: categories[cat] ? CAT_COLORS[cat] : '#4a5568', background: categories[cat] ? `${CAT_COLORS[cat]}20` : 'transparent' }}>
                        {categories[cat] && '✓'}
                      </span>
                    </label>
                  ))}

                  <div className="overlay-title" style={{ marginTop: '16px', marginBottom: '12px' }}>MIN. SEVERITY</div>
                  <div className="severity-buttons">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} className={`sev-btn${minSeverity <= s ? ' active' : ''}`}
                        style={{ background: minSeverity <= s ? SEV_COLORS[s] : 'transparent', color: minSeverity <= s ? '#000' : '#8892a4', borderColor: SEV_COLORS[s] }}
                        onClick={() => setMinSeverity(s)}>
                        S{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="overlay-section" style={{ paddingTop: '12px', marginTop: '12px' }}>
              <div className="overlay-title">MAP MODE</div>
              <div className="severity-buttons" style={{ marginTop: '8px', marginBottom: '12px', display: 'flex', gap: '6px' }}>
                <button
                  className={`sev-btn${mapMode === '3d' ? ' active' : ''}`}
                  style={{
                    background: mapMode === '3d' ? '#38bdf8' : 'transparent',
                    color: mapMode === '3d' ? '#020617' : '#8892a4',
                    borderColor: '#38bdf8',
                    flex: 1,
                    fontSize: '9px',
                    padding: '6px 0',
                    fontWeight: '800',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: '1px solid #38bdf8',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setMapMode('3d')}
                >
                  3D BUILDINGS
                </button>
                <button
                  className={`sev-btn${mapMode === '2d' ? ' active' : ''}`}
                  style={{
                    background: mapMode === '2d' ? '#38bdf8' : 'transparent',
                    color: mapMode === '2d' ? '#020617' : '#8892a4',
                    borderColor: '#38bdf8',
                    flex: 1,
                    fontSize: '9px',
                    padding: '6px 0',
                    fontWeight: '800',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: '1px solid #38bdf8',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setMapMode('2d')}
                >
                  2D SATELLITE
                </button>
              </div>
            </div>

            <div className="overlay-section" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
              <div className="overlay-title">BASE MAP STYLE</div>
              <div className="severity-buttons" style={{ marginTop: '8px', marginBottom: '12px', display: 'flex', gap: '6px' }}>
                <button
                  className={`sev-btn${mapStyle === 'satellite' ? ' active' : ''}`}
                  style={{
                    background: mapStyle === 'satellite' ? '#38bdf8' : 'transparent',
                    color: mapStyle === 'satellite' ? '#020617' : '#8892a4',
                    borderColor: '#38bdf8',
                    flex: 1,
                    fontSize: '9px',
                    padding: '6px 0',
                    fontWeight: '800',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: '1px solid #38bdf8',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setMapStyle('satellite')}
                >
                  SATELLITE
                </button>
                <button
                  className={`sev-btn${mapStyle === 'dark' ? ' active' : ''}`}
                  style={{
                    background: mapStyle === 'dark' ? '#38bdf8' : 'transparent',
                    color: mapStyle === 'dark' ? '#020617' : '#8892a4',
                    borderColor: '#38bdf8',
                    flex: 1,
                    fontSize: '9px',
                    padding: '6px 0',
                    fontWeight: '800',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: '1px solid #38bdf8',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setMapStyle('dark')}
                >
                  TACTICAL DARK
                </button>
              </div>
            </div>

            <div className="overlay-section" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
              <div className="overlay-title">TACTICAL WIDGETS</div>
              <button
                className={`sev-btn${showMarkets ? ' active' : ''}`}
                style={{
                  marginTop: '8px',
                  background: showMarkets ? '#10b981' : 'transparent',
                  color: showMarkets ? '#020617' : '#8892a4',
                  borderColor: '#10b981',
                  width: '100%',
                  fontSize: '9px',
                  padding: '6px 0',
                  fontWeight: '800',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  border: '1px solid #10b981',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onClick={() => setShowMarkets(!showMarkets)}
              >
                📊 {showMarkets ? 'DISABLE MARKETS' : 'MONITOR MARKETS'}
              </button>
            </div>

            <div className="overlay-section" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
              <div className="overlay-title">MAP SYSTEM</div>
              <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '4px', fontFamily: 'monospace' }}>
                POWERED BY: GOOGLE 3D TILES
                <br />
                RENDERER: CESIUMJS WebGL
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 0' }}>
            INTEL OVERLAY
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="map-status-bar" style={{ zIndex: 10 }}>
        <div className="status-item">
          <span className={`status-dot ${status === 'live' ? 'live' : ''}`} />
          {status === 'live' ? 'SYSTEMS ACTIVE' : 'RECONNECTING...'}
        </div>
        <div className="status-item">
          ⚡ {displayedMarkers.length} MAP SIGNALS
        </div>
        <div className="status-item" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a 
            href="https://aviperera.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#38bdf8', 
              textDecoration: 'none', 
              fontWeight: '700',
              fontFamily: 'monospace',
              fontSize: '10px',
              transition: 'color 0.2s',
              borderBottom: '1px dotted rgba(56, 189, 248, 0.4)',
              paddingBottom: '1px',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#38bdf8'}
          >
            MADE BY AVI
          </a>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span>DATABASE SYNC: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Live Market Quotes Box */}
      {showMarkets && (
        <MarketQuotesBox onClose={() => setShowMarkets(false)} />
      )}

      {/* Event Detail Modal (Draggable Window) */}
      {selectedEvent && (
        <EventDetailsWindow
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          SEV_COLORS={SEV_COLORS}
          CAT_COLORS={CAT_COLORS}
          formatTime={formatTime}
        />
      )}
    </div>
  );
}
