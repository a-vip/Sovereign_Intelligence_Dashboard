'use client';
import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.markers?.length) setMarkers(data.markers);
      if (data.events?.length) setEvents(data.events);
      setStatus(data.status || 'live');
    } catch { setStatus('error'); }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, EVENTS_POLL);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const toggleCategory = (key) => setCategories(c => ({ ...c, [key]: !c[key] }));

  const filteredMarkers = markers.filter(m => categories[m.category] && m.severity >= minSeverity);
  const filteredEvents = events.filter(e => categories[e.category] && e.severity >= minSeverity);
  
  const categoryCounts = {};
  events.forEach(e => { categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1; });

  return (
    <div className="sigint-container">
      {/* Event Feed Sidebar */}
      <div className="sigint-feed">
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

      {/* Map */}
      <div className="sigint-map-area">
        <MapContainer center={[30, 35]} zoom={3} className="sigint-map" zoomControl={true} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

          {filteredMarkers.map((m, i) => (
            <CircleMarker
              key={`m-${i}`}
              center={[m.lat, m.lon]}
              radius={SEV_SIZES[m.severity] || 6}
              pathOptions={{
                color: CAT_COLORS[m.category] || '#888',
                fillColor: CAT_COLORS[m.category] || '#888',
                fillOpacity: 0.6,
                weight: 1.5,
                opacity: 0.9,
              }}
            >
              <Popup className="sigint-popup">
                <div className="popup-title" style={{ color: CAT_COLORS[m.category] }}>{m.category}</div>
                <div style={{ fontSize: 12, marginBottom: 6 }}>{m.name}</div>
                <div className="popup-row">
                  <span>Severity:</span>
                  <span style={{ color: SEV_COLORS[m.severity] }}>S{m.severity}</span>
                </div>
                {m.count > 1 && <div className="popup-row"><span>Reports:</span><span>{m.count}</span></div>}
                {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff', fontSize: 11, display: 'block', marginTop: 6 }}>Open Source →</a>}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Overlay Controls */}
        <div className="overlay-panel">
          <div className="overlay-section">
            <div className="overlay-title">CATEGORIES</div>
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
          </div>

          <div className="overlay-section">
            <div className="overlay-title">MIN. SEVERITY</div>
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
        </div>

        {/* Status Bar */}
        <div className="map-status-bar">
          <div className="status-item">
            <span className={`status-dot ${status === 'live' ? 'live' : ''}`} />
            ⚡ {filteredMarkers.length} map points
          </div>
          <div className="status-item">📰 {filteredEvents.length} articles</div>
          <div className="status-item" style={{ marginLeft: 'auto', opacity: 0.5 }}>
            AI/LAWS Intel · GDELT · Auto-refresh 60s
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}>
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div className="modal-title">{selectedEvent.title}</div>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-meta">
                <span className="modal-meta-tag" style={{ background: `${CAT_COLORS[selectedEvent.category]}20`, color: CAT_COLORS[selectedEvent.category] }}>
                  {selectedEvent.category}
                </span>
                <span className="feed-severity" style={{ background: `${SEV_COLORS[selectedEvent.severity]}25`, color: SEV_COLORS[selectedEvent.severity] }}>
                  S{selectedEvent.severity}
                </span>
                {selectedEvent.location && <span className="modal-meta-tag" style={{ background: 'rgba(255,255,255,0.05)', color: '#8892a4' }}>📍 {selectedEvent.location}</span>}
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: '#8892a4' }}>
                <div><strong>Source:</strong> {selectedEvent.source}</div>
                <div><strong>Time:</strong> {formatTime(selectedEvent.timestamp)}</div>
                {selectedEvent.url && (
                  <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff', display: 'inline-block', marginTop: 12 }}>
                    Open Source Article →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
