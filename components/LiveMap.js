'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import EventDetailsWindow from './EventDetailsWindow';

const EVENTS_POLL = 60000;

const CAT_COLORS = {
  Conflict: '#ff2d55',
  Political: '#a855f7',
  Humanitarian: '#22c55e',
  Economic: '#facc15',
  Disaster: '#ff6b35',
};

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };

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
  const [categories, setCategories] = useState({ Conflict: true, Political: true, Humanitarian: true, Economic: true, Disaster: true });
  const [minSeverity, setMinSeverity] = useState(1);
  const [status, setStatus] = useState('loading');
  const [feedTab, setFeedTab] = useState('feed');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Globe Settings
  const [isDayMode, setIsDayMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [showLabels, setShowLabels] = useState(false); // OFF by default for performance
  const [geoJson, setGeoJson] = useState(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [GlobeComponent, setGlobeComponent] = useState(null);
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

  // Lazy-load Globe component after mount (avoids SSR and double-import issues)
  useEffect(() => {
    let cancelled = false;
    import('react-globe.gl').then(mod => {
      if (!cancelled) setGlobeComponent(() => mod.default);
    });
    return () => { cancelled = true; };
  }, []);

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
      }
      setStatus(data.status || 'live');
    } catch { setStatus('error'); }
  }, [isInitializing, eventQueue.length]);

  // Fetch GeoJSON for country borders (deferred to avoid blocking initial render)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
        .then(res => res.json())
        .then(data => setGeoJson(data.features))
        .catch(() => {}); // silently fail — borders are optional
    }, 3000); // defer 3s so globe loads first
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, EVENTS_POLL);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // 8-second tick to pop from queue
  const tickCounter = useRef(0);
  useEffect(() => {
    if (isInitializing || eventQueue.length === 0) return;
    const interval = setInterval(() => {
      setEventQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;
        const nextEvent = prevQueue[0];
        const newQueue = prevQueue.slice(1);
        tickCounter.current += 1;
        // Stamp a unique display key so React never sees duplicate keys
        const displayCopy = { ...nextEvent, _displayKey: `${nextEvent.id}-t${tickCounter.current}` };
        setDisplayedEvents((prevDisplay) => {
          // Check if we already have this event ID in the display to avoid duplicates
          if (prevDisplay.some(e => e.id === nextEvent.id)) return prevDisplay;
          
          const updated = [displayCopy, ...prevDisplay];
          return updated.length > 50 ? updated.slice(0, 50) : updated;
        });
        return newQueue;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [isInitializing, eventQueue.length]);

  // Globe Auto-Rotate configuration
  useEffect(() => {
    if (!globeEl.current || !globeReady) return;
    try {
      const controls = globeEl.current.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.4;
      const onInteraction = () => setAutoRotate(false);
      controls.addEventListener('start', onInteraction);
      return () => controls.removeEventListener('start', onInteraction);
    } catch {}
  }, [autoRotate, globeReady]);

  const toggleCategory = (key) => setCategories(c => ({ ...c, [key]: !c[key] }));

  // Memoize filtered data to prevent unnecessary re-renders
  const displayedMarkers = useMemo(() =>
    markers.filter(m =>
      displayedEvents.some(e => e.title === m.name || e.id?.replace('ev', 'geo') === m.id)
    ), [markers, displayedEvents]
  );

  const filteredMarkers = useMemo(() =>
    displayedMarkers.filter(m => categories[m.category] && m.severity >= minSeverity),
    [displayedMarkers, categories, minSeverity]
  );

  const filteredEvents = useMemo(() =>
    displayedEvents.filter(e => categories[e.category] && e.severity >= minSeverity),
    [displayedEvents, categories, minSeverity]
  );

  const categoryCounts = useMemo(() => {
    const counts = {};
    displayedEvents.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
  }, [displayedEvents]);

  // Memoize label data to avoid recalculating on every render
  const labelData = useMemo(() => {
    if (!showLabels || !geoJson) return [];
    return geoJson.filter(f => f.properties?.LABEL_Y && f.properties?.LABEL_X);
  }, [showLabels, geoJson]);

  // Stable callback for htmlElement — avoids creating closures on every render
  const createMarkerElement = useCallback((d) => {
    const el = document.createElement('div');
    const color = CAT_COLORS[d.category] || '#888';
    const size = Math.min(6 + d.severity * 2, 16);

    el.innerHTML = `<div style="
      width:${size}px;height:${size}px;background:${color};border-radius:50%;
      box-shadow:0 0 ${size}px ${color};cursor:pointer;pointer-events:auto;
      transform:translate(-50%,-50%);
    " class="globe-dot"></div>`;

    el.onclick = () => {
      const fullEvent = displayedEvents.find(e => e.title === d.name || e.id?.replace('ev', 'geo') === d.id) || d;
      setSelectedEvent(fullEvent);
    };
    return el;
  }, [displayedEvents]);

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
          {filteredEvents.map((ev, idx) => (
            <div key={ev._displayKey || `${ev.id}-${idx}`} className="feed-item" onClick={() => setSelectedEvent(ev)}>
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
      <div className="sigint-map-area" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#080c12' }}>
        {GlobeComponent && (
          <GlobeComponent
            ref={globeEl}
            onGlobeReady={() => setGlobeReady(true)}
            globeImageUrl={isDayMode
              ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              : "//unpkg.com/three-globe/example/img/earth-night.jpg"
            }
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            showAtmosphere={true}
            atmosphereColor="#38bdf8"
            atmosphereAltitude={0.12}
            polygonsData={showBorders && geoJson ? geoJson : []}
            polygonAltitude={0.006}
            polygonCapColor={() => 'rgba(0,0,0,0)'}
            polygonSideColor={() => 'rgba(0, 240, 255, 0.08)'}
            polygonStrokeColor={() => '#475569'}
            labelsData={labelData}
            labelLat={d => d.properties.LABEL_Y}
            labelLng={d => d.properties.LABEL_X}
            labelText={d => d.properties.NAME}
            labelSize={0.6}
            labelDotRadius={0}
            labelColor={() => 'rgba(200, 220, 255, 0.6)'}
            labelResolution={1}
            htmlElementsData={filteredMarkers}
            htmlLat="lat"
            htmlLng="lon"
            htmlElement={createMarkerElement}
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
          zIndex: 20, position: 'absolute', right: '20px', bottom: '40px'
        }}
      >
        <div
          className="overlay-drag-handle"
          onMouseDown={handleDragStart}
          style={{
            height: '16px', cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            marginBottom: '12px', opacity: 0.5, paddingBottom: '8px',
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
            <span>{isCatExpanded ? '▾' : '◂'}</span>
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
              <span className="cat-label">Auto-Rotate</span>
              <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
              <span className="cat-check" style={{ borderColor: autoRotate ? '#00f0ff' : '#4a5568', background: autoRotate ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                {autoRotate && '✓'}
              </span>
            </label>

            <label className="cat-toggle" style={{ marginTop: '8px' }}>
              <span className="cat-label">Daylight Mode</span>
              <input type="checkbox" checked={isDayMode} onChange={(e) => setIsDayMode(e.target.checked)} />
              <span className="cat-check" style={{ borderColor: isDayMode ? '#00f0ff' : '#4a5568', background: isDayMode ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                {isDayMode && '✓'}
              </span>
            </label>

            <label className="cat-toggle" style={{ marginTop: '8px' }}>
              <span className="cat-label">Geo Borders</span>
              <input type="checkbox" checked={showBorders} onChange={(e) => setShowBorders(e.target.checked)} />
              <span className="cat-check" style={{ borderColor: showBorders ? '#00f0ff' : '#4a5568', background: showBorders ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                {showBorders && '✓'}
              </span>
            </label>

            <label className="cat-toggle" style={{ marginTop: '8px' }}>
              <span className="cat-label">Country Names</span>
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
              <span className="cat-check" style={{ borderColor: showLabels ? '#00f0ff' : '#4a5568', background: showLabels ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                {showLabels && '✓'}
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
