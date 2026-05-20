'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Shield, RefreshCw, User, LogOut, Heart } from 'lucide-react';
import EventDetailsWindow from './EventDetailsWindow';
import MarketQuotesBox from './MarketQuotesBox';
import SatelliteDetailWindow from './SatelliteDetailWindow';

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

function parseDateSafe(ts) {
  if (!ts) return new Date(0);
  let d;
  if (typeof ts === 'string') {
    const cleanTs = ts.trim();
    if (/^\d{14}$/.test(cleanTs)) {
      d = new Date(cleanTs.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));
    } else if (/^\d{8}T\d{6}Z$/.test(cleanTs)) {
      d = new Date(cleanTs.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
    } else {
      d = new Date(cleanTs);
    }
  } else {
    d = new Date(ts);
  }
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function formatTime(ts) {
  if (!ts) return '';
  const d = parseDateSafe(ts);
  if (d.getTime() === 0) return ts;
  
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

function AsciiLoader({ text }) {
  const [frame, setFrame] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  const messages = [
    "Establishing handshake with secure gateway...",
    "Verifying server cryptographic signatures...",
    "Authenticating sovereign user credentials...",
    "Loading secure OSINT disarmament feed indices...",
    "Decrypting incoming intelligence data blocks...",
    "Resolving global geospatial coordinate matrices...",
    "Parsing verified state accountability research...",
    "Syncing active Reuters, AJE, and Nature feeds...",
    "Re-checking cryptographic block signatures...",
    "Mapping multi-source nodes to spatial interface..."
  ];

  const asciiArt = [
    // Stage 0: Base Bud Roots
    [
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "       ⠉⣻⡽⠛⠉⠁⠀⠉⢙⣿⠖⠒⠛⠻⣿⡋⠉⠁⠈⠉⠙⢿⣿⠉             ",
      "       ⠸⠿⠷⠒⣦⣤⣴⣶⢿⣿⡀⠀⠀⠀⣽⡿⢷⣦⠤⢤⡖⠶⠿⠧             ",
      "                             ⠛⢿⣦⣴⡾⠟⠁                                 ",
      "                                   ⠙⠟                                      ",
      "                                                                                  "
    ].join("\n"),

    // Stage 1: Core Sprout
    [
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "               ⠏⡇⠀⠀⠀⣿⠁⠀⠀⠀⠀⠀⣿⡄⠀⠀⢠⢷                 ",
      "        ⠙⣟⢼⡹⡄⠀⠀⣿⡄⠀⠀⠀⠀⢀⣿⡇⠀⢀⣞⣦                  ",
      "   ⠠⢶⣿⣛⠛⢒⣭⢻⣶⣤⣹⣿⣤⣀⣀⣠⣾⣟⣠⣔⡛⢫⣐⠛⢛⣻⣶⠆         ",
      "       ⠉⣻⡽⠛⠉⠁⠀⠉⢙⣿⠖⠒⠛⠻⣿⡋⠉⠁⠈⠉⠙⢿⣿⠉             ",
      "       ⠸⠿⠷⠒⣦⣤⣴⣶⢿⣿⡀⠀⠀⠀⣽⡿⢷⣦⠤⢤⡖⠶⠿⠧             ",
      "                             ⠛⢿⣦⣴⡾⠟⠁                                 ",
      "                                   ⠙⠟                                      ",
      "                                                                                  "
    ].join("\n"),

    // Stage 2: Inner Petals
    [
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "                                                                                  ",
      "               ⢀⣀⣀⣿⠀⠈⢻⣇⢀⣾⢟⡄⣸⡿⠋⠀⡇⣇⣀⣀                           ",
      "   ⣤⣤⣤⣀⣱⢻⠚⠻⣧⣀⠀⢹⡿⠃⠈⢻⣟⠀⢀⣤⠧⠓⣹⣟⣀⣤⣤⣤⡀       ",
      "   ⠈⠻⣧⠉⠛⣽⠀⠀⠀⠙⣷⡿⠁⠀⠀⠀⢻⣶⠛⠁⠀⠀⡟⠟⠉⣵⡟⠁         ",
      "       ⠹⣧⡀⠏⡇⠀⠀⠀⣿⠁⠀⠀⠀⠀⠀⣿⡄⠀⠀⢠⢷⠀⣼⡟             ",
      "        ⠙⣟⢼⡹⡄⠀⠀⣿⡄⠀⠀⠀⠀⢀⣿⡇⠀⢀⣞⣦⢾⠟                 ",
      "   ⠠⢶⣿⣛⠛⢒⣭⢻⣶⣤⣹⣿⣤⣀⣀⣠⣾⣟⣠⣔⡛⢫⣐⠛⢛⣻⣶⠆         ",
      "       ⠉⣻⡽⠛⠉⠁⠀⠉⢙⣿⠖⠒⠛⠻⣿⡋⠉⠁⠈⠉⠙⢿⣿⠉             ",
      "       ⠸⠿⠷⠒⣦⣤⣴⣶⢿⣿⡀⠀⠀⠀⣽⡿⢷⣦⠤⢤⡖⠶⠿⠧             ",
      "                             ⠛⢿⣦⣴⡾⠟⠁                                 ",
      "                                   ⠙⠟                                      ",
      "                                                                                  "
    ].join("\n"),

    // Stage 3: Soft Bloom
    [
      "                                                                                  ",
      "                                                                                  ",
      "                                ⢀⣴⠟⠹⣧⡀                                      ",
      "                        ⣷⣦⣄⣠⣿⠃⢠⣄⠈⢻⣆⣠⣴⡞⡆                             ",
      "               ⢀⣀⣀⣿⠀⠈⢻⣇⢀⣾⢟⡄⣸⡿⠋⠀⡇⣇⣀⣀                           ",
      "   ⣤⣤⣤⣀⣱⢻⠚⠻⣧⣀⠀⢹⡿⠃⠈⢻⣟⠀⢀⣤⠧⠓⣹⣟⣀⣤⣤⣤⡀       ",
      "   ⠈⠻⣧⠉⠛⣽⠀⠀⠀⠙⣷⡿⠁⠀⠀⠀⢻⣶⠛⠁⠀⠀⡟⠟⠉⣵⡟⠁         ",
      "       ⠹⣧⡀⠏⡇⠀⠀⠀⣿⠁⠀⠀⠀⠀⠀⣿⡄⠀⠀⢠⢷⠀⣼⡟             ",
      "        ⠙⣟⢼⡹⡄⠀⠀⣿⡄⠀⠀⠀⠀⢀⣿⡇⠀⢀⣞⣦⢾⠟                 ",
      "   ⠠⢶⣿⣛⠛⢒⣭⢻⣶⣤⣹⣿⣤⣀⣀⣠⣾⣟⣠⣔⡛⢫⣐⠛⢛⣻⣶⠆         ",
      "       ⠉⣻⡽⠛⠉⠁⠀⠉⢙⣿⠖⠒⠛⠻⣿⡋⠉⠁⠈⠉⠙⢿⣿⠉             ",
      "       ⠸⠿⠷⠒⣦⣤⣴⣶⢿⣿⡀⠀⠀⠀⣽⡿⢷⣦⠤⢤⡖⠶⠿⠧             ",
      "                             ⠛⢿⣦⣴⡾⠟⠁                                 ",
      "                                   ⠙⠟                                      ",
      "                                                                                  "
    ].join("\n"),

    // Stage 4: Majestic Full Bloom
    [
      "                                                                                  ",
      "                                      ⣰⣦                                          ",
      "                                ⢀⣴⠟⠹⣧⡀                                      ",
      "                        ⣷⣦⣄⣠⣿⠃⢠⣄⠈⢻⣆⣠⣴⡞⡆                             ",
      "               ⢀⣀⣀⣿⠀⠈⢻⣇⢀⣾⢟⡄⣸⡿⠋⠀⡇⣇⣀⣀                           ",
      "   ⣤⣤⣤⣀⣱⢻⠚⠻⣧⣀⠀⢹⡿⠃⠈⢻⣟⠀⢀⣤⠧⠓⣹⣟⣀⣤⣤⣤⡀       ",
      "   ⠈⠻⣧⠉⠛⣽⠀⠀⠀⠙⣷⡿⠁⠀⠀⠀⢻⣶⠛⠁⠀⠀⡟⠟⠉⣵⡟⠁         ",
      "       ⠹⣧⡀⠏⡇⠀⠀⠀⣿⠁⠀⠀⠀⠀⠀⣿⡄⠀⠀⢠⢷⠀⣼⡟             ",
      "        ⠙⣟⢼⡹⡄⠀⠀⣿⡄⠀⠀⠀⠀⢀⣿⡇⠀⢀⣞⣦⢾⠟                 ",
      "   ⠠⢶⣿⣛⠛⢒⣭⢻⣶⣤⣹⣿⣤⣀⣀⣠⣾⣟⣠⣔⡛⢫⣐⠛⢛⣻⣶⠆         ",
      "       ⠉⣻⡽⠛⠉⠁⠀⠉⢙⣿⠖⠒⠛⠻⣿⡋⠉⠁⠈⠉⠙⢿⣿⠉             ",
      "       ⠸⠿⠷⠒⣦⣤⣴⣶⢿⣿⡀⠀⠀⠀⣽⡿⢷⣦⠤⢤⡖⠶⠿⠧             ",
      "                             ⠛⢿⣦⣴⡾⠟⠁                                 ",
      "                                   ⠙⠟                                      ",
      "                                                                                  "
    ].join("\n")
  ];

  const progressFrames = [
    "[░░░░░░░░░░░░]",
    "[▓░░░░░░░░░░░]",
    "[▓▓░░░░░░░░░░]",
    "[▓▓▓▓░░░░░░░░]",
    "[▓▓▓▓▓▓░░░░░░]",
    "[▓▓▓▓▓▓▓▓░░░░]",
    "[▓▓▓▓▓▓▓▓▓▓░░]",
    "[▓▓▓▓▓▓▓▓▓▓▓▓]"
  ];

  useEffect(() => {
    const artTimer = setInterval(() => {
      setFrame(prev => (prev + 1) % asciiArt.length);
    }, 450); // Slower, more organic flower bloom transition

    const msgTimer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 1200);

    return () => {
      clearInterval(artTimer);
      clearInterval(msgTimer);
    };
  }, []);

  const progressFrame = progressFrames[frame % progressFrames.length];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '35px 10px',
      fontFamily: 'monospace',
      color: '#00f0ff',
      background: 'rgba(2, 6, 23, 0.45)',
      border: '1px dashed rgba(0, 240, 255, 0.25)',
      borderRadius: '8px',
      margin: '20px 14px',
      textAlign: 'center',
      boxShadow: '0 0 25px rgba(0, 240, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '15px 15px',
        pointerEvents: 'none'
      }} />

      <pre style={{ 
        margin: 0, 
        fontSize: '7.5px', 
        lineHeight: '1.15', 
        color: '#00f0ff',
        textShadow: '0 0 8px rgba(0, 240, 255, 0.35)',
        zIndex: 1,
        whiteSpace: 'pre',
        minHeight: '135px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {asciiArt[frame]}
      </pre>

      <div style={{ 
        fontSize: '9.5px', 
        marginTop: '15px', 
        letterSpacing: '1px', 
        color: '#38bdf8', 
        fontWeight: 'bold',
        zIndex: 1,
        textTransform: 'uppercase'
      }}>
        {text}
      </div>

      <div style={{ 
        fontSize: '10px', 
        color: '#00f0ff', 
        zIndex: 1,
        margin: '12px 0 10px'
      }}>
        {progressFrame}
      </div>

      <div style={{
        fontSize: '8.5px',
        color: '#94a3b8',
        zIndex: 1,
        padding: '0 8px',
        minHeight: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '1.3'
      }}>
        {messages[msgIdx]}
      </div>
    </div>
  );
}

