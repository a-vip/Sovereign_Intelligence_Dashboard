'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import EventDetailsWindow from './EventDetailsWindow';

// Import Globe dynamically just in case, though LiveMap itself is wrapped.
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

const EVENTS_POLL = 60000; // 1 minute

const CAT_COLORS = {
  Conflict: '#ff2d55',
  Political: '#a855f7',
  Humanitarian: '#22c55e',
  Economic: '#facc15',
  Disaster: '#ff6b35',
};

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };
const SEV_SIZES = { 1: 5, 2: 6, 3: 8, 4: 10, 5: 13 };

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));
  if (isNaN(d)) return ts;
  const diff = Date.now() - d;
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default function LiveMap() {
  const [markers, setMarkers] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState({ Conflict: true, Political: true, Humanitarian: true, Economic: true, Disaster: true });
  const [minSeverity, setMinSeverity] = useState(1);
  const [status, setStatus] = useState('loading');
  const [feedTab, setFeedTab] = useState('feed');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Globe Settings
  const [isGlobeSatellite, setIsGlobeSatellite] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const globeEl = useRef();

  // Overlay Settings
  const [isCatExpanded, setIsCatExpanded] = useState(true);

  // 8-second live feed queue
  const [eventQueue, setEventQueue] = useState([]);
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
      startX: e.clientX,
      startY: e.clientY,
      startPosX: panelPos.x,
      startPosY: panelPos.y,
    };
  };

  const handleDrag = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPanelPos({
      x: dragRef.current.startPosX + dx,
      y: dragRef.current.startPosY + dy,
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

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      
      if (data.events?.length) {
        if (isInitializing || eventQueue.length === 0) {
          const fetchedEvents = [...data.events].reverse();
          setDisplayedEvents(fetchedEvents.slice(0, 5));
          setEventQueue(fetchedEvents.slice(5));
          setIsInitializing(false);
        }
        
        setMarkers(data.markers || []);
        setEvents(data.events || []);
      }
      setStatus(data.status || 'live');
    } catch { setStatus('error'); }
  }, [isInitializing, eventQueue.length]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, EVENTS_POLL);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // 8-second tick to pop from queue
  useEffect(() => {
    if (isInitializing || eventQueue.length === 0) return;

    const interval = setInterval(() => {
      setEventQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;
        
        const nextEvent = prevQueue[0];
        const newQueue = prevQueue.slice(1);
        newQueue.push(nextEvent); // Loop infinitely

        setDisplayedEvents((prevDisplay) => {
          const updated = [nextEvent, ...prevDisplay];
          if (updated.length > 50) return updated.slice(0, 50);
          return updated;
        });

        return newQueue;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isInitializing, eventQueue.length]);

  // Globe Auto-Rotate configuration
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = autoRotate;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      
      // Setup event listeners on controls to stop auto-rotate on interaction
      const controls = globeEl.current.controls();
      const onInteraction = () => setAutoRotate(false);
      
      controls.addEventListener('start', onInteraction);
      return () => controls.removeEventListener('start', onInteraction);
    }
  }, [autoRotate]);

  const toggleCategory = (key) => setCategories(c => ({ ...c, [key]: !c[key] }));

  // Map markers to the events if possible.
  const displayedMarkers = markers.filter(m => 
    displayedEvents.some(e => e.title === m.name || e.id.replace('ev', 'geo') === m.id)
  );

  const filteredMarkers = displayedMarkers.filter(m => categories[m.category] && m.severity >= minSeverity);
  const filteredEvents = displayedEvents.filter(e => categories[e.category] && e.severity >= minSeverity);
  
  const categoryCounts = {};
  displayedEvents.forEach(e => { categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1; });

  return (
    <div className="sigint-container" style={{ position: 'relative', width: '100%', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
      {/* Event Feed Sidebar */}
      <div className="sigint-feed" style={{ zIndex: 10 }}>
        <div className="feed-tabs">
          <button className={`feed-tab${feedTab === 'feed' ? ' active' : ''}`} onClick={() => setFeedTab('feed')}>FEED</button>
          <button className={`feed-tab live-tab${feedTab === 'live' ? ' active' : ''}`} onClick={() => setFeedTab('live')}>LIVE</button>
          <span className="feed-count">{filteredEvents.length} events</span>
        </div>
        <div className="feed-list">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="feed-item" onClick={() => setSelectedEvent(ev)}>
              <div className="feed-item-header">
                <span className="feed-category" style={{ background: `${CAT_COLORS[ev.category]}20`, color: CAT_COLORS[ev.category], borderColor: `${CAT_COLORS[ev.category]}40` }}>
                  {ev.category}
                </span>
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

      {/* 3D Globe Area */}
      <div className="sigint-map-area" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0a0f14' }}>
        {typeof window !== 'undefined' && (
          <Globe
            ref={globeEl}
            globeImageUrl={isGlobeSatellite ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" : "//unpkg.com/three-globe/example/img/earth-night.jpg"}
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            showAtmosphere={true}
            atmosphereColor="#38bdf8"
            atmosphereAltitude={0.15}
            htmlElementsData={filteredMarkers}
            htmlLat="lat"
            htmlLng="lon"
            htmlElement={(d) => {
              const el = document.createElement('div');
              const size = SEV_SIZES[d.severity] * 1.5;
              const color = CAT_COLORS[d.category] || '#888';
              
              el.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; pointer-events: auto; cursor: pointer; transform: translate(-${size/2}px, -${size/2}px);">
                  <div style="
                    width: ${size}px; 
                    height: ${size}px; 
                    background: ${color}; 
                    border-radius: 50%; 
                    box-shadow: 0 0 ${size * 2}px ${color}, 0 0 ${size}px #fff;
                  " class="globe-dot"></div>
                  <div style="
                    background: rgba(10, 15, 20, 0.85);
                    backdrop-filter: blur(4px);
                    border: 1px solid ${color}50;
                    border-left: 3px solid ${color};
                    padding: 4px 8px;
                    border-radius: 2px 6px 6px 2px;
                    color: #cbd5e1;
                    font-family: 'SFMono-Regular', Consolas, monospace;
                    font-size: 11px;
                    white-space: nowrap;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                  ">
                    <span style="color: ${color}; font-weight: 700; margin-right: 8px; letter-spacing: 0.5px;">${d.category.toUpperCase()}</span>
                    ${d.name.length > 45 ? d.name.substring(0, 45) + '...' : d.name}
                  </div>
                </div>
              `;
              
              // Find full event to pass to detail window
              const fullEvent = displayedEvents.find(e => e.title === d.name || e.id.replace('ev', 'geo') === d.id) || d;
              el.onclick = () => setSelectedEvent(fullEvent);
              
              return el;
            }}
          />
        )}
      </div>

      {/* Overlay Controls */}
      <div 
        className="overlay-panel" 
        style={{ 
          transform: `translate(${panelPos.x}px, ${panelPos.y}px)`,
          cursor: isDragging ? 'grabbing' : 'auto',
          transition: isDragging ? 'none' : 'transform 0.1s ease',
          zIndex: 20,
          position: 'absolute',
          right: '20px',
          bottom: '40px'
        }}
      >
        <div 
          className="overlay-drag-handle" 
          onMouseDown={handleDragStart}
          style={{
            height: '16px',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '12px',
            opacity: 0.5,
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--text-muted)' }} />
        </div>

        <div className="overlay-section" style={{ borderBottom: isCatExpanded ? '1px solid var(--border-color)' : 'none', paddingBottom: isCatExpanded ? '12px' : '0' }}>
          <div 
            className="overlay-title" 
            style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setIsCatExpanded(!isCatExpanded)}
          >
            <span>CATEGORIES</span>
            <span>{isCatExpanded ? '↓' : '←'}</span>
          </div>
          
          {isCatExpanded && (
            <div style={{ marginTop: '12px' }}>
              {Object.entries(CAT_COLORS).map(([cat, color]) => (
                <label key={cat} className="cat-toggle">
                  <span className="cat-dot" style={{ background: color }} />
                  <span className="cat-label">{cat}</span>
                  <span className="cat-count">{categoryCounts[cat] || 0}</span>
                  <input type="checkbox" checked={categories[cat]} onChange={() => toggleCategory(cat)} />
                  <span className="cat-check" style={{ borderColor: categories[cat] ? color : '#4a5568', background: categories[cat] ? `${color}30` : 'transparent' }}>
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

        {/* Globe Settings inside Overlay Panel */}
        {isCatExpanded && (
          <div className="overlay-section" style={{ paddingTop: '12px', marginTop: '12px' }}>
            <div className="overlay-title">GLOBE SETTINGS</div>
            
            <label className="cat-toggle" style={{ marginTop: '8px' }}>
              <span className="cat-label">Auto-Rotate Globe</span>
              <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
              <span className="cat-check" style={{ borderColor: autoRotate ? '#00f0ff' : '#4a5568', background: autoRotate ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                {autoRotate && '✓'}
              </span>
            </label>

            <label className="cat-toggle" style={{ marginTop: '8px' }}>
              <span className="cat-label">Live Satellite Feed</span>
              <input type="checkbox" checked={isGlobeSatellite} onChange={(e) => setIsGlobeSatellite(e.target.checked)} />
              <span className="cat-check" style={{ borderColor: isGlobeSatellite ? '#00f0ff' : '#4a5568', background: isGlobeSatellite ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                {isGlobeSatellite && '✓'}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="map-status-bar" style={{ zIndex: 10 }}>
        <div className="status-item">
          <span className={`status-dot ${status === 'live' ? 'live' : ''}`} />
          ⚡ {filteredMarkers.length} map points
        </div>
      </div>

      {/* Event Detail Modal (Draggable Window) */}
      {selectedEvent && (
        <EventDetailsWindow 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}
