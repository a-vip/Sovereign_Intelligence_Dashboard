'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Check, X, Search, Loader2, Save, MapPin } from 'lucide-react';

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

export default function EventDetailsWindow({ event, onClose, onReportIssue, currentUser, onEventUpdate, onFocusLocation }) {
  // Self-healing: read session from localStorage as a reliable fallback in case the prop is stale
  const [activeUser, setActiveUser] = useState(() => {
    // Merge prop with localStorage — localStorage is always the ground truth
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('operator_session') : null;
      const parsed = stored ? JSON.parse(stored) : null;
      // Use prop if it has admin role, else fall back to localStorage
      if (currentUser?.role === 'admin' || currentUser?.email === 'workwithavip@gmail.com') return currentUser;
      if (parsed?.role === 'admin' || parsed?.email === 'workwithavip@gmail.com') return parsed;
      return currentUser || parsed;
    } catch (e) {
      return currentUser;
    }
  });

  // Keep activeUser synced if the prop updates after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('operator_session');
      const parsed = stored ? JSON.parse(stored) : null;
      if (currentUser?.role === 'admin' || currentUser?.email === 'workwithavip@gmail.com') {
        setActiveUser(currentUser);
      } else if (parsed?.role === 'admin' || parsed?.email === 'workwithavip@gmail.com') {
        setActiveUser(parsed);
      } else {
        setActiveUser(currentUser || parsed);
      }
    } catch (e) {
      setActiveUser(currentUser);
    }
  }, [currentUser]);

  // Bulletproof, self-healing administrator check
  const getIsAdmin = () => {
    if (currentUser?.email === 'workwithavip@gmail.com' || currentUser?.role === 'admin') {
      return true;
    }
    if (activeUser?.email === 'workwithavip@gmail.com' || activeUser?.role === 'admin') {
      return true;
    }
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('operator_session');
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed?.email === 'workwithavip@gmail.com' || parsed?.role === 'admin') {
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  const isAdmin = getIsAdmin();
  console.log('[EventDetailsWindow] activeUser:', activeUser?.email, 'role:', activeUser?.role, 'isAdmin:', isAdmin);
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 200, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Accordion state
  const [expandedSection, setExpandedSection] = useState('summary');

  // Self-Healing Link Verification State
  const [currentUrl, setCurrentUrl] = useState(event.url);
  const [verificationStatus, setVerificationStatus] = useState('checking'); // 'checking', 'active', 'healed', 'broken'
  const [verificationMessage, setVerificationMessage] = useState('Verifying source link integrity...');

  // Admin Override States
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleEditMode = () => {
    if (!editMode) {
      setEditMode(true);
      setExpandedSection('summary');
    } else {
      setEditMode(false);
    }
  };
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [editDraft, setEditDraft] = useState({
    category: event.category,
    severity: event.severity,
    title: event.title,
    location: event.location,
    lat: event.lat,
    lon: event.lon,
    source: event.source,
    url: event.url,
    summary: event.details?.summary || event.summary || ''
  });

  useEffect(() => {
    // Reset state on event change
    setCurrentUrl(event.url);
    
    const cachedStatus = event.url ? (event.details?.verificationStatus || 'checking') : 'broken';
    setVerificationStatus(cachedStatus);
    
    const cachedMessage = !event.url 
      ? 'No external source link provided.'
      : cachedStatus === 'active'
      ? 'Source link verified active and authentic (served from database cache).'
      : cachedStatus === 'healed'
      ? 'Broken link healed! Verified alternative press wire found (served from database cache).'
      : cachedStatus === 'broken'
      ? 'Primary source link is dead (404/broken).'
      : 'Verifying source link integrity...';
      
    setVerificationMessage(cachedMessage);

    setEditDraft({
      category: event.category,
      severity: event.severity,
      title: event.title,
      location: event.location,
      lat: event.lat,
      lon: event.lon,
      source: event.source,
      url: event.url,
      summary: event.details?.summary || event.summary || ''
    });
    setEditMode(false);
    setAddressQuery('');
    setSuggestions([]);

    if (!event.url || cachedStatus === 'active' || cachedStatus === 'healed' || cachedStatus === 'broken') {
      return;
    }

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
          setEditDraft(prev => ({ ...prev, url: data.url }));
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

  // Debounced Nominatim suggestion search
  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&addressdetails=1&limit=6`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Sovereign-Intelligence-Dashboard/1.0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Nominatim suggestion fetch failed:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [addressQuery]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const isRss = event.details?.isRssItem;
      const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
      
      const payload = isRss 
        ? {
            id: event.id,
            title: editDraft.title,
            category: editDraft.category,
            severity: parseInt(editDraft.severity),
            location: editDraft.location,
            latitude: parseFloat(editDraft.lat),
            longitude: parseFloat(editDraft.lon),
            source: editDraft.source,
            summary: editDraft.summary
          }
        : {
            id: event.id,
            title: editDraft.title,
            category: editDraft.category,
            severity: parseInt(editDraft.severity),
            location: editDraft.location,
            lat: parseFloat(editDraft.lat),
            lon: parseFloat(editDraft.lon),
            url: editDraft.url,
            summary: editDraft.summary
          };

      let userId = activeUser?.id || currentUser?.id;
      if (!userId) {
        try {
          const stored = localStorage.getItem('operator_session');
          const parsed = stored ? JSON.parse(stored) : null;
          userId = parsed?.id;
        } catch (e) {}
      }
      if (!userId && (currentUser?.email === 'workwithavip@gmail.com' || activeUser?.email === 'workwithavip@gmail.com')) {
        userId = '9f7de0af-d4fe-4801-b595-b81b8d9bf48e';
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'x-user-id': userId || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server rejected intel commit protocol.');
      }

      const data = await res.json();
      
      const savedEvent = {
        ...event,
        title: editDraft.title,
        category: editDraft.category,
        severity: parseInt(editDraft.severity),
        location: editDraft.location,
        lat: parseFloat(editDraft.lat),
        lon: parseFloat(editDraft.lon),
        source: editDraft.source,
        url: editDraft.url,
        details: {
          ...event.details,
          summary: editDraft.summary
        }
      };

      if (onEventUpdate) {
        onEventUpdate(savedEvent);
      }
      
      window.dispatchEvent(new CustomEvent('event_updated', { detail: savedEvent }));
      setEditMode(false);

    } catch (error) {
      console.error("Intel commit failed:", error);
      alert(`Intel modification failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveEvent = async () => {
    const isRss = event.details?.isRssItem;
    const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
    
    let userId = activeUser?.id || currentUser?.id;
    if (!userId) {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('operator_session') : null;
        const parsed = stored ? JSON.parse(stored) : null;
        userId = parsed?.id;
      } catch (e) {}
    }
    if (!userId && (currentUser?.email === 'workwithavip@gmail.com' || activeUser?.email === 'workwithavip@gmail.com')) {
      userId = '9f7de0af-d4fe-4801-b595-b81b8d9bf48e';
    }

    if (!confirm('Are you sure you want to permanently remove this point from the map?')) {
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: event.id })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server rejected removal protocol.');
      }

      window.dispatchEvent(new CustomEvent('event_updated', { detail: { id: event.id, archived: true } }));
      onClose();
    } catch (error) {
      console.error("Removal failed:", error);
      alert(`Removal failed: ${error.message}`);
    }
  };

  const hasChanges = 
    editDraft.category !== event.category ||
    editDraft.severity !== event.severity ||
    editDraft.title !== event.title ||
    editDraft.location !== event.location ||
    editDraft.lat !== event.lat ||
    editDraft.lon !== event.lon ||
    editDraft.source !== event.source ||
    editDraft.url !== event.url ||
    editDraft.summary !== (event.details?.summary || event.summary || '');

  const catColor = CAT_COLORS[editDraft.category] || '#38bdf8';
  const sevColor = SEV_COLORS[editDraft.severity] || '#38bdf8';

  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    // Don't drag if user is typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }
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

  const REG_COLORS = {
    'In effect': '#22c55e',
    'Passed': '#38bdf8',
    'Proposed': '#facc15',
    'Policy': '#a855f7'
  };

  if (event.isAiRegulation) {
    const statusColor = REG_COLORS[event.status] || '#a855f7';
    
    return (
      <div 
        className="details-window"
        style={{
          position: 'fixed',
          left: 0, top: 0,
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          width: '400px',
          maxHeight: 'calc(100vh - 120px)',
          backgroundColor: '#0c0f17',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 15px rgba(168, 85, 247, 0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'monospace'
        }}
      >
        {/* Top Border */}
        <div style={{ height: '3px', width: '100%', backgroundColor: '#a855f7', boxShadow: '0 0 10px #a855f7' }} />

        {isAdmin && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.12) 0%, rgba(12, 15, 23, 0.95) 100%)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
            padding: '6px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.65rem', fontWeight: 'bold', color: '#a855f7', letterSpacing: '1px', fontFamily: 'monospace'
          }}>
            <span>🔐 OPERATOR OVERRIDE ACTIVE</span>
            <button 
              onClick={handleArchiveEvent} 
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'monospace',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            >
              🗑️ REMOVE FROM MAP
            </button>
          </div>
        )}

        {/* Drag Handle & Header */}
        <div
          onMouseDown={handleDragStart}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.12) 0%, rgba(12, 15, 23, 0.95) 100%)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
            cursor: 'grab'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#a855f7', letterSpacing: '1.5px' }}>
            ⚖️ SIGINT://AI_REGULATION
          </span>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(168, 85, 247, 0.65)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(168, 85, 247, 0.65)'}
          >
            <X size={14} />
          </button>
        </div>

        {/* Main Content Area */}
        <div 
          className="details-window-scroll ai-regulation-scroll"
          style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '14px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          
          {/* Title */}
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: '700',
              color: '#f3f4f6',
              lineHeight: '1.4',
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-main)'
            }}>
              {event.title}
            </h3>
          </div>

          {/* Badges Row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Status Badge */}
            <span style={{
              fontSize: '9px',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: `${statusColor}22`,
              border: `1px solid ${statusColor}55`,
              color: statusColor,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              STATUS: {event.status}
            </span>
            {/* Area Badge */}
            <span style={{
              fontSize: '9px',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              FOCUS: {event.area}
            </span>
          </div>

          {/* Metadata Table */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            border: '1px solid rgba(168, 85, 247, 0.15)',
            borderRadius: '6px',
            padding: '10px 12px'
          }}>
            {/* Jurisdiction */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
              <span style={{ color: 'rgba(168, 85, 247, 0.85)', fontWeight: 'bold' }}>JURISDICTION</span>
              <span style={{ color: '#e2e8f0', textAlign: 'right' }}>{event.jurisdiction}</span>
            </div>
            
            {/* Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
              <span style={{ color: 'rgba(168, 85, 247, 0.85)', fontWeight: 'bold' }}>EFFECTIVE/PROPOSED DATE</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{event.date}</span>
            </div>

            {/* Coordinates */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
              <span style={{ color: 'rgba(168, 85, 247, 0.85)', fontWeight: 'bold' }}>TARGET COORDINATES</span>
              <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                {typeof event.lat === 'number' ? event.lat.toFixed(4) : event.lat}°N, {typeof event.lon === 'number' ? event.lon.toFixed(4) : event.lon}°E
              </span>
            </div>
          </div>

          {/* Description Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '9.5px', fontWeight: '800', color: 'rgba(168, 85, 247, 0.85)', letterSpacing: '0.5px' }}>
              TACTICAL INTEL / SUMMARY:
            </span>
            <div style={{
              backgroundColor: 'rgba(2, 6, 23, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '11px',
              lineHeight: '1.6',
              color: '#d1d5db',
              maxHeight: '150px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-main)',
              scrollbarWidth: 'thin'
            }}>
              {event.description}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '9px',
          color: '#64748b'
        }}>
          <span>SOURCE: ASENION TRACKER</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} style={{ color: '#a855f7' }} />
            <span>GEOLOCATED CAPITAL</span>
          </div>
        </div>
      </div>
    );
  }

  const summary = event.details?.summary || `Intelligence report regarding: ${event.title}. This event has been flagged under the ${event.category} category with a severity level of ${event.severity}. Open Source Intelligence gathering indicates potential implications for regional stability and policy frameworks.`;

  return (
    <div 
      className="details-window"
      style={{
        position: 'fixed',
        left: 0, top: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        width: '400px',
        maxHeight: 'calc(100vh - 120px)',
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
      <div style={{ height: '3px', width: '100%', backgroundColor: isAdmin ? '#00f0ff' : catColor }} />

      {/* Admin Override Banner */}
      {isAdmin && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.12) 0%, rgba(15, 20, 30, 0.4) 100%)',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          color: '#00f0ff',
          letterSpacing: '1px',
          fontFamily: 'monospace'
        }}>
          <span>🔐 OPERATOR OVERRIDE ACTIVE</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleToggleEditMode}
              style={{
                background: editMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 240, 255, 0.2)',
                color: editMode ? '#ef4444' : '#00f0ff',
                border: `1px solid ${editMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 240, 255, 0.4)'}`,
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                fontFamily: 'monospace',
                boxShadow: editMode ? '0 0 8px rgba(239, 68, 68, 0.2)' : '0 0 8px rgba(0, 240, 255, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = editMode ? 'rgba(239, 68, 68, 0.35)' : 'rgba(0, 240, 255, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = editMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 240, 255, 0.2)';
              }}
            >
              {editMode ? '✕ EXIT EDIT MODE' : '✏️ ENTER EDIT MODE'}
            </button>
            <button
              onClick={handleArchiveEvent}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                fontFamily: 'monospace',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
            >
              🗑️ REMOVE FROM MAP
            </button>
          </div>
        </div>
      )}

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
           <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px', color: event.details?.isRssItem ? '#00f0ff' : '#64748b' }}>
             {event.details?.isRssItem ? 'SIGINT://OSINT_FEED' : 'SIGINT://DETAILS'}
           </span>
           <span style={{ fontSize: '0.7rem', color: '#334155' }}>|</span>
           <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', fontFamily: "var(--font-jetbrains-fallback)" }}>{event.id?.substring(0, 8).toUpperCase()}</span>
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

      <div className="details-window-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px' }}>
        {/* Badges & Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {editMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 'bold' }}>CATEGORY</label>
                  <select 
                    value={editDraft.category} 
                    onChange={(e) => {
                      setEditDraft(prev => ({ ...prev, category: e.target.value }));
                    }}
                    style={{
                      background: '#0f141e',
                      color: '#00f0ff',
                      border: '1px solid #1e293b',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '4px 6px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {Object.keys(CAT_COLORS).map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 'bold' }}>SEVERITY</label>
                  <select 
                    value={editDraft.severity} 
                    onChange={(e) => {
                      setEditDraft(prev => ({ ...prev, severity: parseInt(e.target.value) }));
                    }}
                    style={{
                      background: '#0f141e',
                      color: '#00f0ff',
                      border: '1px solid #1e293b',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '4px 6px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {[1, 2, 3, 4, 5].map(sev => (
                      <option key={sev} value={sev}>SEV-{sev}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <span 
                  onClick={() => isAdmin && handleToggleEditMode()}
                  style={{ 
                    background: `${catColor}20`, 
                    color: catColor, 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.65rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase',
                    cursor: isAdmin ? 'pointer' : 'default',
                    border: '1px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'border 0.2s'
                  }}
                  title={isAdmin ? "Click to enter Edit Mode" : undefined}
                >
                  {editDraft.category}
                </span>

                <span 
                  onClick={() => isAdmin && handleToggleEditMode()}
                  style={{ 
                    background: `${sevColor}20`, 
                    color: sevColor, 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.65rem', 
                    fontWeight: 800,
                    cursor: isAdmin ? 'pointer' : 'default',
                    border: '1px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'border 0.2s'
                  }}
                  title={isAdmin ? "Click to enter Edit Mode" : undefined}
                >
                  SEV-{editDraft.severity}
                </span>
              </>
            )}
          </div>
          <span style={{ color: '#475569', fontSize: '0.7rem', fontFamily: "var(--font-jetbrains-fallback)" }}>
            {formatTime(event.timestamp)}
          </span>
        </div>

        {/* Title */}
        {editMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Event Title
            </label>
            <input 
              type="text"
              value={editDraft.title}
              onChange={(e) => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
              style={{
                background: '#151b26',
                color: '#f8fafc',
                border: '1px solid #1e293b',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '0.95rem',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
        ) : (
          <h2 
            onClick={() => isAdmin && handleToggleEditMode()}
            style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              color: '#f8fafc', 
              lineHeight: 1.4, 
              marginBottom: '20px',
              cursor: isAdmin ? 'pointer' : 'default',
              padding: isAdmin ? '4px' : '0',
              borderRadius: '4px',
              border: isAdmin ? '1px dashed rgba(0, 240, 255, 0.15)' : 'none',
              position: 'relative',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (isAdmin) e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              if (isAdmin) e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.15)';
            }}
            title={isAdmin ? "Click to enter Edit Mode" : undefined}
          >
            {editDraft.title}
            {isAdmin && (
              <span style={{ position: 'absolute', right: '4px', top: '4px', color: '#64748b' }}>
                <Edit3 size={10} />
              </span>
            )}
          </h2>
        )}

        {/* Location Display & Address Searchbox with Autocomplete */}
        {editMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', position: 'relative' }}>
            {/* Direct Location Name Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📍 Location Name
              </label>
              <input 
                type="text"
                value={editDraft.location || ''}
                onChange={(e) => setEditDraft(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Geneva, Switzerland or custom text"
                style={{
                  background: '#151b26',
                  color: '#f8fafc',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Direct Latitude & Longitude Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Latitude
                </label>
                <input 
                  type="number"
                  step="any"
                  value={editDraft.lat !== undefined && editDraft.lat !== null ? editDraft.lat : ''}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, lat: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                  placeholder="e.g. 46.2044"
                  style={{
                    background: '#151b26',
                    color: '#f8fafc',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Longitude
                </label>
                <input 
                  type="number"
                  step="any"
                  value={editDraft.lon !== undefined && editDraft.lon !== null ? editDraft.lon : ''}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, lon: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                  placeholder="e.g. 6.1432"
                  style={{
                    background: '#151b26',
                    color: '#f8fafc',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Geocode Search Helper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', position: 'relative' }}>
              <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🔍 Geocode Search Helper (OSM Lookup)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#151b26', border: '1px solid #1e293b', borderRadius: '6px', padding: '6px 10px' }}>
                <Search size={14} style={{ color: '#64748b' }} />
                <input 
                  type="text"
                  placeholder="Type city/address to lookup coordinates..."
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    color: '#f8fafc',
                    border: 'none',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '100%',
                  }}
                />
                {isLoadingSuggestions && <Loader2 size={12} className="animate-spin" style={{ color: '#00f0ff' }} />}
                {addressQuery && (
                  <button 
                    onClick={() => {
                      setAddressQuery('');
                      setSuggestions([]);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Suggestions list dropdown overlay */}
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '55px',
                  left: 0,
                  right: 0,
                  backgroundColor: '#0f141e',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                  zIndex: 10000,
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {suggestions.map((item, idx) => {
                    const nameSegments = item.display_name.split(',');
                    const cleanName = nameSegments.length > 3 
                      ? `${nameSegments[0].trim()}, ${nameSegments[1].trim()}, ${nameSegments[nameSegments.length - 1].trim()}` 
                      : item.display_name;

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          setEditDraft(prev => ({
                            ...prev,
                            location: cleanName,
                            lat: parseFloat(item.lat),
                            lon: parseFloat(item.lon)
                          }));
                          setAddressQuery('');
                          setSuggestions([]);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          borderBottom: '1px solid #1e293b',
                          transition: 'background-color 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{cleanName}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.display_name}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#00f0ff', fontFamily: 'monospace', marginTop: '2px' }}>
                          COORD: {parseFloat(item.lat).toFixed(4)}N, {parseFloat(item.lon).toFixed(4)}E
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div 
            onClick={(e) => {
              if (event.lat !== undefined && event.lon !== undefined && onFocusLocation) {
                onFocusLocation(event.lat, event.lon);
              }
            }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px', 
              marginBottom: '20px', 
              padding: '12px', 
              background: '#1e293b40', 
              borderRadius: '6px', 
              border: '1px solid rgba(0, 240, 255, 0.2)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.6)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.15)';
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.05)';
              e.currentTarget.style.background = '#1e293b40';
            }}
            title="Click to focus map camera on these coordinates"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {editDraft.location || 'GLOBAL / REMOTE'}
              {isAdmin && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleEditMode();
                  }}
                  style={{
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9px',
                    color: '#00f0ff',
                    fontWeight: 'bold',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)'}
                  title="Edit Location Settings"
                >
                  <Edit3 size={10} />
                  <span>EDIT</span>
                </div>
              )}
            </div>
            {editDraft.lat !== undefined && editDraft.lon !== undefined && (
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '22px', fontFamily: "var(--font-jetbrains-fallback)", display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span>GEO_REF: {editDraft.lat.toFixed(4)}N, {editDraft.lon.toFixed(4)}E</span>
                {onReportIssue && !currentUser && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReportIssue('suggestions', {
                        type: 'map',
                        subject: `Incorrect Coordinates for: ${event.title}`,
                        targetId: String(event.id),
                        details: `Current: ${event.location || 'Unknown'} (${event.lat?.toFixed(5)}, ${event.lon?.toFixed(5)})\nSuggested Coordinates / Location:\n[Format: Latitude, Longitude, Location Name]\ne.g. 51.5074, -0.1278, London`
                      });
                    }}
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
        )}

        {/* Source and Link Badges */}
        {editMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '12px', background: '#1e293b20', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <div>
              <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>SOURCE NAME(S)</label>
              <input 
                type="text"
                value={editDraft.source || ''}
                onChange={(e) => setEditDraft(prev => ({ ...prev, source: e.target.value }))}
                style={{
                  background: '#151b26',
                  color: '#cbd5e1',
                  border: '1px solid #1e293b',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            {!event.details?.isRssItem && (
              <div>
                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>SOURCE URL LINK</label>
                <input 
                  type="text"
                  value={editDraft.url || ''}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, url: e.target.value }))}
                  style={{
                    background: '#151b26',
                    color: '#38bdf8',
                    border: '1px solid #1e293b',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => isAdmin && handleToggleEditMode()}
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '6px', 
              alignItems: 'center', 
              marginBottom: '20px',
              cursor: isAdmin ? 'pointer' : 'default',
              padding: isAdmin ? '6px 8px' : '0',
              borderRadius: '4px',
              border: isAdmin ? '1px dashed rgba(0, 240, 255, 0.3)' : 'none',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (isAdmin) e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              if (isAdmin) e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
            }}
            title={isAdmin ? "Click to enter Edit Mode" : undefined}
          >
            <span style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>SOURCES:</span>
            {(editDraft.source || 'Verified Intelligence')
              .split(/[\/\&]|\band\b/i)
              .map(s => s.trim())
              .filter(Boolean)
              .map((src, idx) => {
                const lowerSrc = src.toLowerCase();
                const lowerUrl = (editDraft.url || '').toLowerCase();
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
            {editDraft.url && (
              <a 
                href={editDraft.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e) => e.stopPropagation() /* Prevent opening editor on click */}
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
            {isAdmin && <Edit3 size={10} style={{ marginLeft: editDraft.url ? '6px' : 'auto', color: '#00f0ff' }} />}
          </div>
        )}
      </div>

      {/* Accordions */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
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
            <>
              {editMode ? (
                <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Intelligence Summary Report
                  </label>
                  <textarea 
                    value={editDraft.summary}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, summary: e.target.value }))}
                    rows={6}
                    style={{
                      background: '#151b26',
                      color: '#cbd5e1',
                      border: '1px solid #1e293b',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      fontFamily: 'system-ui',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              ) : (
                <div 
                  onClick={() => isAdmin && handleToggleEditMode()}
                  style={{ 
                    padding: '0 20px 20px 20px', 
                    color: '#cbd5e1', 
                    fontSize: '0.85rem', 
                    lineHeight: 1.6, 
                    fontFamily: 'system-ui',
                    cursor: isAdmin ? 'pointer' : 'default',
                    borderRadius: '4px',
                    border: isAdmin ? '1px dashed rgba(0, 240, 255, 0.15)' : 'none',
                    position: 'relative',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (isAdmin) e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    if (isAdmin) e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.15)';
                  }}
                  title={isAdmin ? "Click to enter Edit Mode" : undefined}
                >
                  {editDraft.summary || summary}
                  {isAdmin && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00f0ff', fontSize: '10px', marginTop: '8px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      <Edit3 size={10} /> [EDIT REPORT DETAILED SUMMARY]
                    </div>
                  )}
                </div>
              )}
            </>
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
                <strong>Fact-Check Summary:</strong> {event.details?.isRssItem ? 'This signal is geotagged live from open-source feeds and persistently archived in our Neon database. Sourced directly via secure TLS handshake protocol and synthesized using our real-time Web Scraping Summarizer agent.' : 'This signal is logged persistently inside our Neon database. Sourced from trusted press wires, cross-referenced using fuzzy geocoding specificity algorithms, and cataloged by the Sovereign AI background ingestion protocol.'}
              </div>
              
              {editDraft.url ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a 
                    href={editDraft.url} 
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
                  {onReportIssue && !currentUser && (
                    <button
                      onClick={() => onReportIssue('suggestions', {
                        type: 'link',
                        subject: `Broken Press Link for: ${event.title}`,
                        targetId: `URL: ${editDraft.url} (ID: ${event.id})`,
                        details: `The press link for "${event.title}" seems to be broken, throws an error, or links to incorrect information. The URL reported is: ${editDraft.url}`
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
                  {onReportIssue && !currentUser && (
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
      </div>
      
      {/* Interactive Save and Revert Action HUD Panel */}
      {hasChanges && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(15, 20, 30, 0.95)',
          borderTop: '1px solid rgba(0, 240, 255, 0.3)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: 'bold', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⚠ DRAFT PENDING
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setEditDraft({
                  category: event.category,
                  severity: event.severity,
                  title: event.title,
                  location: event.location,
                  lat: event.lat,
                  lon: event.lon,
                  source: event.source,
                  url: event.url,
                  summary: event.details?.summary || event.summary || ''
                });
                setEditMode(false);
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                fontFamily: 'monospace'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
            >
              <X size={12} /> REVERT
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: 'rgba(0, 240, 255, 0.15)',
                color: '#00f0ff',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.15)',
                fontFamily: 'monospace'
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.25)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.15)';
                }
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> COMMITTING...
                </>
              ) : (
                <>
                  <Save size={12} /> COMMIT INTEL TO DB
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
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

