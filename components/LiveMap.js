'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import EventDetailsWindow from './EventDetailsWindow';

const EVENTS_POLL = 15000; // Increased frequency (15s)

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
  const [showGeoDetails, setShowGeoDetails] = useState(false); // Unified Toggle, OFF by default
  const [lowPowerMode, setLowPowerMode] = useState(true); 
  const [timeRange, setTimeRange] = useState('today'); 
  const [isVisible, setIsVisible] = useState(true);
  const [geoJson, setGeoJson] = useState(null);
  const [citiesJson, setCitiesJson] = useState(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [showAtmosphere, setShowAtmosphere] = useState(false); // OFF by default
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [feedType, setFeedType] = useState('live'); // 'live' or 'reports'
  const [GlobeComponent, setGlobeComponent] = useState(null);
  const globeEl = useRef();
  const [isMobile, setIsMobile] = useState(false);
  const [globeDimensions, setGlobeDimensions] = useState({ width: 600, height: 600 });
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

  // Handle dynamic map area resizing using ResizeObserver
  useEffect(() => {
    if (!mapAreaRef.current) return;
    const updateDimensions = () => {
      const rect = mapAreaRef.current.getBoundingClientRect();
      setGlobeDimensions({
        width: Math.floor(rect.width) || 600,
        height: Math.floor(rect.height) || 450
      });
    };
    
    updateDimensions();
    
    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(mapAreaRef.current);
    
    return () => observer.disconnect();
  }, [mapAreaRef]);

  // Toggle ambient glow removed for performance
  useEffect(() => {
    // Clean up if somehow still there
    document.body.classList.remove('ambient-glow');
  }, []);

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
  }, [isInitializing, eventQueue.length, isVisible]);

  // Fetch GeoJSON for country borders (deferred to avoid blocking initial render)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fetch countries
      fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
        .then(res => res.json())
        .then(data => setGeoJson(data.features))
        .catch(() => {});

      // Fetch cities (simple version)
      fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_populated_places_simple.geojson')
        .then(res => res.json())
        .then(data => setCitiesJson(data.features))
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, EVENTS_POLL);
    return () => clearInterval(interval);
  }, [fetchEvents, timeRange]); // Refetch when timeRange changes

  // 8-second tick to pop from queue
  const tickCounter = useRef(0);
  useEffect(() => {
    if (isInitializing || eventQueue.length === 0 || !isVisible) return; // Pause if hidden
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
          return updated.length > 30 ? updated.slice(0, 30) : updated; // Limited to 30 for performance
        });
        // Trigger glow pulse on new event
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 2000);

        return newQueue;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [isInitializing, eventQueue.length, isVisible]);

  // Globe Auto-Rotate configuration
  useEffect(() => {
    if (!globeEl.current || !globeReady) return;
    try {
      const controls = globeEl.current.controls();
      controls.autoRotate = autoRotate && isVisible; // Pause rotation if hidden
      controls.autoRotateSpeed = 0.4;
      const onInteraction = () => setAutoRotate(false);
      controls.addEventListener('start', onInteraction);
      return () => controls.removeEventListener('start', onInteraction);
    } catch {}
  }, [autoRotate, globeReady, isVisible]);

  const toggleCategory = (key) => setCategories(c => ({ ...c, [key]: !c[key] }));

  // Memoize filtered data to prevent unnecessary re-renders
  // ALL points that come up should remain on the map
  const displayedMarkers = useMemo(() => {
    return markers.filter(m => categories[m.category] && m.severity >= minSeverity);
  }, [markers, categories, minSeverity]);

  const filteredEvents = useMemo(() => {
    let activeCategories = Object.keys(categories).filter(c => categories[c]);
    let filtered = displayedEvents.filter(e => {
      if (feedType === 'live') return !e.curated && !e.details?.isResearch && (e.severity < 4 || !e.source?.includes('Reuters')); 
      return e.curated || e.details?.isResearch || e.severity >= 4 || e.source?.includes('Reuters') || e.source?.includes('Guardian');
    });
    
    if (activeCategories.length > 0) {
      filtered = filtered.filter(e => activeCategories.includes(e.category));
    }
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [displayedEvents, categories, feedType, minSeverity]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    displayedEvents.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
  }, [displayedEvents]);

  // Memoize label data to avoid recalculating on every render
  const labelData = useMemo(() => {
    if (!showGeoDetails) return [];
    
    const labels = [];
    
    // Add countries
    if (geoJson) {
      geoJson.forEach(f => {
        const { bbox, properties } = f;
        let lat = properties?.LABEL_Y;
        let lon = properties?.LABEL_X;
        
        if (!lat && bbox) {
          lat = (bbox[1] + bbox[3]) / 2;
          lon = (bbox[0] + bbox[2]) / 2;
        }
        
        if (lat) {
          labels.push({
            lat,
            lon,
            text: properties.NAME,
            size: 1.2,
            color: 'rgba(255, 255, 255, 0.85)',
            type: 'country'
          });
        }
      });
    }

    // Add cities
    if (citiesJson) {
      citiesJson.forEach(f => {
        const { geometry, properties } = f;
        if (geometry.type === 'Point') {
          labels.push({
            lat: geometry.coordinates[1],
            lon: geometry.coordinates[0],
            text: properties.NAME,
            size: 0.6,
            color: 'rgba(200, 240, 255, 0.6)',
            type: 'city'
          });
        }
      });
    }
    
    return labels;
  }, [showGeoDetails, geoJson, citiesJson]);

  // Stable callback for htmlElement — avoids creating closures on every render
  const createMarkerElement = useCallback((d) => {
    const el = document.createElement('div');
    const color = SEV_COLORS[d.severity] || '#94a3b8';
    const size = Math.min(8 + d.severity * 2, 18);

    el.innerHTML = `<div style="
      width:${size}px;height:${size}px;background:${color};border-radius:50%;
      box-shadow:0 0 ${size}px ${color};cursor:pointer;pointer-events:auto;
      transform:translate(-50%,-50%);
    " class="globe-dot"></div>`;

    el.onclick = (e) => {
      e.stopPropagation();
      const fullEvent = displayedEvents.find(ev => ev.id === d.id || ev.title === d.name);
      setSelectedEvent(fullEvent || d);
    };
    
    return el;
  }, [displayedEvents]);

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

      {/* 3D Globe Area */}
      <div ref={mapAreaRef} className="sigint-map-area">
        {GlobeComponent && (
          <GlobeComponent
            ref={globeEl}
            width={globeDimensions.width}
            height={globeDimensions.height}
            onGlobeReady={() => setGlobeReady(true)}
            globeImageUrl={isDayMode
              ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              : "//unpkg.com/three-globe/example/img/earth-night.jpg"
            }
            bumpImageUrl={lowPowerMode ? null : "//unpkg.com/three-globe/example/img/earth-topology.png"}
            backgroundImageUrl={lowPowerMode ? null : "//unpkg.com/three-globe/example/img/night-sky.png"}
            showAtmosphere={showAtmosphere && !lowPowerMode}
            atmosphereColor="#38bdf8"
            atmosphereAltitude={0.12}
            polygonsData={showGeoDetails && !lowPowerMode && geoJson ? geoJson : []}
            polygonAltitude={0.006}
            polygonCapColor={() => 'rgba(0,0,0,0)'}
            polygonSideColor={() => 'rgba(0, 240, 255, 0.08)'}
            polygonStrokeColor={() => '#475569'}
            labelsData={showGeoDetails ? labelData : []}
            labelLat={d => d.lat}
            labelLng={d => d.lon}
            labelText={d => d.text}
            labelSize={d => d.size}
            labelDotRadius={d => d.type === 'city' ? 0.1 : 0}
            labelColor={d => d.color}
            labelResolution={2}
            htmlElementsData={displayedMarkers}
            htmlLat="lat"
            htmlLng="lon"
            htmlElement={createMarkerElement}
          />
        )}
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
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            marginBottom: '8px', opacity: 0.5, paddingBottom: '4px',
            borderBottom: '1px solid var(--border-color)',
            position: 'relative'
          }}
        >
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--text-muted)' }} />
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            style={{ 
              position: 'absolute', right: '4px', top: '2px', background: 'none', border: 'none', 
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '10px' 
            }}
          >
            {isMinimized ? '▢' : '—'}
          </button>
        </div>

        {!isMinimized ? (
          <>
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

            <div className="overlay-section" style={{ paddingTop: '12px', marginTop: '12px' }}>
              <div className="overlay-title">VISUALS</div>

              <label className="cat-toggle" style={{ marginTop: '8px' }}>
                <span className="cat-label">Map Details</span>
                <input type="checkbox" checked={showGeoDetails} onChange={(e) => setShowGeoDetails(e.target.checked)} />
                <span className="cat-check" style={{ borderColor: showGeoDetails ? '#00f0ff' : '#4a5568', background: showGeoDetails ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                  {showGeoDetails && '✓'}
                </span>
              </label>

              <label className="cat-toggle" style={{ marginTop: '8px' }}>
                <span className="cat-label">Atmosphere</span>
                <input type="checkbox" checked={showAtmosphere} onChange={(e) => setShowAtmosphere(e.target.checked)} />
                <span className="cat-check" style={{ borderColor: showAtmosphere ? '#00f0ff' : '#4a5568', background: showAtmosphere ? 'rgba(0,240,255,0.2)' : 'transparent' }}>
                  {showAtmosphere && '✓'}
                </span>
              </label>

              <div className="overlay-title" style={{ marginTop: '16px' }}>PERFORMANCE</div>
              <label className="cat-toggle" style={{ marginTop: '8px' }}>
                <span className="cat-label" style={{ color: lowPowerMode ? '#facc15' : 'inherit' }}>Low Power Mode</span>
                <input type="checkbox" checked={lowPowerMode} onChange={(e) => setLowPowerMode(e.target.checked)} />
                <span className="cat-check" style={{ borderColor: lowPowerMode ? '#facc15' : '#4a5568', background: lowPowerMode ? 'rgba(250,204,21,0.2)' : 'transparent' }}>
                  {lowPowerMode && '✓'}
                </span>
              </label>
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
        <div className="status-item" style={{ marginLeft: 'auto' }}>
          DATABASE SYNC: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Event Detail Modal (Draggable Window) */}
      {selectedEvent && (
        <EventDetailsWindow
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      {/* Event Details Panel (Monitor-the-Situation style) */}
      {selectedEvent && (
        <div className="event-details-panel">
          <div className="details-header">
            <div className="details-sev" style={{ backgroundColor: SEV_COLORS[selectedEvent.severity] }}>
              S{selectedEvent.severity}
            </div>
            <button className="details-close" onClick={() => setSelectedEvent(null)}>×</button>
          </div>
          
          {selectedEvent.details?.media && (
            <div className="details-media">
              <img src={selectedEvent.details.media} alt="Intelligence Media" />
            </div>
          )}
          
          <div className="details-content">
            <div className="details-category">{selectedEvent.category}</div>
            <h3 className="details-title">{selectedEvent.title || selectedEvent.name}</h3>
            
            {selectedEvent.details?.probability && (
              <div className="details-forecast">
                <div className="forecast-label">Escalation Probability</div>
                <div className="forecast-bar">
                  <div className="forecast-fill" style={{ width: `${selectedEvent.details.probability}%` }} />
                </div>
                <div className="forecast-value">{selectedEvent.details.probability}%</div>
              </div>
            )}
            
            <div className="details-meta">
              <span>Location: {selectedEvent.location || 'Global / OSINT'}</span>
              <span>•</span>
              <span>Source: {selectedEvent.source || 'Primary Intel'}</span>
              <span>•</span>
              <span>{new Date(selectedEvent.timestamp).toLocaleTimeString()}</span>
            </div>
            
            {selectedEvent.url && (
              <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer" className="details-link">
                View Original Signal
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