export default function LiveMap({
  currentUser,
  handleLogout,
  showAuthModal,
  setShowAuthModal,
  handleAuthSuccess,
  onAvatarClick
}) {
  const [markers, setMarkers] = useState([]);
  const [allFetchedEvents, setAllFetchedEvents] = useState([]);
  const [categories, setCategories] = useState({ Conflict: true, Surveillance: true, Political: true, Humanitarian: true, Economic: true, Disaster: true });
  const [minSeverity, setMinSeverity] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('operator_pref_minSeverity');
      return stored !== null ? parseInt(stored) : 1;
    }
    return 1;
  });
  const [status, setStatus] = useState('loading');
  const [feedTab, setFeedTab] = useState('feed');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMarkets, setShowMarkets] = useState(false);
  const [isMapOptionsExpanded, setIsMapOptionsExpanded] = useState(false);
  const [isFeedCollapsed, setIsFeedCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [showSupportDropdown, setShowSupportDropdown] = useState(false);
  const [visibleRssCount, setVisibleRssCount] = useState(30);
  const [visibleEventCount, setVisibleEventCount] = useState(30);

  const [timeRange, setTimeRange] = useState('recent'); 
  const [isVisible, setIsVisible] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [feedType, setFeedType] = useState('live'); // 'live' or 'reports'
  const [rssItems, setRssItems] = useState([]);
  const [rssStatus, setRssStatus] = useState('loading');
  const [rssLoading, setRssLoading] = useState(true);
  const [activeRssTab, setActiveRssTab] = useState('all');
  const [isRssDropdownOpen, setIsRssDropdownOpen] = useState(false);
  const [selectedRssSources, setSelectedRssSources] = useState(['arxiv', 'aje', 'hrw', 'nature', 'un', 'wired', 'eff']);
  const [mapMode, setMapMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('operator_pref_mapMode') || '2d';
    }
    return '2d';
  });
  const [mapStyle, setMapStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('operator_pref_mapStyle');
      return (stored === 'dark' || !stored) ? 'tactical' : stored;
    }
    return 'tactical';
  });
  const [autoRotate, setAutoRotate] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('operator_pref_autoRotate');
      return stored !== null ? stored === 'true' : true;
    }
    return true;
  });
  const [tickerSpeed, setTickerSpeed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('operator_pref_tickerSpeed') || 'slow';
    }
    return 'slow';
  });
  
  const [isMobile, setIsMobile] = useState(false);
  const mapAreaRef = useRef(null);

  // Satellite Tracking & Observation States
  const [showSatellites, setShowSatellites] = useState(true);
  const [satellites, setSatellites] = useState([]);
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [isTracked, setIsTracked] = useState(false);

  // Map Layer Toggle States (all deselected by default except Events & Auto Rotate)
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [oilGasEnabled, setOilGasEnabled] = useState(false);
  const [internetCablesEnabled, setInternetCablesEnabled] = useState(false);
  const [dayNightEnabled, setDayNightEnabled] = useState(false);
  const [gpsJammingEnabled, setGpsJammingEnabled] = useState(false);
  const [dataCentersEnabled, setDataCentersEnabled] = useState(false);

  // Dynamic 5-second telemetry polling interval for space satellites
  useEffect(() => {
    if (!showSatellites) {
      setSatellites([]);
      return;
    }

    const fetchSatellites = async () => {
      try {
        const res = await fetch('/api/satellite');
        if (res.ok) {
          const data = await res.json();
          setSatellites(data);
          
          // Keep live telemetry coordinates synchronized for clicked satellite
          if (selectedSatelliteRef.current) {
            const updated = data.find(s => s.code === selectedSatelliteRef.current.code);
            if (updated) {
              setSelectedSatellite(updated);
            }
          }
        }
      } catch (err) {
        console.error("Failed to query orbital satellite API:", err);
      }
    };

    fetchSatellites();
    const interval = setInterval(fetchSatellites, 5000);
    return () => clearInterval(interval);
  }, [showSatellites]);

  // Keep a stable ref of selected satellite to prevent polling race conditions
  const selectedSatelliteRef = useRef(selectedSatellite);
  useEffect(() => {
    selectedSatelliteRef.current = selectedSatellite;
  }, [selectedSatellite]);

  // Handle preferences changes dynamically via standard browser events
  useEffect(() => {
    const handlePrefChange = () => {
      setMapMode(localStorage.getItem('operator_pref_mapMode') || '2d');
      setMapStyle(localStorage.getItem('operator_pref_mapStyle') || 'dark');
      const rotate = localStorage.getItem('operator_pref_autoRotate');
      setAutoRotate(rotate !== null ? rotate === 'true' : true);
      const sev = localStorage.getItem('operator_pref_minSeverity');
      setMinSeverity(sev !== null ? parseInt(sev) : 1);
      setTickerSpeed(localStorage.getItem('operator_pref_tickerSpeed') || 'slow');
    };

    window.addEventListener('operator_pref_changed', handlePrefChange);
    return () => window.removeEventListener('operator_pref_changed', handlePrefChange);
  }, []);

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
      const res = await fetch('/api/events?timespan=today');
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

  const fetchRss = useCallback(async (refresh = false) => {
    if (!isVisible) return;
    setRssLoading(true);
    try {
      const res = await fetch(`/api/rss${refresh ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (data.success && data.items) {
        setRssItems(data.items);
        setRssStatus(data.status);
      } else {
        setRssStatus('error');
      }
    } catch (e) {
      console.error('Failed to fetch RSS:', e);
      setRssStatus('error');
    } finally {
      setRssLoading(false);
    }
  }, [isVisible]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setResetKey(prev => prev + 1);
    setSelectedSatellite(null);
    setIsTracked(false);
    setSelectedEvent(null);
    setAutoRotate(true);
    await Promise.all([fetchEvents(), fetchRss(false)]);
    setRefreshing(false);
  }, [fetchEvents, fetchRss]);

  useEffect(() => {
    fetchEvents();
    fetchRss(false);
    const interval = setInterval(fetchEvents, EVENTS_POLL);
    return () => clearInterval(interval);
  }, [fetchEvents, fetchRss]);

  const toggleCategory = (key) => setCategories(c => ({ ...c, [key]: !c[key] }));

  // Memoize filtered data to prevent unnecessary re-renders
  const displayedMarkers = useMemo(() => {
    // 1. Map base GDELT/INTEL markers safely
    const baseMarkers = markers.map(m => ({
      ...m,
      lat: parseFloat(m.lat),
      lon: parseFloat(m.lon)
    }));

    // 2. Map RSS Feed items containing valid locations to standard marker layouts
    const rssMarkers = rssItems
      .filter(item => selectedRssSources.includes(item.sid) && item.latitude !== null && item.longitude !== null && !isNaN(parseFloat(item.latitude)) && !isNaN(parseFloat(item.longitude)))
      .map(item => ({
        id: item.id || `rss-${item.url}`,
        name: item.title,
        title: item.title,
        category: item.category || 'Political',
        severity: item.severity || 1,
        location: item.location || 'Unknown',
        lat: parseFloat(item.latitude),
        lon: parseFloat(item.longitude),
        timestamp: item.published_at,
        url: item.url,
        source: item.source,
        details: {
          summary: item.summary || `Source: ${item.source}. Geotagged live feed article.`,
          isRssItem: true
        }
      }));

    // 3. Combine base SIGINT with tactical RSS feeds
    const allCombined = [...baseMarkers, ...rssMarkers];

    // Filter combined list by checkbox categories & minSeverity
    let filtered = allCombined.filter(m => categories[m.category] && m.severity >= minSeverity);

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => {
        const nameMatch = (m.name || m.title || '').toLowerCase().includes(q);
        const locMatch = (m.location || '').toLowerCase().includes(q);
        const catMatch = (m.category || '').toLowerCase().includes(q);
        const descMatch = (m.description || m.details?.summary || '').toLowerCase().includes(q);
        const sourceMatch = (m.source || m.details?.source || '').toLowerCase().includes(q);
        return nameMatch || locMatch || catMatch || descMatch || sourceMatch;
      });
    }
    return filtered;
  }, [markers, rssItems, categories, minSeverity, searchQuery, selectedRssSources]);

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

    if (timeRange === 'critical') {
      return filtered.sort((a, b) => {
        if (b.severity !== a.severity) return b.severity - a.severity;
        return parseDateSafe(b.timestamp) - parseDateSafe(a.timestamp);
      });
    }

    return filtered.sort((a, b) => parseDateSafe(b.timestamp) - parseDateSafe(a.timestamp));
  }, [displayedEvents, categories, feedType, searchQuery, timeRange]);

  const filteredRssItems = useMemo(() => {
    let items = rssItems.filter(item => selectedRssSources.includes(item.sid));
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const sourceMatch = (item.source || '').toLowerCase().includes(q);
        return titleMatch || sourceMatch;
      });
    }
    
    return items;
  }, [rssItems, selectedRssSources, searchQuery]);

  const filteredSatellites = useMemo(() => {
    if (!showSatellites || !satellites) return [];
    if (searchQuery.trim() === '') return satellites;
    const q = searchQuery.toLowerCase().trim();
    return satellites.filter(sat => {
      const nameMatch = (sat.name || '').toLowerCase().includes(q);
      const codeMatch = (sat.code || '').toLowerCase().includes(q);
      const countryMatch = (sat.country || '').toLowerCase().includes(q);
      const descMatch = (sat.desc || '').toLowerCase().includes(q);
      return nameMatch || codeMatch || countryMatch || descMatch;
    });
  }, [showSatellites, satellites, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    markers.forEach(m => { counts[m.category] = (counts[m.category] || 0) + 1; });
    return counts;
  }, [markers]);

  // Create ticker alert items combining GDELT events & dynamic RSS feeds
  const tickerItems = useMemo(() => {
    const items = [];
    
    // 1. Map GDELT events
    if (allFetchedEvents && allFetchedEvents.length > 0) {
      allFetchedEvents.slice(0, 6).forEach(ev => {
        items.push({
          text: `[${ev.category.toUpperCase()} // ${formatTime(ev.timestamp)}] ${ev.title.toUpperCase()}`,
          timestamp: ev.timestamp,
          event: ev
        });
      });
    }
    
    // 2. Map RSS feeds
    if (rssItems && rssItems.length > 0) {
      rssItems
        .filter(item => selectedRssSources.includes(item.sid))
        .slice(0, 6)
        .forEach(item => {
          items.push({
            text: `[OSINT // ${formatTime(item.published_at)}] ${item.title.toUpperCase()}`,
            timestamp: item.published_at,
            event: {
              id: item.id || `rss-${item.url}`,
              title: item.title,
              category: item.category || 'Political',
              severity: item.severity || 1,
              location: item.location || 'Unknown',
              lat: item.latitude ? parseFloat(item.latitude) : null,
              lon: item.longitude ? parseFloat(item.longitude) : null,
              timestamp: item.published_at,
              url: item.url,
              source: item.source,
              details: {
                summary: item.summary || `Source: ${item.source}. Geotagged live feed article.`,
                isRssItem: true
              }
            }
          });
        });
    }

    if (items.length === 0) {
      return [{ text: "[SIGNAL LOCK] Listening for live SIGINT telemetry...", event: null }];
    }

    // Sort by timestamp descending and take top 6
    const sorted = items
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);
      
    // Duplicate to make the marquee perfectly infinite/seamless
    return [...sorted, ...sorted, ...sorted];
  }, [allFetchedEvents, rssItems, selectedRssSources]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#020617', overflow: 'hidden' }}>
      {/* Sleek, MTS-style Clean Header Bar */}
      <header style={{
        height: isMobile ? '46px' : '52px',
        background: 'rgba(8, 12, 24, 0.95)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 20px',
        boxSizing: 'border-box',
        zIndex: 1001,
        backdropFilter: 'blur(10px)',
        position: 'relative'
      }}>
        {/* Left: Shield Logo & Compact Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/icon.svg" 
            alt="Sovereign Logo" 
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '5px',
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(59, 130, 246, 0.5)';
            }}
          />
          <div>
            <h1 style={{
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '800',
              color: '#ffffff',
              margin: 0,
              fontFamily: 'monospace',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(255,255,255,0.1)'
            }}>
              {isMobile ? 'SOVEREIGN' : 'SOVEREIGN INTELLIGENCE'}
            </h1>
            {!isMobile && (
              <div style={{
                fontSize: '9px',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: '500',
                letterSpacing: '0.5px',
                marginTop: '1px'
              }}>
                LAWS Tracking • State Violations • Corporate Complicity
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Compact Status indicators & Access Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
          {/* Pulsing Signal Count (MTS style) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '6px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '4px',
            padding: isMobile ? '3px 6px' : '4px 8px',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontSize: isMobile ? '9px' : '10px',
            color: '#10b981',
            fontWeight: 'bold'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
              animation: 'pulse 2s infinite'
            }} />
            <span>LIVE</span>
          </div>

          {/* Compact Refresh Avatar */}
          <button 
            onClick={handleRefresh}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            className={refreshing ? 'spinning' : ''}
            title="Refresh Live Signals"
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
          >
            <RefreshCw size={12} />
          </button>

          {/* Profile User avatar (Access Control trigger) */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Submit Feedback / Report Bug Button */}
              <button
                onClick={() => onAvatarClick('suggestions')}
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                  borderRadius: '4px',
                  padding: isMobile ? '3px 6px' : '4px 8px',
                  fontSize: isMobile ? '9px' : '10px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.05)',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.18)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.05)';
                }}
                title="Submit Suggestions & Report System Issues"
              >
                <span>💡</span>
                <span>FEEDBACK</span>
              </button>

              <div 
                onClick={() => onAvatarClick('profile')}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10b981',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#10b981',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title={`Configure Settings for Operator: ${currentUser.fullName}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px 4px',
                  transition: 'all 0.2s'
                }}
                title="Logout Operator Session"
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'}
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                color: '#06b6d4',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                e.currentTarget.style.borderColor = '#06b6d4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.25)';
              }}
              title="Operator Authenticate"
            >
              <User size={12} />
            </button>
          )}
        </div>
      </header>

      {/* Cyber News Ticker Bar */}
      <div style={{
        background: '#040810',
        borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        width: '100%',
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: `ticker-marquee ${tickerSpeed === 'fast' ? '30s' : tickerSpeed === 'normal' ? '60s' : '110s'} linear infinite`,
          fontFamily: 'var(--font-jetbrains-fallback)',
          fontSize: '10px',
          color: '#00f0ff',
          fontWeight: 'bold',
          letterSpacing: '0.05em'
        }}>
          {tickerItems.map((item, idx) => (
            <span 
              key={idx} 
              onClick={() => {
                if (item.event) {
                  setSelectedEvent(item.event);
                }
              }}
              style={{
                cursor: item.event ? 'pointer' : 'default',
                marginRight: '24px',
                transition: 'all 0.15s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                if (item.event) {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.textShadow = '0 0 8px rgba(0, 240, 255, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (item.event) {
                  e.currentTarget.style.color = '#00f0ff';
                  e.currentTarget.style.textShadow = 'none';
                }
              }}
            >
              {item.text}
              {idx < tickerItems.length - 1 && <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: '24px', pointerEvents: 'none' }}>•</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Map Layout Container */}
      <div 
        className="sigint-container"
        style={{
          gridTemplateColumns: isMobile ? '1fr' : (isFeedCollapsed ? '0px 1fr' : '360px 1fr'),
          transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          flex: 1
        }}
      >
        {/* Event Feed Sidebar */}
        <div 
          className="sigint-feed"
          style={{
            position: isMobile ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            height: '100%',
            width: isFeedCollapsed ? '0px' : (isMobile ? '310px' : '360px'),
            minWidth: isFeedCollapsed ? '0px' : (isMobile ? '310px' : '360px'),
            maxWidth: isFeedCollapsed ? '0px' : (isMobile ? '85vw' : '360px'),
            transform: isFeedCollapsed ? 'translateX(-100%)' : 'translateX(0)',
            opacity: isFeedCollapsed ? 0 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRight: isFeedCollapsed ? 'none' : '1px solid rgba(56, 189, 248, 0.2)',
            visibility: isFeedCollapsed ? 'hidden' : 'visible',
            zIndex: 1000,
            background: 'rgba(8, 12, 24, 0.96)',
            boxShadow: isFeedCollapsed ? 'none' : '10px 0 40px rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(15px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
        <div className="feed-type-tabs" style={{ display: 'flex', alignItems: 'stretch' }}>
          <button className={`feed-type-tab ${feedType === 'live' ? 'active' : ''}`} style={{ flex: 1, padding: isMobile ? '4px' : '8px', fontSize: isMobile ? '8px' : '9.5px' }} onClick={() => setFeedType('live')}>
            LIVE SIGNALS
          </button>
          <button className={`feed-type-tab ${feedType === 'reports' ? 'active' : ''}`} style={{ flex: 1, padding: isMobile ? '4px' : '8px', fontSize: isMobile ? '8px' : '9.5px' }} onClick={() => setFeedType('reports')}>
            INTEL REPORTS
          </button>
          <button className={`feed-type-tab ${feedType === 'rss' ? 'active' : ''}`} style={{ flex: 1, padding: isMobile ? '4px' : '8px', fontSize: isMobile ? '8px' : '9.5px' }} onClick={() => setFeedType('rss')}>
            RSS FEEDS
          </button>
          <button className={`feed-type-tab ${feedType === 'satellites' ? 'active' : ''}`} style={{ flex: 1, padding: isMobile ? '4px' : '8px', fontSize: isMobile ? '8px' : '9.5px', color: '#00f0ff' }} onClick={() => setFeedType('satellites')}>
            SPACE RADAR
          </button>
          
          {/* Elegant Collapse Arrow Button inside Feed Header */}
          <button
            onClick={() => setIsFeedCollapsed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.3)',
              padding: '0 12px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
              borderLeft: '1px solid var(--border-color)',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
            title="Collapse Feed Sidebar"
            onMouseEnter={(e) => e.target.style.color = '#ef4444'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.3)'}
          >
            &lt;
          </button>
        </div>
        
        {feedType === 'rss' ? (
          <div style={{ position: 'relative', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 30, borderBottom: '1px solid rgba(56, 189, 248, 0.15)' }}>
            
            {/* Custom Multi-select Dropdown Button */}
            <div style={{ position: 'relative', flex: 1 }}>
              <button 
                onClick={() => setIsRssDropdownOpen(!isRssDropdownOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00f0ff'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = isRssDropdownOpen ? '#00f0ff' : 'rgba(56, 189, 248, 0.3)'}
              >
                <span>📡 SOURCES ({selectedRssSources.length}/7)</span>
                <span style={{ fontSize: '9px', color: '#00f0ff' }}>{isRssDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {isRssDropdownOpen && (
                <>
                  {/* Click outside backdrop */}
                  <div 
                    onClick={() => setIsRssDropdownOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
                  />
                  {/* Floating dropdown overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(11, 17, 32, 0.98)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #1e293b',
                    borderRadius: '4px',
                    padding: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.8), 0 0 15px rgba(0, 240, 255, 0.05)',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {/* Toggle All Button */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <button
                        onClick={() => setSelectedRssSources(['arxiv', 'aje', 'hrw', 'nature', 'un', 'wired', 'eff'])}
                        style={{ flex: 1, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', padding: '3px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'}
                      >
                        [SELECT ALL]
                      </button>
                      <button
                        onClick={() => setSelectedRssSources([])}
                        style={{ flex: 1, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '3px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                      >
                        [CLEAR ALL]
                      </button>
                    </div>

                    {/* Sources Map Checkboxes */}
                    {[
                      { id: 'arxiv', name: 'arXiv cs.AI' },
                      { id: 'aje', name: 'Al Jazeera' },
                      { id: 'hrw', name: 'Human Rights Watch' },
                      { id: 'nature', name: 'Nature MI' },
                      { id: 'un', name: 'UN News' },
                      { id: 'wired', name: 'Wired AI & Security' },
                      { id: 'eff', name: 'EFF Updates' }
                    ].map(src => {
                      const isChecked = selectedRssSources.includes(src.id);
                      return (
                        <label 
                          key={src.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: isChecked ? '#e2e8f0' : '#64748b',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            padding: '4px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            background: isChecked ? 'rgba(56, 189, 248, 0.04)' : 'transparent',
                            transition: 'all 0.1s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = isChecked ? 'rgba(56, 189, 248, 0.04)' : 'transparent'}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedRssSources(prev => 
                                prev.includes(src.id) 
                                  ? prev.filter(x => x !== src.id) 
                                  : [...prev, src.id]
                              );
                            }}
                            style={{ accentColor: '#00f0ff', cursor: 'pointer' }}
                          />
                          <span>{src.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Sync Refresh Button */}
            <button 
              onClick={() => fetchRss(true)} 
              disabled={rssLoading}
              title="Force sync live RSS feeds"
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '4px',
                color: rssLoading ? 'rgba(255,255,255,0.2)' : '#00f0ff',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                opacity: rssLoading ? 0.5 : 1,
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => !rssLoading && (e.currentTarget.style.borderColor = '#00f0ff')}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)'}
            >
              <RefreshCw size={11} className={rssLoading ? 'spinning' : ''} style={{ animation: rssLoading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
          </div>
        ) : (
          <div className="feed-tabs">
            <button className={`feed-tab ${timeRange === 'recent' ? 'active' : ''}`} onClick={() => setTimeRange('recent')}>LATEST</button>
            <button className={`feed-tab live-tab ${timeRange === 'critical' ? 'active' : ''}`} onClick={() => setTimeRange('critical')}>CRITICAL</button>
          </div>
        )}
        
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
              <span>FILTERED: {feedType === 'rss' ? filteredRssItems.length : feedType === 'satellites' ? filteredSatellites.length : filteredEvents.length} MATCHES</span>
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
          {feedType === 'rss' ? (
            rssLoading && filteredRssItems.length === 0 ? (
              <AsciiLoader text="Scraping Tactical Feeds" />
            ) : filteredRssItems.length === 0 ? (
              <div className="feed-empty">No RSS items match current filters</div>
            ) : (
              <>
                {filteredRssItems.slice(0, visibleRssCount).map((item, idx) => {
                  let badgeColor = '#00f0ff';
                  if (item.sid === 'arxiv') badgeColor = '#38bdf8';
                  else if (item.sid === 'aje') badgeColor = '#ff2d55';
                  else if (item.sid === 'hrw') badgeColor = '#facc15';
                  else if (item.sid === 'nature') badgeColor = '#22c55e';

                  return (
                    <div 
                      key={item.id || idx} 
                      onClick={() => setSelectedEvent({
                        id: item.id || `rss-${item.url}`,
                        title: item.title,
                        category: item.category || 'Political',
                        severity: item.severity || 1,
                        location: item.location || 'Unknown',
                        lat: item.latitude ? parseFloat(item.latitude) : null,
                        lon: item.longitude ? parseFloat(item.longitude) : null,
                        timestamp: item.published_at,
                        url: item.url,
                        source: item.source,
                        details: {
                          summary: item.summary || `Source: ${item.source}. Geotagged live feed article.`,
                          isRssItem: true
                        }
                      })}
                      className="feed-item"
                      style={{ 
                        textDecoration: 'none', 
                        display: 'block', 
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        padding: '12px 14px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="feed-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="feed-category" style={{ 
                          background: `${badgeColor}15`, 
                          color: badgeColor, 
                          borderColor: `${badgeColor}30`,
                          fontSize: '9px',
                          fontWeight: '800',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${badgeColor}30`,
                          letterSpacing: '0.05em',
                          fontFamily: 'monospace'
                        }}>
                          {item.source}
                        </span>
                        <span className="feed-time" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                          {formatTime(item.published_at)}
                        </span>
                      </div>
                      <div className="feed-title" style={{ 
                        fontSize: '12.5px', 
                        fontWeight: '600', 
                        lineHeight: '1.45', 
                        color: '#e2e8f0',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#00f0ff'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#e2e8f0'}
                      >
                        {item.title}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginTop: '8px', 
                        fontSize: '8.5px', 
                        fontFamily: 'monospace', 
                        color: 'rgba(255,255,255,0.25)',
                        letterSpacing: '0.05em'
                      }}>
                        <span>OSINT FEED SYSTEM</span>
                        <span style={{ color: '#00f0ff', opacity: 0.8 }}>PREVIEW & TRACK ↗</span>
                      </div>
                    </div>
                  );
                })}
                {filteredRssItems.length > visibleRssCount && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setVisibleRssCount(prev => prev + 30);
                    }}
                    style={{
                      width: '100%',
                      padding: '12.5px',
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: 'none',
                      borderTop: '1px solid rgba(56, 189, 248, 0.1)',
                      color: '#00f0ff',
                      fontFamily: 'monospace',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                      letterSpacing: '0.05em',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.45)'}
                  >
                    [ LOAD MORE FEEDS (+30) ]
                  </button>
                )}
              </>
            )
          ) : feedType === 'satellites' ? (
            filteredSatellites.length === 0 ? (
              <div className="feed-empty">No active satellites found matching search query</div>
            ) : (
              filteredSatellites.map((sat, idx) => {
                const isSelected = selectedSatellite && selectedSatellite.code === sat.code;
                return (
                  <div 
                    key={sat.code || idx}
                    onClick={() => {
                      setSelectedSatellite(sat);
                      setAutoRotate(false);
                    }}
                    className={`feed-item ${isSelected ? 'active' : ''}`}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #00f0ff' : '3px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="feed-category" style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        color: '#00f0ff',
                        borderColor: 'rgba(0, 240, 255, 0.3)',
                        fontSize: '9px',
                        fontWeight: '800',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        letterSpacing: '0.05em',
                        fontFamily: 'monospace'
                      }}>
                        🛰️ {sat.country}
                      </span>
                      <span style={{ fontSize: '9px', color: '#facc15', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        ALT: {sat.altitude}km
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12.5px',
                      fontWeight: '600',
                      lineHeight: '1.45',
                      color: isSelected ? '#00f0ff' : '#e2e8f0',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                      {sat.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px',
                      fontSize: '8.5px',
                      fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.05em'
                    }}>
                      <span>NORAD #{sat.code}</span>
                      <span style={{ color: '#22c55e' }}>V: {sat.velocity} km/s</span>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            status === 'loading' && filteredEvents.length === 0 ? (
              <AsciiLoader text="Decrypting SIGINT Network" />
            ) : filteredEvents.length === 0 ? (
              <div className="feed-empty">No events match current filters</div>
            ) : (
              <>
                {filteredEvents.slice(0, visibleEventCount).map((ev, idx) => {
                  const vStatus = ev.url ? (ev.details?.verificationStatus || 'pending') : 'unverified';
                  const badgeStyles = vStatus === 'unverified'
                    ? { bg: 'rgba(234, 179, 8, 0.12)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.25)', label: 'UNVERIFIED' }
                    : vStatus === 'active' 
                    ? { bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)', label: '✓ VERIFIED' }
                    : vStatus === 'healed'
                    ? { bg: 'rgba(0, 240, 255, 0.12)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.25)', label: '⚡ HEALED' }
                    : vStatus === 'broken'
                    ? { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', label: '⚠ BROKEN LINK' }
                    : { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', label: '🔎 PENDING CHECK' };

                  return (
                    <div key={ev._displayKey || `${ev.id}-${idx}`} className="feed-item" onClick={() => setSelectedEvent(ev)}>
                      <div className="feed-item-header">
                        <span className="feed-category" style={{ background: `${CAT_COLORS[ev.category]}20`, color: CAT_COLORS[ev.category], borderColor: `${CAT_COLORS[ev.category]}40` }}>
                          {ev.category}
                        </span>
                        {ev.details?.isResearch && <span className="research-badge" style={{ fontSize: '9px', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.3)', fontWeight: '800' }}>RESEARCH</span>}
                        <span className="feed-verification" style={{ 
                          fontSize: '8px', 
                          background: badgeStyles.bg, 
                          color: badgeStyles.color, 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          border: badgeStyles.border, 
                          fontWeight: '800', 
                          letterSpacing: '0.05em',
                          fontFamily: 'monospace'
                        }}>
                          {badgeStyles.label}
                        </span>
                        <span className="feed-severity" style={{ background: `${SEV_COLORS[ev.severity]}25`, color: SEV_COLORS[ev.severity] }}>
                          S{ev.severity}
                        </span>
                        <span className="feed-time">{formatTime(ev.timestamp)}</span>
                      </div>
                      <div className="feed-title">{ev.title}</div>
                      {ev.location && <div className="feed-location">📍 {ev.location}</div>}
                    </div>
                  );
                })}
                {filteredEvents.length > visibleEventCount && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setVisibleEventCount(prev => prev + 30);
                    }}
                    style={{
                      width: '100%',
                      padding: '12.5px',
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: 'none',
                      borderTop: '1px solid rgba(56, 189, 248, 0.1)',
                      color: '#00f0ff',
                      fontFamily: 'monospace',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                      letterSpacing: '0.05em',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.45)'}
                  >
                    [ LOAD MORE EVENTS (+30) ]
                  </button>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* 3D Google Tiles Globe Area */}
      <div ref={mapAreaRef} className="sigint-map-area">
        <CesiumGlobe
          displayedMarkers={displayedMarkers}
          mapMode={mapMode}
          mapStyle={mapStyle}
          onMapModeChange={setMapMode}
          autoRotate={autoRotate}
          onInteraction={() => setAutoRotate(false)}
          onPointClick={(point) => {
            // First check GDELT events
            let fullEvent = allFetchedEvents.find(ev => ev.id === point.id || ev.title === point.name || `db-${ev.id}` === point.id || ev.id === point.id?.replace('db-', ''));
            // If not found, look up RSS items to populate dynamic audit details
            if (!fullEvent) {
              const matchedRss = rssItems.find(item => item.id === point.id || item.title === point.name);
              if (matchedRss) {
                fullEvent = {
                  id: matchedRss.id,
                  title: matchedRss.title,
                  category: matchedRss.category || 'Political',
                  severity: matchedRss.severity || 1,
                  location: matchedRss.location || 'Unknown',
                  lat: parseFloat(matchedRss.latitude),
                  lon: parseFloat(matchedRss.longitude),
                  timestamp: matchedRss.published_at,
                  url: matchedRss.url,
                  source: matchedRss.source || 'RSS Feed',
                  details: {
                    summary: matchedRss.summary || `Source: ${matchedRss.source}. Geotagged live feed article.`,
                    isRssItem: true
                  }
                };
              }
            }
            setSelectedEvent(fullEvent || point);
          }}
          showSatellites={showSatellites}
          satellites={satellites}
          selectedSatellite={selectedSatellite}
          isTracked={isTracked}
          eventsEnabled={eventsEnabled}
          weatherEnabled={weatherEnabled}
          oilGasEnabled={oilGasEnabled}
          internetCablesEnabled={internetCablesEnabled}
          dayNightEnabled={dayNightEnabled}
          gpsJammingEnabled={gpsJammingEnabled}
          dataCentersEnabled={dataCentersEnabled}
          onSatelliteClick={(sat) => {
            setSelectedSatellite(sat);
            setIsTracked(false); // Reset tracking when selecting a new satellite
            setAutoRotate(false);
          }}
          resetKey={resetKey}
        />
      </div>

      {/* Overlay Controls */}
      {!isMinimized && (
        <div
          className="overlay-panel"
          style={{
            transform: isMobile ? 'none' : `translate(${panelPos.x}px, ${panelPos.y}px)`,
            cursor: isMobile ? 'auto' : (isDragging ? 'grabbing' : 'grab'),
            transition: isDragging ? 'none' : 'transform 0.1s ease',
            zIndex: 20,
            position: isMobile ? 'fixed' : 'absolute',
            right: isMobile ? '16px' : '20px',
            bottom: isMobile ? '80px' : '48px',
            left: isMobile ? '16px' : 'auto',
            width: isMobile ? 'auto' : '260px',
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
              🛰️ OVERLAYS
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
              style={{
                background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer',
                fontSize: '10px', display: 'flex', alignItems: 'center'
              }}
            >
              ▼
            </button>
          </div>

          <div className="overlay-section">
            <div className="overlay-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CATEGORIES</span>
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

          {/* Map Options Expandable Section */}
          <div className="overlay-section" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
            <div 
              className="overlay-title" 
              onClick={() => setIsMapOptionsExpanded(!isMapOptionsExpanded)} 
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>MAP OPTIONS</span>
              <span style={{ fontSize: '10px', color: '#38bdf8' }}>{isMapOptionsExpanded ? '▼' : '▶'}</span>
            </div>

            {isMapOptionsExpanded && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                
                {/* Map style selection */}
                <div style={{ marginBottom: '4px', paddingBottom: '6px', borderBottom: '1px solid rgba(56, 189, 248, 0.15)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', letterSpacing: '0.05em' }}>MAP VIEWPORT STYLE</div>
                  <select
                    value={mapStyle}
                    onChange={(e) => setMapStyle(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '4px',
                      padding: '4px 6px',
                      color: '#e2e8f0',
                      fontSize: '9px',
                      fontWeight: '800',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="tactical">🛰️ TACTICAL DARK</option>
                    <option value="satellite">🌍 HIGH-RES ORBITAL</option>
                    <option value="buildings">🏢 3D URBAN BUILDINGS</option>
                    <option value="lights">🌃 EARTH AT NIGHT</option>
                  </select>
                </div>

                {/* Checklist options with right-side status indicators */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  
                  {/* Events Option */}
                  <div 
                    onClick={() => setEventsEnabled(!eventsEnabled)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: eventsEnabled ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: eventsEnabled ? 1 : 0.4 }}>👁️</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Events</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: eventsEnabled ? '#ffffff' : '#334155',
                      boxShadow: eventsEnabled ? '0 0 6px #ffffff' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                  {/* Auto Rotate Option */}
                  <div 
                    onClick={() => {
                      const newRotate = !autoRotate;
                      setAutoRotate(newRotate);
                      localStorage.setItem('operator_pref_autoRotate', String(newRotate));
                      window.dispatchEvent(new Event('operator_pref_changed'));
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: autoRotate ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: autoRotate ? 1 : 0.4 }}>🔄</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Auto Rotate</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: autoRotate ? '#00f0ff' : '#334155',
                      boxShadow: autoRotate ? '0 0 6px #00f0ff' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                  {/* Weather Option */}
                  <div 
                    onClick={() => setWeatherEnabled(!weatherEnabled)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: weatherEnabled ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: weatherEnabled ? 1 : 0.4 }}>🌧️</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Weather</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: weatherEnabled ? '#00f0ff' : '#334155',
                      boxShadow: weatherEnabled ? '0 0 6px #00f0ff' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                  {/* GPS Jamming Option */}
                  <div 
                    onClick={() => setGpsJammingEnabled(!gpsJammingEnabled)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: gpsJammingEnabled ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: gpsJammingEnabled ? 1 : 0.4 }}>📡</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>GPS Jamming</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: gpsJammingEnabled ? '#ef4444' : '#334155',
                      boxShadow: gpsJammingEnabled ? '0 0 6px #ef4444' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                  {/* Data Centers Option */}
                  <div 
                    onClick={() => setDataCentersEnabled(!dataCentersEnabled)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: dataCentersEnabled ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: dataCentersEnabled ? 1 : 0.4 }}>🏢</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Data Centers</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: dataCentersEnabled ? '#00f0ff' : '#334155',
                      boxShadow: dataCentersEnabled ? '0 0 6px #00f0ff' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                  {/* Military Bases - Grayed out */}
                  <div 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      opacity: 0.35,
                      cursor: 'not-allowed',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px' }}>🛡️</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Military Bases</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#334155'
                    }} />
                  </div>

                  {/* Power & Minerals - Grayed out */}
                  <div 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      opacity: 0.35,
                      cursor: 'not-allowed',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px' }}>⚡</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Power & Minerals</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#334155'
                    }} />
                  </div>

                  {/* Oil & Gas Option */}
                  <div 
                    onClick={() => setOilGasEnabled(!oilGasEnabled)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: oilGasEnabled ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: oilGasEnabled ? 1 : 0.4 }}>💧</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Oil & Gas</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: oilGasEnabled ? '#f59e0b' : '#334155',
                      boxShadow: oilGasEnabled ? '0 0 6px #f59e0b' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                  {/* Internet & Cables Option */}
                  <div 
                    onClick={() => setInternetCablesEnabled(!internetCablesEnabled)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: internetCablesEnabled ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: internetCablesEnabled ? 1 : 0.4 }}>🌐</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Internet & Cables</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: internetCablesEnabled ? '#ec4899' : '#334155',
                      boxShadow: internetCablesEnabled ? '0 0 6px #ec4899' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                  {/* Active Fires - Grayed out */}
                  <div 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      opacity: 0.35,
                      cursor: 'not-allowed',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px' }}>🔥</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Active Fires</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#334155'
                    }} />
                  </div>

                  {/* Satellite Tracking Option */}
                  <div 
                    onClick={() => {
                      const newSatVal = !showSatellites;
                      setShowSatellites(newSatVal);
                      if (!newSatVal) {
                        setSelectedSatellite(null);
                      }
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: showSatellites ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: showSatellites ? 1 : 0.4 }}>🛰️</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Satellite Tracking</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: showSatellites ? '#00f0ff' : '#334155',
                      boxShadow: showSatellites ? '0 0 6px #00f0ff' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                  {/* Day / Night Option */}
                  <div 
                    onClick={() => setDayNightEnabled(!dayNightEnabled)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: dayNightEnabled ? '#f3f4f6' : '#64748b' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: dayNightEnabled ? 1 : 0.4 }}>🌗</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>Day / Night</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: dayNightEnabled ? '#00f0ff' : '#334155',
                      boxShadow: dayNightEnabled ? '0 0 6px #00f0ff' : 'none',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>

                </div>

                {/* Tactical Widgets */}
                <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', letterSpacing: '0.05em' }}>TACTICAL WIDGETS</div>
                  <button
                    className={`sev-btn${showMarkets ? ' active' : ''}`}
                    style={{
                      background: showMarkets ? '#10b981' : 'transparent',
                      color: showMarkets ? '#020617' : '#8892a4',
                      borderColor: '#10b981',
                      width: '100%',
                      fontSize: '9px',
                      padding: '5px 0',
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

              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Control Pill Bar (MTS Style) */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '50px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1002,
        display: 'flex',
        gap: isMobile ? '6px' : '10px',
        pointerEvents: 'auto',
        width: isMobile ? 'calc(100% - 24px)' : 'auto',
        justifyContent: 'center'
      }}>
        {/* Feed Pill Button */}
        <button 
          onClick={() => setIsFeedCollapsed(!isFeedCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            borderRadius: '24px',
            background: 'rgba(8, 12, 24, 0.85)',
            border: !isFeedCollapsed ? '1px solid #00f0ff' : '1px solid rgba(56, 189, 248, 0.25)',
            color: !isFeedCollapsed ? '#00f0ff' : '#e2e8f0',
            fontSize: isMobile ? '10px' : '11px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.05)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
            outline: 'none',
            fontFamily: 'monospace'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f0ff';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 240, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = !isFeedCollapsed ? '#00f0ff' : 'rgba(56, 189, 248, 0.25)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
          }}
        >
          <span>📋</span> {isMobile ? 'FEED' : 'LIVE FEED'}
        </button>

        {/* Support Pill Button */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowSupportDropdown(!showSupportDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '6px 12px' : '8px 16px',
              borderRadius: '24px',
              background: 'rgba(8, 12, 24, 0.85)',
              border: showSupportDropdown ? '1px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.25)',
              color: showSupportDropdown ? '#ec4899' : '#e2e8f0',
              fontSize: isMobile ? '10px' : '11px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
              outline: 'none',
              fontFamily: 'monospace'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(236, 72, 153, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = showSupportDropdown ? '#ec4899' : 'rgba(236, 72, 153, 0.25)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
            }}
          >
            <span style={{ color: '#ec4899' }}>❤️</span> SUPPORT
          </button>

          {/* Support Dropdown Card Floating Directly Above Support Pill */}
          {showSupportDropdown && (
            <div 
              style={{
                position: 'absolute',
                bottom: '42px',
                right: '50%',
                transform: 'translateX(50%)',
                width: '190px',
                background: 'rgba(8, 12, 24, 0.96)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(236, 72, 153, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 1003,
                backdropFilter: 'blur(12px)',
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              {/* Header with Close Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(236, 72, 153, 0.2)',
                paddingBottom: '6px',
                marginBottom: '2px',
                width: '100%'
              }}>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#ec4899', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                  SUPPORT CREATOR
                </span>
                <span 
                  onClick={(e) => { e.stopPropagation(); setShowSupportDropdown(false); }}
                  style={{
                    cursor: 'pointer',
                    color: 'rgba(236, 72, 153, 0.6)',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    lineHeight: '1',
                    padding: '0 4px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff2d55'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 72, 153, 0.6)'}
                  title="Close Support Menu"
                >
                  ×
                </span>
              </div>

              <a 
                href="https://patreon.com/aviperera?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                  background: 'rgba(255, 66, 77, 0.1)',
                  color: '#ff424d',
                  border: '1px solid rgba(255, 66, 77, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ff424d';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 66, 77, 0.1)';
                  e.currentTarget.style.color = '#ff424d';
                }}
              >
                <span style={{ fontSize: '12px' }}>⚡</span> Patreon
              </a>
              <a 
                href="https://buymeacoffee.com/avip" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                  background: 'rgba(255, 221, 0, 0.1)',
                  color: '#ffdd00',
                  border: '1px solid rgba(255, 221, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffdd00';
                  e.currentTarget.style.color = '#000000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 221, 0, 0.1)';
                  e.currentTarget.style.color = '#ffdd00';
                }}
              >
                <span style={{ fontSize: '12px' }}>☕</span> Buy Coffee
              </a>
            </div>
          )}
        </div>

        {/* Overlays Pill Button */}
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            borderRadius: '24px',
            background: 'rgba(8, 12, 24, 0.85)',
            border: !isMinimized ? '1px solid #00f0ff' : '1px solid rgba(0, 240, 255, 0.25)',
            color: !isMinimized ? '#00f0ff' : '#e2e8f0',
            fontSize: isMobile ? '10px' : '11px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
            outline: 'none',
            fontFamily: 'monospace'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f0ff';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 240, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = !isMinimized ? '#00f0ff' : 'rgba(0, 240, 255, 0.25)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
          }}
        >
          <span>🛰️</span> OVERLAYS
        </button>
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
            BY AVI
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
          onReportIssue={onAvatarClick}
          SEV_COLORS={SEV_COLORS}
          CAT_COLORS={CAT_COLORS}
          formatTime={formatTime}
        />
      )}

      {/* Dynamic Satellite Telemetry Sci-Fi Console */}
      {showSatellites && selectedSatellite && (
        <SatelliteDetailWindow
          satellite={selectedSatellite}
          onClose={() => {
            setSelectedSatellite(null);
            setIsTracked(false);
          }}
          isTracked={isTracked}
          onTrackToggle={() => setIsTracked(!isTracked)}
        />
      )}
    </div>
  </div>
  );
}
