'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Shield, RefreshCw, User, LogOut, Heart, Share2, Globe, Copy, Check, Plus, Rss, Bookmark, ChevronLeft } from 'lucide-react';
import EventDetailsWindow from './EventDetailsWindow';
import Link from 'next/link';
import DashboardTopMenus from './DashboardTopMenus';
import { MONTHS_2020_2026, computeTemporalSnapshot } from '@/lib/temporalMilestones';
import { getJurisdictionBySlug, resolveJurisdictionForLocation } from '@/lib/jurisdictions';
import { normalizeSignalId } from '@/lib/provenance';

const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { ssr: false });
const MarketQuotesBox = dynamic(() => import('./MarketQuotesBox'), { ssr: false });
const SatelliteDetailWindow = dynamic(() => import('./SatelliteDetailWindow'), { ssr: false });
const ChangelogBox = dynamic(() => import('./ChangelogBox'), { ssr: false });
const ResourcesModal = dynamic(() => import('./ResourcesModal'), { ssr: false });
const SourceManagerModal = dynamic(() => import('./SourceManagerModal'), { ssr: false });
const CommandPaletteModal = dynamic(() => import('./CommandPaletteModal'), { ssr: false });
const TemporalReplayBar = dynamic(() => import('./TemporalReplayBar'), { ssr: false });
const LegislativeCountdownWidget = dynamic(() => import('./LegislativeCountdownWidget'), { ssr: false });
const CensorshipPulseWidget = dynamic(() => import('./CensorshipPulseWidget'), { ssr: false });
const ComputeSafetyWidget = dynamic(() => import('./ComputeSafetyWidget'), { ssr: false });
const SovDashAiDrawer = dynamic(() => import('./SovDashAiDrawer'), { ssr: false });

const EMPTY_MILESTONES = [];

const EVENTS_POLL = 60000; // 60s visibility-gated sync for minimal CPU/network footprint

const DEFAULT_RSS_SOURCE_LIST = [
  { id: 'cisa', name: 'CISA Cyber Advisories' },
  { id: 'thn', name: 'The Hacker News' },
  { id: 'row', name: 'Rest of World Tech' },
  { id: 'mittr', name: 'MIT Tech Review AI' },
  { id: 'wired', name: 'Wired Security & Policy' },
  { id: 'eff', name: 'EFF Digital Rights' },
  { id: 'arxiv', name: 'arXiv Computers & Society' },
  { id: 'nature', name: 'Nature Machine Intel' },
  { id: 'hrw', name: 'HRW Tech & Rights' },
  { id: 'aje', name: 'Al Jazeera Tech Wire' },
  { id: 'un', name: 'UN Global Tech & Peace' },
  { id: 'aiid', name: 'AI Incident Database (AIID)' },
  { id: 'eurlex', name: 'EUR-Lex EU Official Journal' },
  { id: 'arxiv-ai', name: 'arXiv CS.AI Research' },
  { id: 'arxiv-cr', name: 'arXiv Cryptography & Security' },
  { id: 'citizenlab', name: 'Citizen Lab (Toronto)' },
  { id: 'accessnow', name: 'Access Now (Global South)' },
  { id: 'advox', name: 'Global Voices Advox' },
  { id: 'cipesa', name: 'CIPESA Africa Digital Rights' },
  { id: 'techcabal', name: 'TechCabal Africa Policy' },
  { id: 'oii', name: 'Oxford Internet Institute' },
  { id: 'cset', name: 'Georgetown CSET' },
  { id: 'ieee-ai', name: 'IEEE Spectrum AI' },
  { id: 'arxiv-lg', name: 'arXiv Machine Learning (cs.LG)' },
  { id: 'arxiv-cl', name: 'arXiv Computation & Language (cs.CL)' },
  { id: 'algorithmwatch', name: 'AlgorithmWatch Europe' },
  { id: 'fli', name: 'Future of Life Institute' },
  { id: 'apc', name: 'APC Global South Digital Rights' },
  { id: 'privacyint', name: 'Privacy International' },
  { id: 'derechos-latam', name: 'Derechos Digitales LATAM' },
  { id: 'ncsc-uk', name: 'UK NCSC Threat Advisories' },
  { id: 'therecord', name: 'The Record (Recorded Future)' },
  { id: 'krebs', name: 'Krebs on Security' },
  { id: 'schneier', name: 'Schneier on Security' },
  { id: 'bleeping', name: 'BleepingComputer Security' },
  { id: 'arstechnica-policy', name: 'Ars Technica Tech Policy' },
  { id: 'politico-tech', name: 'Politico Tech' }
];

const REGION_VIEWPORTS = [
  { id: 'global', label: '🌍 GLOBAL', lat: 20.0, lon: 12.0, reset: true },
  { id: 'europe', label: '🇪🇺 EUROPE', lat: 50.85, lon: 8.5 },
  { id: 'americas', label: '🌎 AMERICAS', lat: 34.0, lon: -92.0 },
  { id: 'indopac', label: '🌏 ASIA-PAC', lat: 24.5, lon: 118.0 },
  { id: 'mena', label: '🌐 MENA/AFR', lat: 18.0, lon: 32.0 }
];

const CAT_COLORS = {
  Conflict: '#ff2d55',
  Surveillance: '#00f0ff',
  Political: '#a855f7',
  Humanitarian: '#22c55e',
  Economic: '#facc15',
  Disaster: '#ff6b35',
};

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };

const extractFlag = (locationStr) => {
  if (!locationStr) return '🌐';
  const match = locationStr.match(/\[([A-Z]{2})\]/);
  if (match) {
    const code = match[1];
    return code.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
  }
  if (locationStr.includes('Germany')) return '🇩🇪';
  if (locationStr.includes('UK') || locationStr.includes('United Kingdom')) return '🇬🇧';
  if (locationStr.includes('Japan')) return '🇯🇵';
  if (locationStr.includes('US') || locationStr.includes('United States') || locationStr.includes('Washington')) return '🇺🇸';
  if (locationStr.includes('Belgium')) return '🇧🇪';
  if (locationStr.includes('Switzerland')) return '🇨🇭';
  if (locationStr.includes('Sweden')) return '🇸🇪';
  if (locationStr.includes('Australia')) return '🇦🇺';
  return '🌐';
};

const cleanLocationString = (locationStr) => {
  if (!locationStr) return 'Unknown Node';
  return locationStr.replace(/\s*\[[A-Z]{2}\]\s*/g, ' ');
};

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
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
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

  const lotusBase = [
    "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿",
    "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿",
    "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⣠⣆⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿",
    "⣿⣿⣿⣿⣿⣿⣿⣿⠈⠙⠻⠟⠀⣼⡟⠻⣷⡄⠹⠟⠋⢡⢹⣿⣿⣿⣿⣿⣿⣿",
    "⣿⣿⣿⣿⣿⡿⠿⠿⠀⣿⣷⡄⠸⡿⠁⡠⢻⠇⢀⣴⣿⢸⠸⠿⠿⣿⣿⣿⣿⣿",
    "⣿⠛⠛⠛⠿⠎⡄⣥⣄⠘⠿⣿⡆⢀⣼⣷⡄⠠⣿⡿⠛⣘⣬⠆⠠⠿⠛⠛⠛⢿",
    "⣿⣷⣄⠘⣶⣤⠂⣿⣿⣿⣦⠈⢀⣾⣿⣿⣿⡄⠉⣤⣾⣿⣿⢠⣠⣶⠊⢠⣾⣿",
    "⣿⣿⣿⣆⠘⢿⣰⢸⣿⣿⣿⠀⣾⣿⣿⣿⣿⣿⠀⢻⣿⣿⡟⡈⣿⠃⢠⣿⣿⣿",
    "⣿⣿⣿⣿⣦⠠⡃⢆⢻⣿⣿⠀⢻⣿⣿⣿⣿⡿⠀⢸⣿⡿⠡⠙⡁⣠⣿⣿⣿⣿",
    "⣿⣟⡉⠀⠤⣤⡭⠒⡄⠉⠛⠆⠀⠛⠿⠿⠟⠁⠠⠟⠫⢤⡔⠯⣤⡤⠄⠉⣹⣿",
    "⣿⣿⣿⣶⠄⢂⣤⣶⣾⣿⣶⡦⠀⣩⣭⣤⣄⠀⢴⣶⣾⣷⣶⣦⡀⠀⣶⣿⣿⣿",
    "⣿⣿⣿⣇⣀⣈⣭⠙⠛⠋⠉⡀⠀⢿⣿⣿⣿⠂⢀⡈⠙⣛⡛⢩⣉⣀⣘⣿⣿⣿",
    "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣤⡀⠙⠋⢁⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿",
    "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿",
    "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿"
  ];

  const asciiArt = [
    // Stage 0: Bud / Sprout roots
    lotusBase.map((line, idx) => idx >= 12 ? line : "                              ").join("\n"),
    // Stage 1: Core stem
    lotusBase.map((line, idx) => idx >= 9 ? line : "                              ").join("\n"),
    // Stage 2: Outer bloom
    lotusBase.map((line, idx) => idx >= 6 ? line : "                              ").join("\n"),
    // Stage 3: Near complete
    lotusBase.map((line, idx) => idx >= 3 ? line : "                              ").join("\n"),
    // Stage 4: Majestic Lotus Full Bloom
    lotusBase.join("\n")
  ];

  const progressFrames = [
    "▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱ 10%",
    "▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱ 30%",
    "▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱ 55%",
    "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱ 80%",
    "▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ 100%"
  ];

  useEffect(() => {
    let timer;
    const tick = () => {
      setFrame(prev => {
        if (prev === 4) {
          timer = setTimeout(tick, 450);
          return 0;
        } else {
          const next = prev + 1;
          if (next === 4) {
            timer = setTimeout(tick, 2000); // Remain in majestic full bloom for 2000ms
          } else {
            timer = setTimeout(tick, 450);
          }
          return next;
        }
      });
    };

    timer = setTimeout(tick, 450);

    const msgTimer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 1200);

    return () => {
      clearTimeout(timer);
      clearInterval(msgTimer);
    };
  }, []);

  const progressFrame = progressFrames[frame];

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
        margin: '0 auto', 
        fontSize: '10.5px', 
        lineHeight: '1.15', 
        color: '#00f0ff',
        textShadow: '0 0 12px rgba(0, 240, 255, 0.45)',
        zIndex: 1,
        whiteSpace: 'pre',
        fontFamily: 'var(--font-jetbrains-fallback), monospace',
        textAlign: 'left',
        width: 'fit-content',
        minHeight: '135px',
        display: 'flex',
        flexDirection: 'column',
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

const tourSteps = [
  {
    title: "Welcome, Analyst",
    text: "This dashboard tracks real-time global security incidents, autonomous weapons (LAWS) developments, and geopolitical conflict data. Let's take a quick walk-through of the interface.",
    selector: null
  },
  {
    title: "Tactical Map Viewport",
    text: "The main interactive visualization. Threat markers on the globe are color-coded by severity: blue represents low severity (S1), green moderate (S2), yellow alert (S3), orange high (S4), and red critical (S5). Click and drag to pan, use the scroll wheel to zoom.",
    selector: '.sigint-map-area'
  },
  {
    title: "Intelligence Feed",
    text: "This side feed logs all incoming signal telemetry chronologically. You can switch between LIVE SIGNALS, RSS FEEDS, or SPACE RADAR at the top of the feed panel.",
    selector: '.tour-sidebar-feed'
  },
  {
    title: "Search Feed",
    text: "Search filters events by title, summary, and location. You can type keywords or use advanced syntax queries to quickly isolate signals of interest.",
    selector: '.tour-search-input'
  },
  {
    title: "Shape the Dashboard",
    text: "Your feedback directly shapes Sovereign Dashboard! Click here to easily submit feature ideas, report issues, or suggest new OSINT feeds. We highly value your suggestions.",
    selector: '.tour-feedback-button'
  },
  {
    title: "Manual Refresh Control",
    text: "Need the latest intelligence or want to reset your view? Click the Refresh button to instantly update all feeds, stop active satellite tracking, and reset the globe projection back to its default viewport position.",
    selector: '.tour-refresh-button'
  },
  {
    title: "Operator Access",
    text: "Sign in with your credentials to sync your custom data overlays, map styles, Watch Zone settings, and layout presets. Register an account to unlock full analyst privileges across all your devices!",
    selector: '.tour-login-button'
  },
  {
    title: "Data Layers & Overlays",
    text: "Enrich your map with real-time global overlays: toggle active weather tracking, orbital satellites, internet cable networks, pipelines, and global data centers.",
    selector: '.overlay-panel'
  },
  {
    title: "Advanced Map Options",
    text: "Customize the visualization mode (3D Globe vs 2D Map) and viewport style. Toggle specialized data options, track specific satellites, or inspect AI regulations in countries around the world.",
    selector: '.tour-map-options'
  },
  {
    title: "Support Sovereign Dashboard",
    text: "Sovereign Dashboard (SovDash) is free and community-funded. Supporting this platform helps cover database hosting, map services, and real-time intelligence feeds.",
    selector: '.tour-support-button'
  },
  {
    title: "Ready for Launch",
    text: "Welcome to the team! You're fully briefed and ready to explore Sovereign Dashboard. Customize your interface, track threat updates, and start analyzing the map.",
    selector: null
  }
];

