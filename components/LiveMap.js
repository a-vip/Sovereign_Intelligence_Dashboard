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
  const [isDayMode, setIsDayMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [geoJson, setGeoJson] = useState(null);
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

  // Fetch GeoJSON for country borders
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setGeoJson(data.features));
  }, []);

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
            globeImageUrl={isDayMode ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" : "//unpkg.com/three-globe/example/img/earth-night.jpg"}
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            showAtmosphere={true}
            atmosphereColor="#38bdf8"
            atmosphereAltitude={0.15}
            polygonsData={showBorders && geoJson ? geoJson : []}
            polygonAltitude={0.01}
            polygonCapColor={() => 'rgba(0,0,0,0)'}
            polygonSideColor={() => 'rgba(0, 240, 255, 0.2)'}
            polygonStrokeColor={() => '#475569'}
            labelsData={showBorders && geoJson ? geoJson : []}
            labelLat={d => d.properties.LABEL_Y || 0}
            labelLng={d => d.properties.LABEL_X || 0}
            labelText={d => d.properties.NAME}
            labelSize={0.8}
            labelDotRadius={0}
            labelColor={() => 'rgba(255, 255, 255, 0.8)'}
            labelResolution={2}
            htmlElementsData={filteredMarkers}
            htmlLat="lat"
            htmlLng="lon"
            htmlElement={(d) => {
              const el = document.createElement('div');
              const size = SEV_SIZES[d.severity] * 1.5;
              const color = CAT_COLORS[d.category] || '#888';
              
              el.innerHTML = `
                <div style="
                  width: ${size}px; 
                  height: ${size}px; 
                  background: ${color}; 
                  border-radius: 50%; 
                  box-shadow: 0 0 ${size * 2}px ${color}, 0 0 ${size}px #fff;
                  cursor: pointer;
                  pointer-events: auto;
                  transform: translate(-50%, -50%);
                " class="globe-dot"></div>
              `;
              
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
              <span className="cat-label">Daylight Satellite Mode</span>
              <input type="checkbox" checked={isDayMode} onChange={(e) => setIsDayMode(e.target.checked)} />
              <span className="cat-check" style={{ borderColor: isDayMode ? '#00f0ff' : '#4a5568', background: isDayMode ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                {isDayMode && '✓'}
              </span>
            </label>

            <label className="cat-toggle" style={{ marginTop: '8px' }}>
              <span className="cat-label">Show Geo Borders</span>
              <input type="checkbox" checked={showBorders} onChange={(e) => setShowBorders(e.target.checked)} />
              <span className="cat-check" style={{ borderColor: showBorders ? '#00f0ff' : '#4a5568', background: showBorders ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                {showBorders && '✓'}
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