const getCardPosition = (rect, width = 320, height = 200) => {
  if (!rect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      position: 'fixed'
    };
  }

  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceLeft = rect.left;
  const spaceRight = window.innerWidth - rect.right;

  let top = 'auto';
  let bottom = 'auto';
  let left = 'auto';

  // Determine horizontal alignment
  // If target is on the right side of the screen and we have space on the left
  if (rect.left > window.innerWidth / 2 && spaceLeft > width + 20) {
    left = `${rect.left - width - 16}px`;
    top = `${Math.max(16, Math.min(window.innerHeight - height - 16, rect.top))}px`;
  } 
  // If target is on the left side of the screen and we have space on the right
  else if (rect.right < window.innerWidth / 2 && spaceRight > width + 20) {
    left = `${rect.right + 16}px`;
    top = `${Math.max(16, Math.min(window.innerHeight - height - 16, rect.top))}px`;
  } 
  // Fallback: center horizontally relative to target (constrained to viewport)
  else {
    const targetCenter = rect.left + rect.width / 2;
    const computedLeft = targetCenter - width / 2;
    left = `${Math.max(16, Math.min(window.innerWidth - width - 16, computedLeft))}px`;
    
    // Vertical placement fallback: place above or below
    // If there is not enough vertical space both above and below, place inside viewport
    if (spaceAbove < height + 20 && spaceBelow < height + 20) {
      if (window.innerWidth < 900) {
        // Mobile: place near the top below the header
        top = '75px';
      } else {
        // Desktop: place at a safe vertical position
        top = '120px';
      }
    } else if (spaceAbove > spaceBelow) {
      bottom = `${window.innerHeight - rect.top + 16}px`;
    } else {
      top = `${rect.bottom + 16}px`;
    }
  }

  return {
    top,
    bottom,
    left,
    transform: 'none',
    position: 'fixed'
  };
};

export default function LiveMap({
  currentUser,
  handleLogout,
  showAuthModal,
  setShowAuthModal,
  handleAuthSuccess,
  onAvatarClick,
  onOpenCms
}) {
  const [markers, setMarkers] = useState([]);
  const [allFetchedEvents, setAllFetchedEvents] = useState([]);
  const [categories, setCategories] = useState({ Conflict: true, Surveillance: true, Political: true, Humanitarian: true, Economic: true, Disaster: true });

  // Guided Tour states
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);

  // Initialize welcome modal checking
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('sovereign_tour_seen');
    if (!hasSeenTour) {
      setShowWelcomeModal(true);
    }
  }, []);

  // Functions for tour navigation
  const startTour = () => {
    setTourActive(true);
    setTourStep(0);
    setShowWelcomeModal(false);
  };

  const endTour = () => {
    setTourActive(false);
    setHighlightRect(null);
    localStorage.setItem('sovereign_tour_seen', 'true');
    localStorage.setItem('operator_pref_autoRotate', 'true');
    setAutoRotate(true);
    window.dispatchEvent(new Event('operator_pref_changed'));
  };

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const prevTourStep = () => {
    if (tourStep > 0) {
      setTourStep(prev => prev - 1);
    }
  };

  const getElementRect = (selector) => {
    if (!selector) return null;
    const el = document.querySelector(selector);
    if (!el) return null;
    return el.getBoundingClientRect();
  };

  const updateHighlightRect = useCallback(() => {
    if (!tourActive) {
      setHighlightRect(null);
      return;
    }
    const stepConfig = tourSteps[tourStep];
    if (!stepConfig || !stepConfig.selector) {
      setHighlightRect(null);
      return;
    }
    const rect = getElementRect(stepConfig.selector);
    setHighlightRect(rect);
  }, [tourActive, tourStep]);

  // Handle tour step side-effects (auto expanding sidebars, option panels, etc.)
  useEffect(() => {
    if (!tourActive) return;
    const stepConfig = tourSteps[tourStep];
    if (!stepConfig) return;

    if (stepConfig.selector === '.tour-sidebar-feed' || stepConfig.selector === '.tour-search-input') {
      setIsFeedCollapsed(false);
    }
    if (stepConfig.selector === '.overlay-panel') {
      setIsMinimized(false);
    }
    if (stepConfig.selector === '.tour-map-options') {
      setIsMinimized(false);
      setIsMapOptionsExpanded(true);
    }

    const timer = setTimeout(() => {
      updateHighlightRect();
    }, 120);
    return () => clearTimeout(timer);
  }, [tourStep, tourActive, updateHighlightRect]);

  // Recalculate highlight box position on window resize or scroll
  useEffect(() => {
    if (!tourActive) return;
    window.addEventListener('resize', updateHighlightRect);
    window.addEventListener('scroll', updateHighlightRect);
    return () => {
      window.removeEventListener('resize', updateHighlightRect);
      window.removeEventListener('scroll', updateHighlightRect);
    };
  }, [tourActive, updateHighlightRect]);
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
  const [focusCoordinate, setFocusCoordinate] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 150);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const [showMarkets, setShowMarkets] = useState(false);
  const [showLegislativeTracker, setShowLegislativeTracker] = useState(false);
  const [showCensorshipPulse, setShowCensorshipPulse] = useState(false);
  const [showComputeSafety, setShowComputeSafety] = useState(false);
  const hasSyncedBuiltInRef = useRef(false);
  const [isMapOptionsExpanded, setIsMapOptionsExpanded] = useState(false);
  const [isFeedCollapsed, setIsFeedCollapsed] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 900 : false));
  const [refreshing, setRefreshing] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [showSupportDropdown, setShowSupportDropdown] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSovDashAi, setShowSovDashAi] = useState(false);
  const [timeWindowDays, setTimeWindowDays] = useState(21);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [timelineCutoffMs, setTimelineCutoffMs] = useState(null);
  const [activeRegionId, setActiveRegionId] = useState('global');
  const searchInputRef = useRef(null);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShareDashboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      // Default to sharing the deployed dashboard landing/main URL
      navigator.clipboard.writeText('https://app.sovdash.com/');
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };
  const [visibleRssCount, setVisibleRssCount] = useState(30);
  const [visibleEventCount, setVisibleEventCount] = useState(30);

  const [timeRange, setTimeRange] = useState('recent'); 
  const [isVisible, setIsVisible] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 900 : false));
  const [feedType, setFeedType] = useState('live'); // 'live' | 'papers' | 'rss' | 'satellites'
  const [vaultPapers, setVaultPapers] = useState([]);
  const [uiTheme, setUiTheme] = useState('obsidian');
  const [rssItems, setRssItems] = useState([]);
  const [onlineCount, setOnlineCount] = useState(null);
  const [rssStatus, setRssStatus] = useState('loading');
  const [rssLoading, setRssLoading] = useState(true);
  const [activeRssTab, setActiveRssTab] = useState('all');
  const [isRssDropdownOpen, setIsRssDropdownOpen] = useState(false);
  const [availableRssSources, setAvailableRssSources] = useState(DEFAULT_RSS_SOURCE_LIST);
  const [selectedRssSources, setSelectedRssSources] = useState(() => DEFAULT_RSS_SOURCE_LIST.map(s => s.id));
  const [mapMode, setMapMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('operator_pref_mapMode') || '3d';
    }
    return '3d';
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
      return stored === 'true';
    }
    return false;
  });
  const [tickerSpeed, setTickerSpeed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('operator_pref_tickerSpeed') || 'slow';
    }
    return 'slow';
  });
  
  const [isMobile, setIsMobile] = useState(false);
  const mapAreaRef = useRef(null);

  // Opt-in Satellite Tracking Layer (off by default to keep initial GPU/network overhead near zero)
  const [showSatellites, setShowSatellites] = useState(false);

  // Hydrate & apply global UI color theme
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('sovdash_ui_theme') || 'obsidian';
      setUiTheme(savedTheme);
      document.documentElement.setAttribute('data-ui-theme', savedTheme);
    } catch {}
  }, []);

  const handleSelectUiTheme = useCallback((nextTheme) => {
    setUiTheme(nextTheme);
    try {
      localStorage.setItem('sovdash_ui_theme', nextTheme);
      document.documentElement.setAttribute('data-ui-theme', nextTheme);
    } catch {}
    if (nextTheme === 'light') {
      setMapStyle('light');
      try { localStorage.setItem('operator_pref_mapStyle', 'light'); } catch {}
    } else if (mapStyle === 'light') {
      setMapStyle('tactical');
      try { localStorage.setItem('operator_pref_mapStyle', 'tactical'); } catch {}
    }
  }, [mapStyle]);
  const [bookmarks, setBookmarks] = useState([]);

  const getBookmarkKey = useCallback((ev) => {
    if (!ev) return '';
    return String(ev.eventId || ev.id || ev.url || ev.title || '').trim();
  }, []);

  const isBookmarked = useCallback((ev) => {
    const key = getBookmarkKey(ev);
    if (!key) return false;
    const normUrl = (ev?.url || '').toLowerCase().split('?')[0].replace(/\/+$/, '');
    return bookmarks.some((b) => {
      const bKey = String(b.eventId || b.id || '');
      const bUrl = (b.url || '').toLowerCase().split('?')[0].replace(/\/+$/, '');
      return bKey === key || (normUrl && bUrl && normUrl === bUrl);
    });
  }, [bookmarks, getBookmarkKey]);

  const loadLocalBookmarks = useCallback(() => {
    try {
      const rawStored = localStorage.getItem('sovdash_bookmarks');
      const parsed = rawStored ? JSON.parse(rawStored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  // Hydrate & sync bookmarks (localStorage for guests, Neon Postgres /api/bookmarks for signed-in users)
  useEffect(() => {
    let active = true;
    const syncBookmarks = async () => {
      const guestList = loadLocalBookmarks();
      if (!currentUser?.email) {
        if (active) setBookmarks(guestList);
        return;
      }
      try {
        const res = await fetch('/api/bookmarks', { cache: 'no-store' });
        const data = await res.json();
        let serverList = Array.isArray(data?.bookmarks) ? data.bookmarks : [];
        const serverIds = new Set(serverList.map((b) => String(b.eventId || b.id || '')));
        // Upload any guest bookmarks queued prior to login
        for (const g of guestList) {
          const gId = String(g.eventId || g.id || '');
          if (gId && !serverIds.has(gId)) {
            await fetch('/api/bookmarks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(g)
            }).catch(() => {});
          }
        }
        if (guestList.some((g) => !serverIds.has(String(g.eventId || g.id || '')))) {
          const refreshed = await fetch('/api/bookmarks', { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
          if (Array.isArray(refreshed?.bookmarks)) serverList = refreshed.bookmarks;
        }
        if (active) {
          setBookmarks(serverList);
          try { localStorage.setItem('sovdash_bookmarks', JSON.stringify(serverList)); } catch {}
        }
      } catch {
        if (active) setBookmarks(guestList);
      }
    };
    syncBookmarks();

    const onChanged = () => {
      setBookmarks(loadLocalBookmarks());
    };
    const onFocusBookmark = (evt) => {
      const bm = evt?.detail;
      if (!bm) return;
      const lat = parseFloat(bm.lat);
      const lon = parseFloat(bm.lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        setFocusCoordinate({ lat, lon, timestamp: Date.now() });
      }
      setSelectedEvent({
        id: bm.eventId || bm.id,
        title: bm.title,
        category: bm.category || 'Political',
        severity: bm.severity || 3,
        location: bm.location || 'Global',
        lat: Number.isNaN(lat) ? undefined : lat,
        lon: Number.isNaN(lon) ? undefined : lon,
        source: bm.source || 'Sovereign',
        url: bm.url || '',
        timestamp: bm.timestamp || bm.createdAt,
        details: { summary: bm.summary || '' }
      });
    };
    window.addEventListener('sovereign_bookmarks_changed', onChanged);
    window.addEventListener('sovereign_focus_bookmark', onFocusBookmark);
    return () => {
      active = false;
      window.removeEventListener('sovereign_bookmarks_changed', onChanged);
      window.removeEventListener('sovereign_focus_bookmark', onFocusBookmark);
    };
  }, [currentUser?.email, loadLocalBookmarks]);

  const toggleBookmark = useCallback(async (ev) => {
    const key = getBookmarkKey(ev);
    if (!key) return;
    const currentlySaved = isBookmarked(ev);
    const payload = {
      eventId: key,
      id: ev.id || key,
      title: ev.title || 'Untitled Signal',
      category: ev.category || 'Political',
      severity: ev.severity || 2,
      location: ev.location || 'Global',
      lat: ev.lat ?? ev.latitude ?? null,
      lon: ev.lon ?? ev.longitude ?? null,
      source: ev.source || ev.details?.source || 'Sovereign',
      url: ev.url || '',
      summary: (ev.details?.summary || ev.summary || '').slice(0, 600),
      timestamp: ev.original_post_time || ev.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const nextList = currentlySaved
      ? bookmarks.filter((b) => String(b.eventId || b.id || '') !== key)
      : [payload, ...bookmarks.filter((b) => String(b.eventId || b.id || '') !== key)];

    setBookmarks(nextList);
    try { localStorage.setItem('sovdash_bookmarks', JSON.stringify(nextList)); } catch {}
    window.dispatchEvent(new Event('sovereign_bookmarks_changed'));

    if (currentUser?.email) {
      try {
        if (currentlySaved) {
          await fetch(`/api/bookmarks?eventId=${encodeURIComponent(key)}`, { method: 'DELETE' });
        } else {
          await fetch('/api/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch {}
    }
  }, [bookmarks, currentUser?.email, getBookmarkKey, isBookmarked]);

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
  const [aiRegulationsEnabled, setAiRegulationsEnabled] = useState(false);
  const [censorshipEnabled, setCensorshipEnabled] = useState(false);
  const [envJusticeEnabled, setEnvJusticeEnabled] = useState(false);
  const [supplyChainEnabled, setSupplyChainEnabled] = useState(false);
  const [biometricWelfareEnabled, setBiometricWelfareEnabled] = useState(false);
  const [aiLaborEnabled, setAiLaborEnabled] = useState(false);
  const [isEthicsLayersExpanded, setIsEthicsLayersExpanded] = useState(true);

  const [temporalReplayActive, setTemporalReplayActive] = useState(false);
  const [temporalMonthIdx, setTemporalMonthIdx] = useState(MONTHS_2020_2026.length - 2);
  const [temporalBaselineYm, setTemporalBaselineYm] = useState('2022-10');
  const [temporalTracks, setTemporalTracks] = useState({ law: true, institute: true, compute: true });
  const temporalSnapshot = useMemo(() => {
    if (!temporalReplayActive) {
      return { milestones: EMPTY_MILESTONES, metrics: null };
    }
    const ym = MONTHS_2020_2026[temporalMonthIdx] || '2026-11';
    return computeTemporalSnapshot(ym, temporalBaselineYm, temporalTracks);
  }, [temporalReplayActive, temporalMonthIdx, temporalBaselineYm, temporalTracks]);



  // Hydrate custom intelligence sources from DB so they appear in filters & auto-pins
  const syncAvailableSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const builtIn = (data.builtInSources || DEFAULT_RSS_SOURCE_LIST).map(s => ({ id: s.id || s.sid, name: s.name }));
      const custom = (data.customSources || []).map(s => ({ id: s.sid || s.id, name: s.name, isCustom: true }));
      const mergedMap = new Map();
      [...builtIn, ...custom].forEach(s => {
        if (s.id) mergedMap.set(s.id, s);
      });
      const mergedList = Array.from(mergedMap.values());
      setAvailableRssSources(mergedList);
      setSelectedRssSources(prev => {
        const next = new Set(prev);
        if (!hasSyncedBuiltInRef.current) {
          hasSyncedBuiltInRef.current = true;
          builtIn.forEach(s => { if (s.id) next.add(s.id); });
        }
        custom.forEach(c => { if (c.id) next.add(c.id); });
        return Array.from(next);
      });
    } catch (e) {
      // Fallback to built-in list silently
    }
  }, []);

  useEffect(() => {
    syncAvailableSources();
  }, [syncAvailableSources]);

  // Keyboard ergonomics: Cmd/Ctrl+K opens Command Palette, '/' focuses signal search, 'Escape' dismisses modals
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        return;
      }
      const tag = (e.target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        setIsFeedCollapsed(false);
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (showSovDashAi) setShowSovDashAi(false);
        else if (showCommandPalette) setShowCommandPalette(false);
        else if (showSourceModal) setShowSourceModal(false);
        else if (showResourcesModal) setShowResourcesModal(false);
        else if (showChangelog) setShowChangelog(false);
        else if (selectedEvent) setSelectedEvent(null);
        else if (selectedCountry) setSelectedCountry(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSovDashAi, showCommandPalette, showSourceModal, showResourcesModal, showChangelog, selectedEvent, selectedCountry]);

  // Historical Timeline Playback Scrubber (12 chronological steps scoped to timeWindowDays)
  useEffect(() => {
    if (!isTimelinePlaying) return;
    const now = Date.now();
    const windowFloor = timeWindowDays < 365 ? now - timeWindowDays * 86400000 : 0;
    const times = [...markers, ...allFetchedEvents]
      .map((ev) => parseDateSafe(ev.original_post_time || ev.timestamp).getTime())
      .filter((t) => t > 0 && t >= windowFloor)
      .sort((a, b) => a - b);
    if (times.length < 2) {
      setIsTimelinePlaying(false);
      return;
    }
    const minTs = times[0];
    const maxTs = Math.max(times[times.length - 1], minTs + 86400000);
    const span = maxTs - minTs;
    let step = 1;
    const totalSteps = 12;
    setTimelineCutoffMs(minTs + Math.round(span / totalSteps));
    const id = setInterval(() => {
      step += 1;
      if (step > totalSteps) {
        setIsTimelinePlaying(false);
        setTimelineCutoffMs(null);
        clearInterval(id);
        return;
      }
      setTimelineCutoffMs(minTs + Math.round((span * step) / totalSteps));
    }, 750);
    return () => clearInterval(id);
  }, [isTimelinePlaying, timeWindowDays]);

  // Dynamic 15-second visibility-gated telemetry polling interval for space satellites
  useEffect(() => {
    if (!showSatellites) {
      setSatellites([]);
      return;
    }

    const fetchSatellites = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
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
    const interval = setInterval(fetchSatellites, 15000);
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
      setMapMode(localStorage.getItem('operator_pref_mapMode') || '3d');
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

  // Force auto-rotate behavior based on tour status when page loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenTour = localStorage.getItem('sovereign_tour_seen');
      if (!hasSeenTour) {
        // New user: do not auto-rotate initially
        setAutoRotate(false);
      } else {
        const rotate = localStorage.getItem('operator_pref_autoRotate');
        setAutoRotate(rotate === 'true');
      }
    }
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

  const [activeUsersList, setActiveUsersList] = useState([]);

  // Send login audit once for authenticated operators only (no anonymous polling overhead)
  useEffect(() => {
    if (!currentUser?.email) return;
    fetch('/api/admin/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id || '' },
      body: JSON.stringify({
        email: currentUser.email,
        name: currentUser.fullName || currentUser.full_name || 'Operator',
        isLogin: true
      })
    }).catch(() => {});
  }, [currentUser?.email, currentUser?.id]);

  // Lazy-fetch peer-reviewed / institutional vault papers when PAPERS tab is selected
  useEffect(() => {
    if (feedType !== 'papers' || vaultPapers.length > 0) return;
    fetch('/api/vault')
      .then((res) => (res.ok ? res.json() : []))
      .then((docs) => {
        if (!Array.isArray(docs)) return;
        setVaultPapers(
          docs.map((d, idx) => ({
            id: d.id || `vault-${idx}`,
            title: d.title || d.filename || 'Sovereign Research Dossier',
            category: 'Political',
            severity: 3,
            location: 'Cambridge / Global Research',
            timestamp: d.lastModified || d.createdAt || new Date().toISOString(),
            original_post_time: d.lastModified || d.createdAt || new Date().toISOString(),
            url: 'https://app.sovdash.com/whitepaper',
            source: 'Sovereign Research Archive',
            curated: true,
            details: { summary: d.preview || d.content?.slice(0, 260) || '', isResearch: true, source: 'Sovereign Research Archive' }
          }))
        );
      })
      .catch(() => {});
  }, [feedType, vaultPapers.length]);

  const fetchEvents = useCallback(async (refresh = false) => {
    if (!isVisible) return; // Don't fetch if tab is hidden
    try {
      const apiTimespan = timeWindowDays >= 365 ? 'all' : timeWindowDays >= 90 ? '90d' : 'today';
      const res = await fetch(`/api/events?timespan=${apiTimespan}${refresh ? '&refresh=true' : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.events?.length) {
        setAllFetchedEvents(data.events);
        setDisplayedEvents(prevDisplay => {
          if (isInitializing || prevDisplay.length === 0) {
            setIsInitializing(false);
            // On initial load, display all events instantly (no trickle queue)
            return [...data.events].reverse().map((e, idx) => ({ ...e, _displayKey: `${e.id}-init-${idx}` }));
          } else {
            // Map over prevDisplay and replace/update any existing events with their latest data from fetch
            const updatedDisplay = prevDisplay.map(p => {
              const latest = data.events.find(e => e.id === p.id);
              if (latest) {
                return { ...latest, _displayKey: p._displayKey };
              }
              return p;
            });
            // Prepend only the brand new streamed events
            const newEvents = data.events.filter(e => !prevDisplay.some(p => p.id === e.id));
            if (newEvents.length > 0) {
              setIsPulsing(true);
              setTimeout(() => setIsPulsing(false), 2000);
              return [...newEvents.reverse().map((e, idx) => ({ ...e, _displayKey: `${e.id}-stream-${idx}` })), ...updatedDisplay];
            }
            return updatedDisplay;
          }
        });
        setMarkers(data.markers || []);
      }
      setStatus(data.status === 'success' || data.status === 'live' ? 'live' : (data.status || 'live'));
    } catch { setStatus('error'); }
  }, [isInitializing, isVisible, timeRange, timeWindowDays]);

  const fetchRss = useCallback(async (refresh = false) => {
    if (!isVisible) return;
    setRssLoading(true);
    try {
      const res = await fetch(`/api/rss${refresh ? '?refresh=true' : ''}`, { cache: 'no-store' });
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
    await Promise.all([fetchEvents(true), fetchRss(true)]);
    setRefreshing(false);
  }, [fetchEvents, fetchRss]);

  const handleEventUpdate = useCallback((updatedEvent) => {
    const getNormTitle = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);
    const getNormUrl = (u) => {
      if (!u) return '';
      return u.toLowerCase().split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    };

    const normTitle = getNormTitle(updatedEvent.title);
    const normUrl = getNormUrl(updatedEvent.url);

    if (updatedEvent.archived) {
      // 1. Deselect if it was the selected event
      setSelectedEvent(prev => {
        if (!prev) return null;
        const matchId = prev.id === updatedEvent.id;
        const matchTitle = getNormTitle(prev.title) === normTitle;
        const matchUrl = normUrl && getNormUrl(prev.url) === normUrl;
        if (matchId || matchTitle || matchUrl) {
          return null;
        }
        return prev;
      });

      // 2. Filter out from displayedEvents
      setDisplayedEvents(prev => prev.filter(ev => {
        const matchId = ev.id === updatedEvent.id;
        const matchTitle = getNormTitle(ev.title) === normTitle;
        const matchUrl = normUrl && getNormUrl(ev.url) === normUrl;
        return !matchId && !matchTitle && !matchUrl;
      }));

      // 3. Filter out from allFetchedEvents
      setAllFetchedEvents(prev => prev.filter(ev => {
        const matchId = ev.id === updatedEvent.id;
        const matchTitle = getNormTitle(ev.title) === normTitle;
        const matchUrl = normUrl && getNormUrl(ev.url) === normUrl;
        return !matchId && !matchTitle && !matchUrl;
      }));

      // 4. Filter out from markers
      setMarkers(prev => prev.filter(m => {
        const mId = String(m.id || '').replace(/^db-/, '').replace(/^rss-/, '');
        const uId = String(updatedEvent.id).replace(/^db-/, '').replace(/^rss-/, '');
        const matchId = mId === uId;
        const matchTitle = getNormTitle(m.name || m.title) === normTitle;
        const matchUrl = normUrl && getNormUrl(m.url) === normUrl;
        return !matchId && !matchTitle && !matchUrl;
      }));

      // 5. Filter out from rssItems
      setRssItems(prev => prev.filter(item => {
        const itemId = String(item.id || '').replace(/^db-/, '').replace(/^rss-/, '');
        const uId = String(updatedEvent.id).replace(/^db-/, '').replace(/^rss-/, '');
        const matchId = itemId === uId;
        const matchTitle = getNormTitle(item.title) === normTitle;
        const matchUrl = normUrl && getNormUrl(item.url) === normUrl;
        return !matchId && !matchTitle && !matchUrl;
      }));

      // 6. Dispatch global custom event to trigger DB refreshes across elements
      window.dispatchEvent(new CustomEvent('sigint-db-update'));
      return;
    }

    // 1. Update the open detail window instantly
    setSelectedEvent(updatedEvent);
    
    // 2. Trigger map camera focus transition to new geocoded coordinates
    if (!updatedEvent.preventFocus) {
      setFocusCoordinate({
        lat: updatedEvent.lat,
        lon: updatedEvent.lon,
        timestamp: Date.now()
      });
    }

    // 3. Update displayedEvents and allFetchedEvents instantly in client-side state
    setDisplayedEvents(prev => prev.map(ev => {
      const matchId = ev.id === updatedEvent.id;
      const matchTitle = getNormTitle(ev.title) === normTitle;
      const matchUrl = normUrl && getNormUrl(ev.url) === normUrl;
      if (matchId || matchTitle || matchUrl) {
        return { ...ev, ...updatedEvent, edited: true };
      }
      return ev;
    }));

    setAllFetchedEvents(prev => prev.map(ev => {
      const matchId = ev.id === updatedEvent.id;
      const matchTitle = getNormTitle(ev.title) === normTitle;
      const matchUrl = normUrl && getNormUrl(ev.url) === normUrl;
      if (matchId || matchTitle || matchUrl) {
        return { ...ev, ...updatedEvent, edited: true };
      }
      return ev;
    }));

    // 4. Update markers instantly
    setMarkers(prev => prev.map(m => {
      const mId = String(m.id || '').replace(/^db-/, '').replace(/^rss-/, '');
      const uId = String(updatedEvent.id).replace(/^db-/, '').replace(/^rss-/, '');
      const matchId = mId === uId;
      const matchTitle = getNormTitle(m.name || m.title) === normTitle;
      const matchUrl = normUrl && getNormUrl(m.url) === normUrl;
      if (matchId || matchTitle || matchUrl) {
        return {
          ...m,
          lat: parseFloat(updatedEvent.lat),
          lon: parseFloat(updatedEvent.lon),
          name: updatedEvent.title,
          location: updatedEvent.location,
          category: updatedEvent.category,
          severity: updatedEvent.severity,
          url: updatedEvent.url,
          edited: true
        };
      }
      return m;
    }));

    // 5. Update rssItems instantly
    setRssItems(prev => prev.map(item => {
      const itemId = String(item.id || '').replace(/^db-/, '').replace(/^rss-/, '');
      const uId = String(updatedEvent.id).replace(/^db-/, '').replace(/^rss-/, '');
      const matchId = itemId === uId;
      const matchTitle = getNormTitle(item.title) === normTitle;
      const matchUrl = normUrl && getNormUrl(item.url) === normUrl;
      if (matchId || matchTitle || matchUrl) {
        return {
          ...item,
          title: updatedEvent.title,
          location: updatedEvent.location,
          latitude: parseFloat(updatedEvent.lat),
          longitude: parseFloat(updatedEvent.lon),
          category: updatedEvent.category,
          severity: updatedEvent.severity,
          summary: updatedEvent.details?.summary || updatedEvent.summary || item.summary,
          edited: true
        };
      }
      return item;
    }));

    // 6. Dispatch global custom event to trigger DB refreshes across elements
    window.dispatchEvent(new CustomEvent('sigint-db-update'));
  }, []);

  const deepLinkAppliedRef = useRef(false);

  useEffect(() => {
    fetchEvents();
    fetchRss(false);
    const interval = setInterval(fetchEvents, EVENTS_POLL);
    return () => clearInterval(interval);
  }, [fetchEvents, fetchRss]);

  // Hydrate deep-linked ?signal=<id> or ?country=<name> query parameters once initial events arrive
  useEffect(() => {
    if (deepLinkAppliedRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetSignal = params.get('signal');
    const targetCountry = params.get('country');
    if (!targetSignal && !targetCountry) {
      deepLinkAppliedRef.current = true;
      return;
    }

    if (targetCountry) {
      deepLinkAppliedRef.current = true;
      setSelectedCountry(targetCountry);
      const jur = getJurisdictionBySlug(targetCountry) || resolveJurisdictionForLocation(targetCountry);
      if (jur && jur.lat != null && jur.lon != null) {
        setFocusCoordinate({ lat: jur.lat, lon: jur.lon, timestamp: Date.now() });
      }
      return;
    }

    if (targetSignal && allFetchedEvents.length > 0) {
      const normalizedTarget = normalizeSignalId(targetSignal);
      const found =
        allFetchedEvents.find((ev) => normalizeSignalId(ev.id) === normalizedTarget) ||
        markers.find((m) => normalizeSignalId(m.id) === normalizedTarget);
      if (found) {
        deepLinkAppliedRef.current = true;
        setSelectedEvent(found);
        if (found.lat != null && found.lon != null) {
          setFocusCoordinate({ lat: Number(found.lat), lon: Number(found.lon), timestamp: Date.now() });
        }
      }
    }
  }, [allFetchedEvents, markers]);

  // Auto-detect stale data and trigger a background refresh via the cron endpoint
  useEffect(() => {
    if (!allFetchedEvents || allFetchedEvents.length === 0) return;
    const newestTs = allFetchedEvents.reduce((newest, ev) => {
      const ts = new Date(ev.original_post_time || ev.timestamp).getTime();
      return ts > newest ? ts : newest;
    }, 0);
    const ageMs = Date.now() - newestTs;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (ageMs > ONE_DAY) {
      console.log(`[SIGINT Staleness] Data is ${Math.round(ageMs / 3600000)}h old. Triggering background refresh...`);
      fetchEvents(true);
      fetchRss(true);
    }
  }, [allFetchedEvents, fetchRss]);

  // Listen for Admin CMS updates to immediately refresh map markers & data feeds
  useEffect(() => {
    const handleAdminRefresh = (e) => {
      console.log("[SIGINT] Event update detected, refreshing tactical globe data...");
      if (e?.detail) {
        // Perform synchronous state update instantly!
        handleEventUpdate(e.detail);
      }
      fetchEvents(true);
      fetchRss(true);
    };
    window.addEventListener('event_updated', handleAdminRefresh);
    return () => window.removeEventListener('event_updated', handleAdminRefresh);
  }, [fetchEvents, fetchRss, handleEventUpdate]);

  const toggleCategory = (key) => setCategories(c => ({ ...c, [key]: !c[key] }));

  // Memoize filtered data to prevent unnecessary re-renders
  const displayedMarkers = useMemo(() => {
    // 1. Map base GDELT/INTEL markers safely
    const baseMarkers = markers.map(m => ({
      ...m,
      lat: parseFloat(m.lat),
      lon: parseFloat(m.lon)
    }));

    // 2. Map RSS Feed items containing verified sovereign/city locations (never unlocated 'Global / Multilateral' items)
    const rssMarkers = rssItems
      .filter(item =>
        selectedRssSources.includes(item.sid) &&
        item.latitude !== null &&
        item.longitude !== null &&
        item.location !== 'Global / Multilateral' &&
        item.location !== 'Global / Non-Territorial' &&
        !isNaN(parseFloat(item.latitude)) &&
        !isNaN(parseFloat(item.longitude))
      )
      .map(item => ({
        id: item.id || `rss-${item.url}`,
        name: item.title,
        title: item.title,
        category: item.category || 'Political',
        severity: item.severity || 2,
        location: item.location || 'Unknown',
        lat: parseFloat(item.latitude),
        lon: parseFloat(item.longitude),
        timestamp: item.published_at,
        url: item.url,
        source: item.source,
        edited: item.edited,
        details: {
          summary: item.summary || `Source: ${item.source}. Verified international policy signal.`,
          domainPillar: item.domainPillar,
          isRssItem: true,
          edited: item.edited
        }
      }));

    // 3. Combine base SIGINT with tactical RSS feeds
    const allCombined = [...baseMarkers, ...rssMarkers];

    // 4. Client-side Deduplication by normalized title and URL
    const seenTitles = new Map(); // normalized title -> marker
    const seenUrls = new Map();   // normalized URL -> marker
    const deduplicated = [];

    const getNormTitle = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);
    const getNormUrl = (u) => {
      if (!u) return '';
      return u.toLowerCase().split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    };

    allCombined.forEach(m => {
      const normTitle = getNormTitle(m.name || m.title);
      const normUrl = getNormUrl(m.url);
      
      const isEdited = m.edited === true || m.edited === 'true' || m.details?.edited === true || m.details?.edited === 'true';

      let duplicateMarker = null;

      if (normTitle && seenTitles.has(normTitle)) {
        duplicateMarker = seenTitles.get(normTitle);
      } else if (normUrl && seenUrls.has(normUrl)) {
        duplicateMarker = seenUrls.get(normUrl);
      }

      if (duplicateMarker) {
        // Choose the best duplicate
        const existingEdited = duplicateMarker.edited === true || duplicateMarker.edited === 'true' || duplicateMarker.details?.edited === true || duplicateMarker.details?.edited === 'true';
        
        if (isEdited && !existingEdited) {
          const idx = deduplicated.indexOf(duplicateMarker);
          if (idx !== -1) {
            deduplicated[idx] = m;
          }
          if (normTitle) seenTitles.set(normTitle, m);
          if (normUrl) seenUrls.set(normUrl, m);
        }
        else if (isEdited === existingEdited) {
          const newIsRss = m.id.startsWith('rss') || m.details?.isRssItem;
          const oldIsRss = duplicateMarker.id.startsWith('rss') || duplicateMarker.details?.isRssItem;
          if (oldIsRss && !newIsRss) {
            const idx = deduplicated.indexOf(duplicateMarker);
            if (idx !== -1) {
              deduplicated[idx] = m;
            }
            if (normTitle) seenTitles.set(normTitle, m);
            if (normUrl) seenUrls.set(normUrl, m);
          }
        }
      } else {
        deduplicated.push(m);
        if (normTitle) seenTitles.set(normTitle, m);
        if (normUrl) seenUrls.set(normUrl, m);
      }
    });

    // Filter combined list by categories, minSeverity, active timeWindowDays & playback scrubber
    const windowMinMs = timeWindowDays < 365 ? Date.now() - timeWindowDays * 86400000 : 0;
    let filtered = deduplicated.filter(m => {
      if (!categories[m.category] || m.severity < minSeverity) return false;
      const tMs = parseDateSafe(m.original_post_time || m.timestamp).getTime();
      if (windowMinMs > 0 && !m.isPinned && tMs > 0 && tMs < windowMinMs) return false;
      if (timelineCutoffMs !== null && tMs > 0 && tMs > timelineCutoffMs) return false;
      return true;
    });

    if (debouncedSearchQuery.trim() !== '') {
      filtered = filtered.filter(m => matchAdvancedQuery(m, debouncedSearchQuery));
    }

    // Cap per-hub pin density & apply deterministic golden-angle micro-offsets so pins never stack or drift into oceans
    const hubCounts = {};
    const dispersed = [];

    for (const m of filtered) {
      const latVal = parseFloat(m.lat);
      const lonVal = parseFloat(m.lon);
      if (isNaN(latVal) || isNaN(lonVal)) continue;

      // Group nearby coordinates within ~16km city hub bucket
      const hubKey = `${Math.round(latVal / 0.15)},${Math.round(lonVal / 0.15)}`;
      const count = hubCounts[hubKey] || 0;

      // Prevent automated feed spam from crowding any single city while always preserving pinned/edited dossiers
      if (count >= 2 && !m.isPinned && !m.isEdited) {
        continue;
      }
      hubCounts[hubKey] = count + 1;

      if (count === 0) {
        dispersed.push({ ...m, lat: latVal, lon: lonVal });
        continue;
      }

      // Golden-angle (137.508 deg) land-safe micro-spiral separating co-located markers clearly
      const angle = count * 2.39996323;
      const radius = Math.min(0.65, 0.28 * Math.sqrt(count));
      const dLat = radius * Math.cos(angle);
      const cosLat = Math.max(0.25, Math.cos((latVal * Math.PI) / 180.0));
      const dLon = (radius * Math.sin(angle)) / cosLat;

      dispersed.push({
        ...m,
        lat: Number((latVal + dLat).toFixed(5)),
        lon: Number((lonVal + dLon).toFixed(5))
      });
    }

    // Guarantee the actively inspected/located event or RSS wire signal always renders on the globe
    if (selectedEvent) {
      const selLat = parseFloat(selectedEvent.lat ?? selectedEvent.latitude);
      const selLon = parseFloat(selectedEvent.lon ?? selectedEvent.longitude);
      if (Number.isFinite(selLat) && Number.isFinite(selLon)) {
        const selId = String(selectedEvent.id || '');
        const selNorm = getNormTitle(selectedEvent.title || selectedEvent.name);
        const alreadyPresent = dispersed.some(
          d => (selId && String(d.id || '') === selId) || (selNorm && getNormTitle(d.title || d.name) === selNorm)
        );
        if (!alreadyPresent) {
          dispersed.push({
            ...selectedEvent,
            name: selectedEvent.title || selectedEvent.name,
            title: selectedEvent.title || selectedEvent.name,
            category: selectedEvent.category || 'Political',
            severity: selectedEvent.severity || 2,
            lat: selLat,
            lon: selLon
          });
        }
      }
    }

    return dispersed;
  }, [markers, rssItems, categories, minSeverity, debouncedSearchQuery, selectedRssSources, timeWindowDays, timelineCutoffMs, selectedEvent]);

  const filteredEvents = useMemo(() => {
    let activeCategories = Object.keys(categories).filter(c => categories[c]);

    // Transform live tactical RSS items into standardized feed events
    const formattedRssEvents = (rssItems || [])
      .filter(item => selectedRssSources.includes(item.sid))
      .map(item => ({
        id: item.id || `rss-${item.url}`,
        title: item.title,
        category: item.category || 'Conflict',
        severity: item.severity || 1,
        location: item.location || 'Unknown',
        lat: parseFloat(item.latitude),
        lon: parseFloat(item.longitude),
        timestamp: item.published_at || item.pubDate,
        original_post_time: item.published_at || item.pubDate,
        url: item.url,
        source: item.source || 'RSS Feed',
        edited: item.edited,
        curated: false,
        details: {
          summary: item.summary || `Source: ${item.source}. Geotagged live feed article.`,
          isRssItem: true,
          isAcademic: Boolean(item.isAcademic),
          sid: item.sid || '',
          verificationStatus: 'active',
          source: item.source
        }
      }));

    const RESEARCH_SOURCE_RE = /(arxiv|nature|mit tech|citizen\s*lab|oxford internet|oii|ieee|algorithmwatch|future of life|fli|oecd|nist|aisi|metr|epoch|sipri|unesco|african\s*union|cset|stanford|cambridge|brookings|rand|carnegie|hrw|eff|un|eur-lex|aiid|cipesa|access\s*now|advox|privacy international|apc|derechos digitales|sovereign research)/i;
    const allCandidateEvents = feedType === 'papers'
      ? [...vaultPapers, ...displayedEvents, ...formattedRssEvents]
      : [...displayedEvents, ...formattedRssEvents];

    let filtered = allCandidateEvents.filter(e => {
      if (feedType !== 'papers') return true;
      const srcHay = `${e.source || ''} ${e.details?.source || ''} ${e.details?.sid || ''}`;
      return Boolean(e.details?.isAcademic || e.details?.isResearch || e.curated || RESEARCH_SOURCE_RE.test(srcHay));
    });
    
    if (activeCategories.length > 0) {
      filtered = filtered.filter(e => activeCategories.includes(e.category));
    }

    if (debouncedSearchQuery.trim() !== '') {
      filtered = filtered.filter(e => matchAdvancedQuery(e, debouncedSearchQuery));
    }

    // Deduplicate feed events by normalized title and URL, prioritizing manually edited ones
    const seenTitles = new Map();
    const seenUrls = new Map();
    const deduplicated = [];

    const getNormTitle = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);
    const getNormUrl = (u) => {
      if (!u) return '';
      return u.toLowerCase().split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    };

    filtered.forEach(e => {
      const normTitle = getNormTitle(e.title);
      const normUrl = getNormUrl(e.url);
      const isEdited = e.edited === true || e.edited === 'true';

      let duplicate = null;
      if (normTitle && seenTitles.has(normTitle)) {
        duplicate = seenTitles.get(normTitle);
      } else if (normUrl && seenUrls.has(normUrl)) {
        duplicate = seenUrls.get(normUrl);
      }

      if (duplicate) {
        const existingEdited = duplicate.edited === true || duplicate.edited === 'true';
        if (isEdited && !existingEdited) {
          const idx = deduplicated.indexOf(duplicate);
          if (idx !== -1) {
            deduplicated[idx] = e;
          }
          if (normTitle) seenTitles.set(normTitle, e);
          if (normUrl) seenUrls.set(normUrl, e);
        }
      } else {
        deduplicated.push(e);
        if (normTitle) seenTitles.set(normTitle, e);
        if (normUrl) seenUrls.set(normUrl, e);
      }
    });

    if (timeRange === 'critical') {
      const criticalOnly = deduplicated.filter(e => e.severity >= 3);
      const listToSort = criticalOnly.length > 0 ? criticalOnly : deduplicated;
      return listToSort.sort((a, b) => {
        if (b.severity !== a.severity) return b.severity - a.severity;
        return parseDateSafe(b.original_post_time || b.timestamp) - parseDateSafe(a.original_post_time || a.timestamp);
      });
    }

    return deduplicated.sort((a, b) => parseDateSafe(b.original_post_time || b.timestamp) - parseDateSafe(a.original_post_time || a.timestamp));
  }, [displayedEvents, vaultPapers, rssItems, selectedRssSources, categories, feedType, debouncedSearchQuery, timeRange]);

  const filteredRssItems = useMemo(() => {
    let items = rssItems.filter(item => selectedRssSources.includes(item.sid));
    
    if (debouncedSearchQuery.trim() !== '') {
      items = items.filter(item => matchAdvancedQuery(item, debouncedSearchQuery));
    }
    
    return items;
  }, [rssItems, selectedRssSources, debouncedSearchQuery]);

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
          text: `[${ev.category.toUpperCase()} // ${formatTime(ev.original_post_time || ev.timestamp)}] ${ev.title.toUpperCase()}`,
          timestamp: ev.original_post_time || ev.timestamp,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--sov-bg)', overflow: 'hidden' }}>
      {/* Clean Unified Header Bar */}
      <header style={{
        height: isMobile ? '48px' : '52px',
        background: 'var(--sov-header-bg)',
        borderBottom: '1px solid var(--sov-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 18px',
        gap: '12px',
        boxSizing: 'border-box',
        zIndex: 1001,
        backdropFilter: 'blur(12px)',
        position: 'relative',
        flexShrink: 0
      }}>
        {/* Left Brand (Single non-wrapping row) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: 0 }}>
          <img
            src="/icon.svg"
            alt="Sovereign"
            style={{ width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0 }}
          />
          <h1 style={{
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 800,
            color: 'var(--sov-text)',
            margin: 0,
            fontFamily: 'var(--font-jetbrains-fallback)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            SOVEREIGN
          </h1>
          {!isMobile && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              color: 'var(--sov-muted)',
              borderLeft: '1px solid var(--sov-border)',
              paddingLeft: '10px',
              whiteSpace: 'nowrap'
            }}>
              GLOBAL AI POLICY OBSERVATORY
            </span>
          )}
          <span
            title="Live Signal Telemetry Active"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: isMobile ? '4px' : '2px 7px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '9.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-jetbrains-fallback)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            {!isMobile && 'LIVE'}
          </span>
        </div>

        {/* Right Compact Menu Bar */}
        <DashboardTopMenus
          isMobile={isMobile}
          uiTheme={uiTheme}
          onSelectUiTheme={handleSelectUiTheme}
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
          mapMode={mapMode}
          setMapMode={setMapMode}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          tickerSpeed={tickerSpeed}
          setTickerSpeed={setTickerSpeed}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
          currentUser={currentUser}
          onOpenCms={onOpenCms}
          onAvatarClick={onAvatarClick}
          setShowAuthModal={setShowAuthModal}
          handleLogout={handleLogout}
          setShowSourceModal={setShowSourceModal}
          setShowResourcesModal={setShowResourcesModal}
          setShowCommandPalette={setShowCommandPalette}
          onOpenAiCopilot={() => setShowSovDashAi(true)}
        />
      </header>

      {/* Slim Intelligence Wire Ticker (optional via Settings) */}
      {tickerSpeed !== 'off' && (
        <div style={{
          background: uiTheme === 'light' ? '#f1f5f9' : '#040810',
          borderBottom: '1px solid var(--sov-border)',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          width: '100%',
          position: 'relative',
          flexShrink: 0
        }}>
          <div style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: `ticker-marquee ${tickerSpeed === 'fast' ? '30s' : tickerSpeed === 'normal' ? '60s' : '110s'} linear infinite`,
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontSize: '10px',
            color: 'var(--sov-accent)',
            fontWeight: 'bold',
            letterSpacing: '0.05em'
          }}>
            {tickerItems.map((item, idx) => (
              <span
                key={idx}
                onClick={() => {
                  if (item.event) setSelectedEvent(item.event);
                }}
                style={{
                  cursor: item.event ? 'pointer' : 'default',
                  marginRight: '24px',
                  display: 'inline-block'
                }}
              >
                {item.text}
                {idx < tickerItems.length - 1 && <span style={{ opacity: 0.25, marginLeft: '24px', pointerEvents: 'none' }}>•</span>}
              </span>
            ))}
          </div>
        </div>
      )}

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
        <div 
          className="sigint-feed tour-sidebar-feed"
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
            borderRight: isFeedCollapsed ? 'none' : '1px solid var(--sov-border)',
            visibility: isFeedCollapsed ? 'hidden' : 'visible',
            zIndex: 1000,
            background: 'var(--sov-panel-bg)',
            boxShadow: isFeedCollapsed ? 'none' : '10px 0 40px rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(15px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
        <div className="feed-type-tabs" style={{ display: 'flex', alignItems: 'stretch' }}>
          <button className={`feed-type-tab ${feedType === 'live' ? 'active' : ''}`} style={{ flex: 1, padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '9.5px' }} onClick={() => setFeedType('live')}>
            SIGNALS
          </button>
          <button className={`feed-type-tab ${feedType === 'papers' ? 'active' : ''}`} style={{ flex: 1, padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '9.5px' }} onClick={() => setFeedType('papers')}>
            PAPERS
          </button>
          <button className={`feed-type-tab ${feedType === 'rss' ? 'active' : ''}`} style={{ flex: 1, padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '9.5px' }} onClick={() => setFeedType('rss')}>
            FEEDS
          </button>
          {showSatellites && (
            <button className={`feed-type-tab ${feedType === 'satellites' ? 'active' : ''}`} style={{ flex: 1, padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '9.5px', color: '#00f0ff' }} onClick={() => setFeedType('satellites')}>
              ORBIT
            </button>
          )}
          
          {/* High-contrast Collapse Feed Button (all themes) */}
          <button
            type="button"
            onClick={() => setIsFeedCollapsed(true)}
            style={{
              background: 'var(--sov-card-bg)',
              border: 'none',
              color: 'var(--sov-text)',
              padding: '0 11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              borderLeft: '1px solid var(--sov-border)'
            }}
            title="Close Feed Panel"
            aria-label="Close Feed Panel"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sov-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sov-text)'; }}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        
        {feedType === 'rss' ? (
          <div style={{ position: 'relative', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 30, borderBottom: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
            
            {/* Custom Multi-select Dropdown Button */}
            <div style={{ position: 'relative', flex: 1 }}>
              <button 
                onClick={() => setIsRssDropdownOpen(!isRssDropdownOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--sov-panel-bg)',
                  border: '1px solid var(--sov-border)',
                  borderRadius: '6px',
                  color: 'var(--sov-text)',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>SOURCES ({selectedRssSources.length}/{availableRssSources.length})</span>
                <span style={{ fontSize: '9px', color: 'var(--sov-accent)' }}>{isRssDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {isRssDropdownOpen && (
                <>
                  <div 
                    onClick={() => setIsRssDropdownOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
                  />
                  <div className="sov-popover-shell" style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--sov-panel-bg)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--sov-border)',
                    borderRadius: '8px',
                    padding: '8px',
                    boxShadow: 'var(--sov-shadow)',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '280px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', borderBottom: '1px solid var(--sov-border)', paddingBottom: '6px' }}>
                      <button
                        onClick={() => setSelectedRssSources(availableRssSources.map(s => s.id))}
                        style={{ flex: 1, background: 'var(--sov-accent-soft)', border: '1px solid var(--sov-border)', color: 'var(--sov-accent)', padding: '4px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-jetbrains-fallback)' }}
                      >
                        SELECT ALL
                      </button>
                      <button
                        onClick={() => setSelectedRssSources([])}
                        style={{ flex: 1, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--sov-danger)', padding: '4px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-jetbrains-fallback)' }}
                      >
                        CLEAR
                      </button>
                      <button
                        onClick={() => { setIsRssDropdownOpen(false); setShowSourceModal(true); }}
                        style={{ flex: 1, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: 'var(--sov-emerald)', padding: '4px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-jetbrains-fallback)' }}
                      >
                        + ADD
                      </button>
                    </div>

                    {availableRssSources.map(src => {
                      const isChecked = selectedRssSources.includes(src.id);
                      return (
                        <label 
                          key={src.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: isChecked ? 'var(--sov-text)' : 'var(--sov-muted)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-inter-fallback)',
                            fontWeight: isChecked ? 600 : 400,
                            padding: '5px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: isChecked ? 'var(--sov-accent-soft)' : 'transparent'
                          }}
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
                            style={{ accentColor: 'var(--sov-accent)', cursor: 'pointer' }}
                          />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.name}</span>
                          {src.isCustom && (
                            <span style={{ fontSize: '8.5px', color: 'var(--sov-emerald)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '3px', padding: '0 4px' }}>CUSTOM</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowSourceModal(true)}
              title="Add custom or curated RSS/Atom source & auto-pin signals"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '6px',
                color: 'var(--sov-emerald)',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'var(--font-jetbrains-fallback)',
                fontWeight: 'bold',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                outline: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={11} />
              <span>ADD</span>
            </button>

            <button 
              onClick={() => fetchRss(true)} 
              disabled={rssLoading}
              title="Force sync live RSS feeds"
              style={{
                background: 'var(--sov-panel-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '6px',
                color: rssLoading ? 'var(--sov-muted)' : 'var(--sov-accent)',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                opacity: rssLoading ? 0.5 : 1
              }}
            >
              <RefreshCw size={11} className={rssLoading ? 'spinning' : ''} style={{ animation: rssLoading ? 'spin 1.5s linear infinite' : 'none' }} />
            </button>
          </div>
        ) : (
          <div className="feed-tabs" style={{ display: 'flex', alignItems: 'center' }}>
            <button className={`feed-tab ${timeRange === 'recent' ? 'active' : ''}`} onClick={() => setTimeRange('recent')}>LATEST</button>
            <button className={`feed-tab live-tab ${timeRange === 'critical' ? 'active' : ''}`} onClick={() => setTimeRange('critical')}>CRITICAL</button>
            <button
              onClick={() => setShowSourceModal(true)}
              title="Add new RSS/Atom source & auto-pin relevant signals to the map"
              style={{
                marginLeft: 'auto',
                marginRight: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                borderRadius: '4px',
                padding: '3px 7px',
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Plus size={10} />
              <span>ADD SOURCE</span>
            </button>
          </div>
        )}
        
        {/* Live Search Bar */}
        <div
          className="feed-search-bar"
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--sov-border)',
            background: 'var(--sov-card-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              ref={searchInputRef}
              type="text"
              className="tour-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH AI, CYBER & POLICY SIGNALS... ( / )"
              style={{
                width: '100%',
                background: 'var(--sov-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '6px',
                padding: '8px 32px 8px 12px',
                color: 'var(--sov-text)',
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

          {/* Global Theater Quick-Jump Strip */}
          <div style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            paddingTop: '2px',
            scrollbarWidth: 'none'
          }}>
            {REGION_VIEWPORTS.map(region => {
              const isActive = activeRegionId === region.id;
              return (
                <button
                  key={region.id}
                  className={`region-jump-btn${isActive ? ' active' : ''}`}
                  onClick={() => {
                    setActiveRegionId(region.id);
                    if (region.reset) {
                      setResetKey(prev => prev + 1);
                      setSelectedCountry(null);
                    } else {
                      setFocusCoordinate({ lat: region.lat, lon: region.lon, timestamp: Date.now() });
                    }
                  }}
                  style={{
                    flex: '1 1 auto',
                    background: isActive ? 'var(--sov-accent-soft)' : 'var(--sov-card-bg)',
                    border: isActive ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                    color: isActive ? 'var(--sov-accent)' : 'var(--sov-muted)',
                    borderRadius: '4px',
                    padding: '3px 5px',
                    fontSize: '8.5px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Focus globe viewport on ${region.label}`}
                >
                  {region.label}
                </button>
              );
            })}
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
                        borderBottom: '1px solid var(--sov-border)',
                        padding: '12px 14px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="feed-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span className="feed-category" style={{ 
                          background: 'var(--sov-accent-soft)', 
                          color: 'var(--sov-accent)', 
                          borderColor: 'var(--sov-border)',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--sov-border)',
                          fontFamily: 'var(--font-jetbrains-fallback)',
                          maxWidth: '190px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.source}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="feed-time" style={{ fontSize: '9.5px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                            {formatTime(item.published_at)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark({
                                id: item.id || `rss-${item.url}`,
                                title: item.title,
                                category: item.category || 'Political',
                                severity: item.severity || 1,
                                location: item.location || 'Global / Multilateral',
                                lat: item.latitude ? parseFloat(item.latitude) : null,
                                lon: item.longitude ? parseFloat(item.longitude) : null,
                                source: item.source,
                                url: item.url,
                                summary: item.summary || '',
                                timestamp: item.published_at
                              });
                            }}
                            title={isBookmarked({ id: item.id || `rss-${item.url}`, url: item.url }) ? 'Remove Bookmark' : 'Bookmark Feed Item'}
                            style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', color: isBookmarked({ id: item.id || `rss-${item.url}`, url: item.url }) ? '#f59e0b' : 'var(--sov-muted)', display: 'inline-flex' }}
                          >
                            <Bookmark size={12} fill={isBookmarked({ id: item.id || `rss-${item.url}`, url: item.url }) ? '#f59e0b' : 'none'} />
                          </button>
                        </div>
                      </div>
                      <div className="feed-title" style={{ 
                        fontSize: '12.5px', 
                        fontWeight: 600, 
                        lineHeight: 1.45, 
                        color: 'var(--sov-text)',
                        fontFamily: 'var(--font-inter-fallback)'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginTop: '8px', 
                        fontSize: '9px', 
                        fontFamily: 'var(--font-jetbrains-fallback)', 
                        color: 'var(--sov-muted)'
                      }}>
                        <span>{item.location || 'Global'}</span>
                        <span style={{ color: 'var(--sov-accent)', fontWeight: 700 }}>OPEN SIGNAL ↗</span>
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
                      padding: '12px',
                      background: 'var(--sov-card-bg)',
                      border: 'none',
                      borderTop: '1px solid var(--sov-border)',
                      color: 'var(--sov-accent)',
                      fontFamily: 'var(--font-jetbrains-fallback)',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    LOAD MORE FEEDS (+30)
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
                  return (
                    <div key={ev._displayKey || `${ev.id}-${idx}`} className="feed-item" onClick={() => setSelectedEvent(ev)}>
                      <div className="feed-item-header">
                        <span className="feed-category" style={{ background: `${CAT_COLORS[ev.category]}20`, color: CAT_COLORS[ev.category], borderColor: `${CAT_COLORS[ev.category]}40` }}>
                          {ev.category}
                        </span>
                        {(ev.details?.isAcademic || String(ev.source || '').toLowerCase().includes('arxiv') || String(ev.source || '').toLowerCase().includes('citizen lab') || String(ev.source || '').toLowerCase().includes('nature')) ? (
                          <span className="research-badge" style={{ fontSize: '9px', background: 'rgba(168,85,247,0.16)', color: 'var(--sov-purple)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(168,85,247,0.3)', fontWeight: '800' }}>ACADEMIC</span>
                        ) : ev.details?.isResearch ? (
                          <span className="research-badge" style={{ fontSize: '9px', background: 'rgba(56,189,248,0.18)', color: 'var(--sov-sky)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.3)', fontWeight: '800' }}>RESEARCH</span>
                        ) : null}
                        <span className="feed-severity" style={{ background: `${SEV_COLORS[ev.severity]}25`, color: SEV_COLORS[ev.severity] }}>
                          S{ev.severity}
                        </span>
                        <span className="feed-time">{formatTime(ev.original_post_time || ev.timestamp)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(ev);
                          }}
                          title={isBookmarked(ev) ? 'Remove Bookmark' : 'Bookmark Signal'}
                          aria-label={isBookmarked(ev) ? 'Remove Bookmark' : 'Bookmark Signal'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: isBookmarked(ev) ? '#f59e0b' : 'var(--sov-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginLeft: '2px'
                          }}
                        >
                          <Bookmark size={12} fill={isBookmarked(ev) ? '#f59e0b' : 'none'} />
                        </button>
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
                      padding: '12px',
                      background: 'var(--sov-card-bg)',
                      border: 'none',
                      borderTop: '1px solid var(--sov-border)',
                      color: 'var(--sov-accent)',
                      fontFamily: 'var(--font-jetbrains-fallback)',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    LOAD MORE SIGNALS (+30)
                  </button>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* 3D Google Tiles Globe Area */}
      <div ref={mapAreaRef} className="sigint-map-area" style={{ position: 'relative' }}>
        {selectedCountry && (
          <div className="sov-popover-shell" style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'var(--sov-panel-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--sov-border)',
            borderRadius: '8px',
            padding: '8px 16px',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontSize: '11px',
            color: 'var(--sov-text)',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'auto'
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#00f0ff',
              boxShadow: '0 0 8px #00f0ff',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite'
            }} />
            <span>ACTIVE SECTOR MONITOR: <strong>{selectedCountry.toUpperCase()}</strong></span>
            {(() => {
              const jur = getJurisdictionBySlug(selectedCountry) || resolveJurisdictionForLocation(selectedCountry);
              if (!jur) return null;
              return (
                <Link
                  href={`/jurisdiction/${jur.slug}`}
                  style={{
                    background: 'rgba(168, 85, 247, 0.14)',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                    color: '#c084fc',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 7px',
                    borderRadius: '3px',
                    textDecoration: 'none'
                  }}
                  title={`Open full AI Policy & Safety Dossier for ${jur.name}`}
                >
                  [DOSSIER ↗]
                </Link>
              );
            })()}
            <button
              onClick={() => {
                const targetQuery = `loc:"${selectedCountry}"`;
                setSearchQuery(prev => prev === targetQuery ? '' : targetQuery);
              }}
              style={{
                background: searchQuery === `loc:"${selectedCountry}"` ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                color: '#00f0ff',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                outline: 'none',
                padding: '2px 6px',
                borderRadius: '3px',
                transition: 'all 0.15s ease'
              }}
              title="Filter intelligence feed to this jurisdiction"
            >
              {searchQuery === `loc:"${selectedCountry}"` ? '[CLEAR FILTER]' : '[FILTER FEED]'}
            </button>
            <button 
              onClick={() => {
                if (searchQuery === `loc:"${selectedCountry}"`) setSearchQuery('');
                setSelectedCountry(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ff2d55',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                marginLeft: '10px',
                outline: 'none',
                padding: '2px 6px',
                border: '1px solid rgba(255, 45, 85, 0.3)',
                borderRadius: '3px',
                background: 'rgba(255, 45, 85, 0.1)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 45, 85, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 45, 85, 0.1)'}
            >
              [DISMISS]
            </button>
          </div>
        )}
        <CesiumGlobe
          displayedMarkers={displayedMarkers}
          focusCoordinate={focusCoordinate}
          selectedCountry={selectedCountry}
          onCountrySelect={setSelectedCountry}
          mapMode={mapMode}
          mapStyle={mapStyle}
          onMapModeChange={setMapMode}
          onMapStyleChange={setMapStyle}
          autoRotate={autoRotate}
          onInteraction={() => setAutoRotate(false)}
          isAdmin={currentUser?.role === 'admin' || currentUser?.email === 'workwithavip@gmail.com'}
          onPointClick={(point) => {
            // First check GDELT events
            let fullEvent = allFetchedEvents.find(ev => {
              const evIdStr = String(ev.id || '');
              const pointIdStr = String(point.id || '');
              const cleanPointId = pointIdStr.replace('db-', '').replace('rss-', '');
              return evIdStr === pointIdStr || 
                     ev.title === point.name || 
                     `db-${evIdStr}` === pointIdStr || 
                     `rss-${evIdStr}` === pointIdStr ||
                     evIdStr === cleanPointId;
            });
            // If not found, look up RSS items to populate dynamic audit details
            if (!fullEvent) {
              const matchedRss = rssItems.find(item => {
                const itemIdStr = String(item.id || '');
                const pointIdStr = String(point.id || '');
                const cleanPointId = pointIdStr.replace('rss-', '');
                return itemIdStr === pointIdStr || item.title === point.name || itemIdStr === cleanPointId;
              });
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
          aiRegulationsEnabled={aiRegulationsEnabled}
          censorshipEnabled={censorshipEnabled}
          envJusticeEnabled={envJusticeEnabled}
          supplyChainEnabled={supplyChainEnabled}
          biometricWelfareEnabled={biometricWelfareEnabled}
          aiLaborEnabled={aiLaborEnabled}
          temporalReplayActive={temporalReplayActive}
          temporalMilestones={temporalReplayActive ? temporalSnapshot.milestones : EMPTY_MILESTONES}
          uiTheme={uiTheme}
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
              padding: '0 8px', background: 'var(--sov-card-bg)',
              borderBottom: '1px solid var(--sov-border)',
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

                <div className="overlay-title" style={{ marginTop: '14px', marginBottom: '10px' }}>MIN. SEVERITY</div>
                <div className="severity-buttons">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} className={`sev-btn${minSeverity <= s ? ' active' : ''}`}
                      style={{ background: minSeverity <= s ? SEV_COLORS[s] : 'transparent', color: minSeverity <= s ? '#000' : '#8892a4', borderColor: SEV_COLORS[s] }}
                      onClick={() => setMinSeverity(s)}>
                      S{s}
                    </button>
                  ))}
                </div>

                <div className="overlay-title" style={{ marginTop: '14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>TIME HORIZON</span>
                  {timelineCutoffMs && (
                    <span style={{ fontSize: '9px', color: '#facc15' }}>{new Date(timelineCutoffMs).toISOString().slice(0, 10)}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[
                    { days: 7, label: '7D' },
                    { days: 21, label: '21D' },
                    { days: 90, label: '90D' },
                    { days: 365, label: 'ALL' }
                  ].map((opt) => {
                    const active = timeWindowDays === opt.days;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setTimelineCutoffMs(null);
                          setIsTimelinePlaying(false);
                          setTimeWindowDays(opt.days);
                        }}
                        style={{
                          flex: 1,
                          background: active ? 'var(--sov-accent-soft)' : 'transparent',
                          border: `1px solid ${active ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                          color: active ? 'var(--sov-accent)' : 'var(--sov-muted)',
                          borderRadius: '4px',
                          padding: '4px 0',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-jetbrains-fallback)',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      if (isTimelinePlaying) {
                        setIsTimelinePlaying(false);
                        setTimelineCutoffMs(null);
                      } else {
                        setIsTimelinePlaying(true);
                      }
                    }}
                    style={{
                      background: isTimelinePlaying ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.14)',
                      border: `1px solid ${isTimelinePlaying ? '#ef4444' : '#10b981'}`,
                      color: isTimelinePlaying ? '#f87171' : '#34d399',
                      borderRadius: '4px',
                      padding: '4px 7px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-jetbrains-fallback)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isTimelinePlaying ? '⏹ STOP' : '▶ PLAY'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setTemporalReplayActive(prev => !prev)}
                  style={{
                    marginTop: '7px',
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '5px',
                    border: `1px solid ${temporalReplayActive ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                    background: temporalReplayActive ? 'var(--sov-accent-soft)' : 'var(--sov-card-bg)',
                    color: temporalReplayActive ? 'var(--sov-accent)' : 'var(--sov-sky)',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-jetbrains-fallback)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>⏱ 2020–2026 REPLAY &amp; GAP LENS</span>
                  <span>{temporalReplayActive ? 'ACTIVE' : 'OPEN'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Map Options Expandable Section */}
          <div className="overlay-section" style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
            <div 
              className="overlay-title tour-map-options" 
              onClick={() => setIsMapOptionsExpanded(!isMapOptionsExpanded)} 
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>MAP OPTIONS</span>
              <span style={{ fontSize: '10px', color: '#38bdf8' }}>{isMapOptionsExpanded ? '▼' : '▶'}</span>
            </div>

            {isMapOptionsExpanded && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                
                {/* Map style selection */}
                <div style={{ marginBottom: '4px', paddingBottom: '6px', borderBottom: '1px solid var(--sov-border)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--sov-muted)', marginBottom: '5px', letterSpacing: '0.05em' }}>MAP VIEWPORT STYLE</div>
                  <select
                    value={mapStyle}
                    onChange={(e) => setMapStyle(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--sov-card-bg)',
                      border: '1px solid var(--sov-border)',
                      borderRadius: '4px',
                      padding: '4px 6px',
                      color: 'var(--sov-text)',
                      fontSize: '9px',
                      fontWeight: '800',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="tactical">🛰️ TACTICAL DARK</option>
                    <option value="minimal">🌑 CLEAN DARK (MINIMAL)</option>
                    <option value="light">☀️ EDITORIAL LIGHT</option>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: eventsEnabled ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: autoRotate ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: weatherEnabled ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: gpsJammingEnabled ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: dataCentersEnabled ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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

                  {/* AI Regulation Option */}
                  <div 
                    onClick={() => setAiRegulationsEnabled(!aiRegulationsEnabled)}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: aiRegulationsEnabled ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
                      <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: aiRegulationsEnabled ? 1 : 0.4 }}>⚖️</span>
                      <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>AI Regulation</span>
                    </div>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: aiRegulationsEnabled ? '#a855f7' : '#334155',
                      boxShadow: aiRegulationsEnabled ? '0 0 6px #a855f7' : 'none',
                      transition: 'all 0.2s ease'
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: oilGasEnabled ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: internetCablesEnabled ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: showSatellites ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: dayNightEnabled ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
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

                {/* AI Ethics & Society Layers */}
                <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--sov-border)' }}>
                  <div
                    onClick={() => setIsEthicsLayersExpanded(!isEthicsLayersExpanded)}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontWeight: 'bold', color: 'var(--sov-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}
                  >
                    <span>AI ETHICS &amp; SOCIETY</span>
                    <span style={{ color: 'var(--sov-accent)' }}>{isEthicsLayersExpanded ? '▼' : '▶'}</span>
                  </div>

                  {isEthicsLayersExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {[
                        { label: 'Censorship (OONI/IODA)', icon: '🔒', on: censorshipEnabled, toggle: () => setCensorshipEnabled(!censorshipEnabled), color: '#f43f5e' },
                        { label: 'Env. Justice (Water/CO2)', icon: '💧', on: envJusticeEnabled, toggle: () => setEnvJusticeEnabled(!envJusticeEnabled), color: '#38bdf8' },
                        { label: 'AI Supply Chain', icon: '🪨', on: supplyChainEnabled, toggle: () => setSupplyChainEnabled(!supplyChainEnabled), color: '#f59e0b' },
                        { label: 'Biometrics & Welfare', icon: '👁️', on: biometricWelfareEnabled, toggle: () => setBiometricWelfareEnabled(!biometricWelfareEnabled), color: '#10b981' },
                        { label: 'AI Labor & RLHF Hubs', icon: '⚖️', on: aiLaborEnabled, toggle: () => setAiLaborEnabled(!aiLaborEnabled), color: '#ec4899' }
                      ].map((row) => (
                        <div
                          key={row.label}
                          onClick={row.toggle}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '3px 4px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: row.on ? 'var(--sov-text)' : 'var(--sov-muted)' }}>
                            <span style={{ width: '14px', textAlign: 'center', fontSize: '11px', opacity: row.on ? 1 : 0.45 }}>{row.icon}</span>
                            <span style={{ fontWeight: '500', fontFamily: 'var(--font-main)' }}>{row.label}</span>
                          </div>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: row.on ? row.color : '#334155',
                            boxShadow: row.on ? `0 0 6px ${row.color}` : 'none'
                          }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tactical Widgets */}
                <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--sov-border)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--sov-muted)', marginBottom: '5px', letterSpacing: '0.05em' }}>TACTICAL WIDGETS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { label: showMarkets ? 'DISABLE MARKETS' : 'MONITOR MARKETS', icon: '📊', on: showMarkets, toggle: () => setShowMarkets(!showMarkets), color: '#10b981' },
                      { label: 'ENFORCEMENT TRACKER', icon: '⚖️', on: showLegislativeTracker, toggle: () => setShowLegislativeTracker(!showLegislativeTracker), color: '#a855f7' },
                      { label: 'SHUTDOWN & OONI PULSE', icon: '🔒', on: showCensorshipPulse, toggle: () => setShowCensorshipPulse(!showCensorshipPulse), color: '#f43f5e' },
                      { label: 'COMPUTE & SAFETY HUB', icon: '⚡', on: showComputeSafety, toggle: () => setShowComputeSafety(!showComputeSafety), color: '#f59e0b' }
                    ].map((w) => (
                      <button
                        key={w.label}
                        type="button"
                        onClick={w.toggle}
                        style={{
                          background: w.on ? `${w.color}22` : 'var(--sov-card-bg)',
                          color: w.on ? w.color : 'var(--sov-text)',
                          borderColor: w.on ? w.color : 'var(--sov-border)',
                          width: '100%',
                          fontSize: '9px',
                          padding: '5px 8px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-jetbrains-fallback)',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span>{w.icon}</span>
                          <span>{w.label}</span>
                        </span>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: w.on ? w.color : '#64748b' }} />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Tour Credit & Replay */}
          <div
            className="overlay-footer"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderTop: '1px solid var(--sov-border)',
              fontSize: '9px',
              color: 'var(--sov-muted)',
              fontFamily: 'monospace',
              background: 'var(--sov-card-bg)',
              borderRadius: '0 0 6px 6px'
            }}
          >
            <span>by <a href="https://aviperera.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Avi</a></span>
            <span 
              style={{ color: 'var(--sov-accent)', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={(e) => { e.stopPropagation(); startTour(); }}
            >
              Replay tutorial
            </span>
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
          className={`bottom-dock-pill${!isFeedCollapsed ? ' active' : ''}`}
          onClick={() => setIsFeedCollapsed(!isFeedCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            borderRadius: '24px',
            background: 'var(--sov-panel-bg)',
            border: !isFeedCollapsed ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
            color: !isFeedCollapsed ? 'var(--sov-accent)' : 'var(--sov-text)',
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
            className={`tour-support-button bottom-dock-pill${showSupportDropdown ? ' active' : ''}`}
            onClick={() => setShowSupportDropdown(!showSupportDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '6px 12px' : '8px 16px',
              borderRadius: '24px',
              background: 'var(--sov-panel-bg)',
              border: showSupportDropdown ? '1px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.3)',
              color: showSupportDropdown ? '#ec4899' : 'var(--sov-text)',
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
              className="sov-popover-shell"
              style={{
                position: 'absolute',
                bottom: '44px',
                right: '50%',
                transform: 'translateX(50%)',
                width: '256px',
                background: 'var(--sov-panel-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: 'var(--sov-shadow)',
                color: 'var(--sov-text)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 1003,
                backdropFilter: 'blur(16px)'
              }}
            >
              {/* Centered Minimal Header */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid var(--sov-border)',
                paddingBottom: '8px'
              }}>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--sov-text)',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  letterSpacing: '0.08em'
                }}>
                  ❤️ SUPPORT
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowSupportDropdown(false); }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--sov-muted)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: 1,
                    padding: '2px 4px'
                  }}
                  aria-label="Close Support"
                >
                  ×
                </button>
              </div>

              <a
                href="https://sovdash.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: 'var(--sov-accent-soft)',
                  color: 'var(--sov-accent)',
                  border: '1px solid var(--sov-border)'
                }}
              >
                <Globe size={13} />
                <span>Visit sovdash.com</span>
              </a>

              <div style={{ display: 'flex', gap: '6px' }}>
                <a
                  href="https://x.com/SovDash"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '7px',
                    borderRadius: '6px',
                    background: 'var(--sov-card-bg)',
                    border: '1px solid var(--sov-border)',
                    color: 'var(--sov-text)'
                  }}
                  title="SovDash on X"
                >
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/sovdash"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '7px',
                    borderRadius: '6px',
                    background: 'var(--sov-card-bg)',
                    border: '1px solid var(--sov-border)',
                    color: 'var(--sov-text)'
                  }}
                  title="LinkedIn"
                >
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/sovdash"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '7px',
                    borderRadius: '6px',
                    background: 'var(--sov-card-bg)',
                    border: '1px solid var(--sov-border)',
                    color: 'var(--sov-text)'
                  }}
                  title="Facebook"
                >
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>

              <button
                type="button"
                onClick={handleShareDashboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: shareCopied ? 'rgba(16, 185, 129, 0.14)' : 'var(--sov-card-bg)',
                  color: shareCopied ? 'var(--sov-emerald)' : 'var(--sov-purple)',
                  border: '1px solid var(--sov-border)',
                  width: '100%'
                }}
              >
                {shareCopied ? <Check size={13} /> : <Share2 size={13} />}
                <span>{shareCopied ? 'Link Copied' : 'Share Dashboard'}</span>
              </button>

              <a
                href="https://sovdash.com/pricing.html"
                target="_blank"
                rel="noopener noreferrer"
                className="keep-light-text"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  background: 'var(--sov-accent)',
                  color: '#ffffff'
                }}
              >
                💎 Upgrade to Pro
              </a>

              <div style={{ display: 'flex', gap: '6px' }}>
                <a
                  href="https://patreon.com/aviperera?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '7px 4px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--sov-danger)',
                    border: '1px solid rgba(239, 68, 68, 0.28)'
                  }}
                >
                  ⚡ Patreon
                </a>
                <a
                  href="https://buymeacoffee.com/avip"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '7px 4px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: 'var(--sov-amber)',
                    border: '1px solid rgba(245, 158, 11, 0.35)'
                  }}
                >
                  ☕ Coffee
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Overlays Pill Button */}
        <button 
          className={`bottom-dock-pill${!isMinimized ? ' active' : ''}`}
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            borderRadius: '24px',
            background: 'var(--sov-panel-bg)',
            border: !isMinimized ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
            color: !isMinimized ? 'var(--sov-accent)' : 'var(--sov-text)',
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
          {status === 'live' ? 'CONNECTED' : status === 'loading' ? 'CONNECTING...' : 'RECONNECTING...'}
        </div>
        <div className="status-item">
          ⚡ {displayedMarkers.length} MAP SIGNALS
        </div>
        <div style={{ color: 'rgba(255,255,255,0.15)', display: isMobile ? 'none' : 'block' }}>|</div>
        <button
          onClick={() => setShowChangelog(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sov-accent)',
            fontSize: '10px',
            fontWeight: '700',
            fontFamily: 'monospace',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s',
            letterSpacing: '0.05em',
            outline: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sov-text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sov-accent)'}
        >
          📋 CHANGELOG
        </button>
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

      {/* Live Market Quotes & Tactical Widgets */}
      {showMarkets && (
        <MarketQuotesBox onClose={() => setShowMarkets(false)} />
      )}
      {showLegislativeTracker && (
        <LegislativeCountdownWidget
          onClose={() => setShowLegislativeTracker(false)}
          onFocusLocation={(lat, lon) => {
            setAutoRotate(false);
            setFocusCoordinate({ lat: Number(lat), lon: Number(lon), timestamp: Date.now() });
          }}
        />
      )}
      {showCensorshipPulse && (
        <CensorshipPulseWidget
          onClose={() => setShowCensorshipPulse(false)}
          censorshipEnabled={censorshipEnabled}
          onToggleCensorshipLayer={() => setCensorshipEnabled(prev => !prev)}
          onFocusLocation={(lat, lon) => {
            setAutoRotate(false);
            setFocusCoordinate({ lat: Number(lat), lon: Number(lon), timestamp: Date.now() });
          }}
        />
      )}
      {showComputeSafety && (
        <ComputeSafetyWidget
          onClose={() => setShowComputeSafety(false)}
          signals={allFetchedEvents}
          onFocusLocation={(lat, lon) => {
            setAutoRotate(false);
            setFocusCoordinate({ lat: Number(lat), lon: Number(lon), timestamp: Date.now() });
          }}
        />
      )}

      {/* Interactive System Changelog Box */}
      {showChangelog && (
        <ChangelogBox onClose={() => setShowChangelog(false)} />
      )}

      {/* Event Detail Modal (Draggable Window) */}
      {selectedEvent && (
        <EventDetailsWindow
          event={selectedEvent}
          currentUser={currentUser}
          onEventUpdate={handleEventUpdate}
          onClose={() => setSelectedEvent(null)}
          onReportIssue={onAvatarClick}
          SEV_COLORS={SEV_COLORS}
          CAT_COLORS={CAT_COLORS}
          formatTime={formatTime}
          onFocusLocation={(lat, lon) => {
            setAutoRotate(false);
            setFocusCoordinate({ lat: Number(lat), lon: Number(lon), timestamp: Date.now() });
          }}
          isBookmarked={isBookmarked(selectedEvent)}
          onToggleBookmark={toggleBookmark}
        />
      )}

      {/* Global Quick Command Palette (Cmd/Ctrl + K) */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        signals={allFetchedEvents}
        onFlyToLocation={(lat, lon, countryName) => {
          setAutoRotate(false);
          if (countryName) setSelectedCountry(countryName);
          if (lat != null && lon != null) {
            setFocusCoordinate({ lat: Number(lat), lon: Number(lon), timestamp: Date.now() });
          }
        }}
        onSelectSignal={(ev) => {
          setSelectedEvent(ev);
          const targetLat = ev?.lat ?? ev?.latitude;
          const targetLon = ev?.lon ?? ev?.longitude;
          if (targetLat != null && targetLon != null) {
            setAutoRotate(false);
            setFocusCoordinate({ lat: Number(targetLat), lon: Number(targetLon), timestamp: Date.now() });
          }
        }}
      />

      {/* Knowledge Repositories & Verification Resources Modal */}
      {showResourcesModal && (
        <ResourcesModal
          onClose={() => setShowResourcesModal(false)}
          currentUser={currentUser}
        />
      )}

      {/* Ask SovDash Floating Research Assistant */}
      {showSovDashAi && (
        <SovDashAiDrawer
          isOpen={showSovDashAi}
          onClose={() => setShowSovDashAi(false)}
          currentUser={currentUser}
          onRequestAuth={() => setShowAuthModal(true)}
          onFocusLocation={(lat, lon) => {
            setAutoRotate(false);
            setFocusCoordinate({ lat: Number(lat), lon: Number(lon), timestamp: Date.now() });
          }}
        />
      )}

      {/* Intelligence Source Manager & Auto-Pin Ingestion Modal */}
      {showSourceModal && (
        <SourceManagerModal
          onClose={() => setShowSourceModal(false)}
          currentUser={currentUser}
          selectedRssSources={selectedRssSources}
          onToggleRssSource={(sid) => {
            setSelectedRssSources(prev =>
              prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]
            );
          }}
          onSelectAllSources={(ids) => setSelectedRssSources(Array.isArray(ids) ? ids : [])}
          onSourcesIngested={(data) => {
            if (data?.source?.sid) {
              const newSid = data.source.sid;
              const newName = data.source.name || newSid;
              setAvailableRssSources(prev =>
                prev.some(s => s.id === newSid)
                  ? prev
                  : [...prev, { id: newSid, name: newName, isCustom: true }]
              );
              setSelectedRssSources(prev =>
                prev.includes(newSid) ? prev : [...prev, newSid]
              );
            }
            if (Array.isArray(data?.relevantItems) && data.relevantItems.length > 0) {
              setRssItems(prev => {
                const seen = new Set(prev.map(i => i.url));
                const fresh = data.relevantItems.filter(i => !seen.has(i.url));
                return [...fresh, ...prev];
              });
            }
            if (Array.isArray(data?.pinnedEvents) && data.pinnedEvents.length > 0) {
              const mergeUnique = (prev) => {
                const seen = new Set(prev.map(e => e.id || e.url));
                const fresh = data.pinnedEvents
                  .filter(e => !seen.has(e.id) && !seen.has(e.url))
                  .map(e => ({ ...e, isPinned: true }));
                return [...fresh, ...prev];
              };
              setMarkers(mergeUnique);
              setDisplayedEvents(mergeUnique);
              setAllFetchedEvents(mergeUnique);
            }
            syncAvailableSources();
            fetchEvents(false);
          }}
          onFlyToEvent={(ev) => {
            setShowSourceModal(false);
            setSelectedEvent(ev);
            const targetLat = ev?.lat ?? ev?.latitude;
            const targetLon = ev?.lon ?? ev?.longitude;
            if (targetLat != null && targetLon != null) {
              setAutoRotate(false);
              setFocusCoordinate({ lat: Number(targetLat), lon: Number(targetLon), timestamp: Date.now() });
            }
          }}
        />
      )}

      {/* Orbital Intelligence Inspector */}
      {showSatellites && selectedSatellite && (
        <SatelliteDetailWindow
          satellite={selectedSatellite}
          onClose={() => {
            setSelectedSatellite(null);
            setIsTracked(false);
          }}
          isTracked={isTracked}
          onTrackToggle={() => setIsTracked(!isTracked)}
          onFocusLocation={(coord) => {
            if (coord) setFocusCoordinate(coord);
          }}
        />
      )}

      {/* Longitudinal 2020-2026 Compute-Regulation Replay Scrubber */}
      {temporalReplayActive && (
        <TemporalReplayBar
          monthIdx={temporalMonthIdx}
          setMonthIdx={setTemporalMonthIdx}
          baselineYm={temporalBaselineYm}
          setBaselineYm={setTemporalBaselineYm}
          activeTracks={temporalTracks}
          setActiveTracks={setTemporalTracks}
          onSelectMilestone={(m) => {
            setSelectedEvent(m);
            if (m?.lat != null && m?.lon != null) {
              setFocusCoordinate({ lat: Number(m.lat), lon: Number(m.lon), timestamp: Date.now() });
            }
          }}
          onClose={() => setTemporalReplayActive(false)}
        />
      )}

      {/* Interactive Onboarding Tour Welcoming Dialog */}
      {showWelcomeModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          pointerEvents: 'auto'
        }}>
          <div style={{
            width: '400px',
            background: 'rgba(8, 12, 24, 0.98)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.95), 0 0 25px rgba(0,240,255,0.2)',
            color: '#f8fafc',
            fontFamily: 'monospace',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px', textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>🛰️</div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Welcome to the Dashboard
            </h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '11.5px', lineHeight: '1.6', color: '#cbd5e1' }}>
              Would you like to start a guided tour of the Sovereign Intelligence Dashboard? This introduction will walk you through the real-time feeds, live data layers, and operational controls.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  localStorage.setItem('sovereign_tour_seen', 'true');
                  localStorage.setItem('operator_pref_autoRotate', 'true');
                  setAutoRotate(true);
                  window.dispatchEvent(new Event('operator_pref_changed'));
                }}
                style={{
                  flex: 1,
                  background: 'rgba(51, 65, 85, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '10px 0',
                  fontFamily: 'monospace',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.55)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.35)'}
              >
                Skip
              </button>
              <button
                onClick={() => startTour()}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#020617',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '10px 0',
                  fontFamily: 'monospace',
                  boxShadow: '0 0 12px rgba(6,182,212,0.4)',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 18px rgba(6,182,212,0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 12px rgba(6,182,212,0.4)'}
              >
                Start Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Dark Overlay with SVG cutout mask */}
      {tourActive && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998, pointerEvents: 'none' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}>
            <defs>
              <mask id="tour-cutout-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {highlightRect && (
                  <rect 
                    x={highlightRect.left - 6} 
                    y={highlightRect.top - 6} 
                    width={highlightRect.width + 12} 
                    height={highlightRect.height + 12} 
                    rx="6" 
                    ry="6" 
                    fill="black" 
                  />
                )}
              </mask>
            </defs>
            <rect 
              x="0" 
              y="0" 
              width="100%" 
              height="100%" 
              fill="rgba(0, 0, 0, 0.72)" 
              mask="url(#tour-cutout-mask)" 
            />
          </svg>
        </div>
      )}

      {/* Tour Step Card dialog box */}
      {tourActive && tourSteps[tourStep] && (
        <div 
          style={{
            ...getCardPosition(highlightRect, 320, 180),
            zIndex: 99999,
            pointerEvents: 'auto',
            width: '320px',
            background: 'rgba(8, 12, 24, 0.98)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.9), 0 0 15px rgba(0,240,255,0.15)',
            color: '#f8fafc',
            fontFamily: 'monospace',
            transition: 'all 0.2s ease-out',
            boxSizing: 'border-box'
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {tourSteps[tourStep].title}
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '10.5px', lineHeight: '1.5', color: '#cbd5e1' }}>
            {tourSteps[tourStep].text}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {tourStep + 1} of {tourSteps.length}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {tourStep < tourSteps.length - 1 && (
                <button 
                  onClick={endTour}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '4px 8px',
                    fontFamily: 'monospace'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#cbd5e1'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                >
                  Skip
                </button>
              )}
              {tourStep > 0 && (
                <button 
                  onClick={prevTourStep}
                  style={{
                    background: 'rgba(51, 65, 85, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '5px 10px',
                    fontFamily: 'monospace',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.55)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.35)'}
                >
                  Back
                </button>
              )}
              <button 
                onClick={nextTourStep}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#020617',
                  cursor: 'pointer',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  padding: '5px 12px',
                  fontFamily: 'monospace',
                  boxShadow: '0 0 10px rgba(6,182,212,0.3)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(6,182,212,0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(6,182,212,0.3)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

function matchAdvancedQuery(item, queryStr) {
  const q = (queryStr || '').toLowerCase().trim();
  if (!q) return true;
  
  const SEV_LABELS = { 1: 'low', 2: 'moderate', 3: 'alert', 4: 'high', 5: 'critical' };
  
  // Parse key-value tokens (e.g. "cat:conflict", "severity:critical", "loc:london")
  const tokens = q.match(/([a-z]+):([^\s]+)/g);
  if (tokens) {
    let isMatch = true;
    
    tokens.forEach(token => {
      const parts = token.split(':');
      if (parts.length < 2) return;
      const key = parts[0];
      const val = parts[1];
      
      const itemLocation = (item.location || '').toLowerCase();
      const itemCategory = (item.category || '').toLowerCase();
      const itemSource = (item.source || item.details?.source || '').toLowerCase();
      
      if (key === 'cat' || key === 'category') {
        if (!itemCategory.includes(val)) isMatch = false;
      } else if (key === 'loc' || key === 'location') {
        if (!itemLocation.includes(val)) isMatch = false;
      } else if (key === 'sev' || key === 'severity') {
        const sevName = SEV_LABELS[item.severity] || '';
        if (!sevName.includes(val) && String(item.severity) !== val) isMatch = false;
      } else if (key === 'src' || key === 'source') {
        if (!itemSource.includes(val)) isMatch = false;
      } else if (key === 'date') {
        const effectiveTime = item.original_post_time || item.timestamp;
        const dateStr = effectiveTime ? new Date(effectiveTime).toLocaleDateString().toLowerCase() : '';
        if (!dateStr.includes(val)) isMatch = false;
      }
    });
    
    const remainingQuery = q.replace(/([a-z]+):([^\s]+)/g, '').trim();
    if (remainingQuery) {
      const standardMatch = 
        (item.title || item.name || '').toLowerCase().includes(remainingQuery) ||
        (item.location || '').toLowerCase().includes(remainingQuery) ||
        (item.category || '').toLowerCase().includes(remainingQuery) ||
        (item.summary || item.description || item.details?.summary || '').toLowerCase().includes(remainingQuery) ||
        (item.source || item.details?.source || '').toLowerCase().includes(remainingQuery);
      return isMatch && standardMatch;
    }
    return isMatch;
  }
  
  const titleMatch = (item.title || item.name || '').toLowerCase().includes(q);
  const locMatch = (item.location || '').toLowerCase().includes(q);
  const catMatch = (item.category || '').toLowerCase().includes(q);
  const summaryMatch = (item.summary || item.description || item.details?.summary || '').toLowerCase().includes(q);
  const sourceMatch = (item.source || item.details?.source || '').toLowerCase().includes(q);
  
  const effectiveTime = item.original_post_time || item.timestamp;
  const dateStr = effectiveTime ? new Date(effectiveTime).toLocaleDateString().toLowerCase() : '';
  const dateMatch = dateStr.includes(q);
  
  const sevName = SEV_LABELS[item.severity] || '';
  const sevMatch = sevName.includes(q) || `severity ${item.severity}`.includes(q) || `sev ${item.severity}`.includes(q);
  
  return titleMatch || locMatch || catMatch || summaryMatch || sourceMatch || dateMatch || sevMatch;
}
