'use client';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import EqualEarthMap2D from './EqualEarthMap2D';
import InteractiveCanvasGlobe3D from './InteractiveCanvasGlobe3D';

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };
const GOOGLE_API_KEY = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').replace(/['"]/g, '');

const FAMOUS_LANDMARKS = [
  {
    id: 'empire-state',
    name: 'EMPIRE STATE BUILDING',
    city: 'New York City, USA',
    lat: 40.748440,
    lon: -73.985656,
    height: 443,
    boxDimensions: { x: 110, y: 90, z: 450 },
    description: 'World-famous 102-story Art Deco skyscraper in Midtown Manhattan, completed in 1931.'
  },
  {
    id: 'one-world-trade',
    name: 'ONE WORLD TRADE CENTER',
    city: 'New York City, USA',
    lat: 40.712743,
    lon: -74.013379,
    height: 541,
    boxDimensions: { x: 120, y: 120, z: 550 },
    description: 'The tallest building in the Western Hemisphere, standing at a symbolic 1,776 feet.'
  },
  {
    id: 'chrysler-building',
    name: 'CHRYSLER BUILDING',
    city: 'New York City, USA',
    lat: 40.751621,
    lon: -73.975291,
    height: 319,
    boxDimensions: { x: 90, y: 90, z: 330 },
    description: 'A classic masterpiece of Art Deco architecture, once the tallest building in the world.'
  },
  {
    id: 'shard-london',
    name: 'THE SHARD',
    city: 'London, UK',
    lat: 51.504500,
    lon: -0.086500,
    height: 310,
    boxDimensions: { x: 80, y: 80, z: 315 },
    description: 'The tallest building in the United Kingdom, designed by Renzo Piano.'
  },
  {
    id: 'eiffel-tower',
    name: 'EIFFEL TOWER',
    city: 'Paris, France',
    lat: 48.858400,
    lon: 2.294500,
    height: 330,
    boxDimensions: { x: 125, y: 125, z: 340 },
    description: 'The global cultural icon of France and one of the most recognizable structures in the world.'
  },
  {
    id: 'tokyo-skytree',
    name: 'TOKYO SKYTREE',
    city: 'Tokyo, Japan',
    lat: 35.710063,
    lon: 139.810700,
    height: 634,
    boxDimensions: { x: 130, y: 130, z: 640 },
    description: 'The tallest tower in the world and the second tallest structure globally.'
  },
  {
    id: 'burj-khalifa',
    name: 'BURJ KHALIFA',
    city: 'Dubai, UAE',
    lat: 25.197200,
    lon: 55.274400,
    height: 828,
    boxDimensions: { x: 150, y: 150, z: 835 },
    description: 'The absolute tallest building and structure in human history, standing at 828 meters.'
  }
];

const canvasCache = {};

const isValidCoordinate = (lat, lon) => {
  const l1 = parseFloat(lat);
  const l2 = parseFloat(lon);
  return !isNaN(l1) && !isNaN(l2) && l1 >= -90.0 && l1 <= 90.0 && l2 >= -180.0 && l2 <= 180.0;
};

const createReticleCanvas = (color = '#00f0ff', size = 32) => {
  if (typeof document === 'undefined') return null;
  const cacheKey = `reticle-${color}-${size}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const center = size / 2;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  
  ctx.beginPath();
  ctx.arc(center, center, 10, 0, 2 * Math.PI);
  ctx.stroke();
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(center, center, 3, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.0;
  
  ctx.beginPath();
  ctx.moveTo(center, center - 14);
  ctx.lineTo(center, center - 8);
  ctx.moveTo(center, center + 8);
  ctx.lineTo(center, center + 14);
  ctx.moveTo(center - 14, center);
  ctx.lineTo(center - 8, center);
  ctx.moveTo(center + 8, center);
  ctx.lineTo(center + 14, center);
  ctx.stroke();
  
  canvasCache[cacheKey] = canvas;
  return canvas;
};

const createEmojiCanvas = (emoji, size = 32) => {
  if (typeof document === 'undefined') return null;
  const cacheKey = `emoji-${emoji}-${size}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
  ctx.shadowBlur = 6;
  ctx.font = `${size - 10}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2);

  canvasCache[cacheKey] = canvas;
  return canvas;
};

const createCircleCanvas = (color, size = 16, outlineColor = '#ffffff', outlineWidth = 1.5) => {
  if (typeof document === 'undefined') return null;
  const cacheKey = `circle-grounded-${color}-${size}-${outlineColor}-${outlineWidth}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const canvas = document.createElement('canvas');
  const totalSize = size + outlineWidth * 2 + 10;
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext('2d');

  const center = totalSize / 2;
  const radius = size / 2;

  // Grounding contact halo (anchored visibly on both light and dark Carto tiles)
  ctx.beginPath();
  ctx.arc(center, center, radius + outlineWidth + 2, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outlineColor;
  ctx.stroke();

  canvasCache[cacheKey] = canvas;
  return canvas;
};

const createDiamondCanvas = (color = '#f59e0b', size = 12, outlineColor = '#0f172a', outlineWidth = 1.4) => {
  if (typeof document === 'undefined') return null;
  const cacheKey = `diamond-${color}-${size}-${outlineColor}-${outlineWidth}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const totalSize = size + outlineWidth * 2 + 6;
  const canvas = document.createElement('canvas');
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext('2d');
  const c = totalSize / 2;
  const r = size / 2;

  ctx.beginPath();
  ctx.moveTo(c, c - r - 1.5);
  ctx.lineTo(c + r + 1.5, c);
  ctx.lineTo(c, c + r + 1.5);
  ctx.lineTo(c - r - 1.5, c);
  ctx.closePath();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(c, c - r);
  ctx.lineTo(c + r, c);
  ctx.lineTo(c, c + r);
  ctx.lineTo(c - r, c);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outlineColor;
  ctx.stroke();

  canvasCache[cacheKey] = canvas;
  return canvas;
};

const MISSION_COLORS = {
  station: '#00f0ff',
  earth_obs: '#10b981',
  navigation: '#f59e0b',
  comms: '#38bdf8',
  weather_geo: '#a855f7',
  science: '#ec4899'
};

const createSatelliteGlyphCanvas = (color = '#38bdf8', isSelected = false) => {
  if (typeof document === 'undefined') return null;
  const cacheKey = `sat-backlight-${color}-${isSelected ? '1' : '0'}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const size = isSelected ? 52 : 38;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  // Soft category-colored backlight glow only (no opaque circle or border ring)
  const grad = ctx.createRadialGradient(c, c, 2, c, c, size * 0.48);
  grad.addColorStop(0, `${color}b8`);
  grad.addColorStop(0.45, `${color}44`);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const iconPx = isSelected ? 26 : 19;
  ctx.shadowColor = color;
  ctx.shadowBlur = isSelected ? 12 : 8;
  ctx.font = `${iconPx}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🛰️', c, c + 1);

  canvasCache[cacheKey] = canvas;
  return canvas;
};

const createClusterCanvas = (count, color = '#38bdf8') => {
  if (typeof document === 'undefined') return null;
  const label = count > 99 ? '99+' : String(count);
  const cacheKey = `cluster-${label}-${color}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const size = count >= 10 ? 34 : 28;
  const canvas = document.createElement('canvas');
  canvas.width = size + 8;
  canvas.height = size + 8;
  const ctx = canvas.getContext('2d');
  const c = (size + 8) / 2;
  const r = size / 2;

  ctx.beginPath();
  ctx.arc(c, c, r + 2.5, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(c, c, r, 0, 2 * Math.PI);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${count >= 100 ? 10 : 12}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, c, c + 0.5);

  canvasCache[cacheKey] = canvas;
  return canvas;
};

const createDropletCanvas = (color, size = 32) => {
  if (typeof document === 'undefined') return null;
  const cacheKey = `droplet-${color}-${size}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.font = `${size - 10}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💧', size / 2, size / 2);

  canvasCache[cacheKey] = canvas;
  return canvas;
};

const createPowerCanvas = (color, size = 32) => {
  if (typeof document === 'undefined') return null;
  const cacheKey = `power-${color}-${size}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.font = `${size - 10}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', size / 2, size / 2);

  canvasCache[cacheKey] = canvas;
  return canvas;
};

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_2lpu_1_f2c6edda75611222b49c9464';
const CARTO_DARK_MATTER_URL = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
const CARTO_DARK_MINIMAL_URL = `https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
const CARTO_LIGHT_URL = `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
const CARTO_SUBDOMAINS = ['a', 'b', 'c', 'd'];

const getLeafletTileUrl = (style) => {
  if (style === 'light') {
    return {
      url: CARTO_LIGHT_URL,
      credit: 'CartoDB Positron'
    };
  } else if (style === 'minimal') {
    return {
      url: CARTO_DARK_MINIMAL_URL,
      credit: 'CartoDB Dark Minimal'
    };
  } else if (style === 'tactical' || style === 'dark') {
    return {
      url: CARTO_DARK_MATTER_URL,
      credit: 'CartoDB Dark Matter'
    };
  } else if (style === 'lights') {
    return {
      url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Earth_at_Night_2016/MapServer/tile/{z}/{y}/{x}',
      credit: 'Esri Earth at Night'
    };
  } else {
    return {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      credit: 'Google Maps'
    };
  }
};

// Ray-casting point-in-polygon algorithm for ultra-fast, 0MB-memory country boundary selections
const isPointInPolygon = (point, vs) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const isPointInCountry = (lat, lon, feature) => {
  const geom = feature.geometry;
  if (!geom) return false;
  
  if (geom.type === 'Polygon') {
    const exterior = geom.coordinates[0];
    const vs = exterior.map(c => [c[1], c[0]]); // convert to [lat, lon]
    return isPointInPolygon([lat, lon], vs);
  } else if (geom.type === 'MultiPolygon') {
    for (let k = 0; k < geom.coordinates.length; k++) {
      const exterior = geom.coordinates[k][0];
      const vs = exterior.map(c => [c[1], c[0]]);
      if (isPointInPolygon([lat, lon], vs)) {
        return true;
      }
    }
  }
  return false;
};

// Global memory cache for map layers to prevent redundant network fetches
const GLOBE_LAYER_CACHE = {
  countries: null,
  cables: null,
  landingStations: null,
  dataCenters: null,
  aiRegulations: null,
  oilGas: null,
  gpsJamming: null,
  censorship: null,
  environmental: null,
  supplyChain: null,
  biometricWelfare: null,
  aiLabor: null,
};

// Module-level singleton CesiumJS loader so re-renders or 2D<->3D toggles NEVER abort an in-flight download
const CESIUM_CDNS = [
  {
    base: 'https://cdn.jsdelivr.net/npm/cesium@1.115.0/Build/Cesium/',
    js: 'https://cdn.jsdelivr.net/npm/cesium@1.115.0/Build/Cesium/Cesium.js',
    css: 'https://cdn.jsdelivr.net/npm/cesium@1.115.0/Build/Cesium/Widgets/widgets.css'
  },
  {
    base: 'https://unpkg.com/cesium@1.115.0/Build/Cesium/',
    js: 'https://unpkg.com/cesium@1.115.0/Build/Cesium/Cesium.js',
    css: 'https://unpkg.com/cesium@1.115.0/Build/Cesium/Widgets/widgets.css'
  },
  {
    base: 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/',
    js: 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Cesium.js',
    css: 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Widgets/widgets.css'
  }
];

let cesiumSingletonPromise = null;
let cachedGpuTier = null;

/**
 * Classifies client GPU capability for optimal 3D globe performance:
 *  - 'none'     : WebGL disabled/unsupported -> Fast 60fps Canvas 3D Globe (zero crash)
 *  - 'software' : CPU software WebGL (SwiftShader / llvmpipe / Basic Render) -> Fast 60fps Canvas 3D Globe (zero lag)
 *  - 'eco'      : Older integrated GPU / low-RAM / mobile -> Lightweight Eco Cesium 3D (4x lighter shaders/MSAA)
 *  - 'hd'       : Modern hardware GPU -> Full HD Cesium WebGL 3D Globe
 */
function detectGpuTier() {
  if (cachedGpuTier !== null) return cachedGpuTier;
  if (typeof document === 'undefined' || typeof window === 'undefined') return 'hd';
  try {
    const probe = document.createElement('canvas');
    const gl =
      probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      probe.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      probe.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: false });
    if (!gl) {
      cachedGpuTier = 'none';
      return cachedGpuTier;
    }

    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
    const vendor = dbg ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '') : '';
    const combined = `${vendor} ${renderer}`;
    try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {}

    if (/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|apple software|mesa offscreen|gdi generic/i.test(combined)) {
      cachedGpuTier = 'software';
      return cachedGpuTier;
    }

    const isLowMem = typeof navigator !== 'undefined' && typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
    const isLowCpu = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const isMobileViewport = window.innerWidth < 768 || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
    const isOlderIntegrated = /intel.*(hd\s*(2|3|4|5|6)\d{2}|gma|uhd\s*6\d{2})|direct3d9|mali-4|adreno.*(3|4)\d{2}/i.test(combined);

    cachedGpuTier = (isOlderIntegrated || isLowMem || isLowCpu || isMobileViewport) ? 'eco' : 'hd';
    return cachedGpuTier;
  } catch {
    cachedGpuTier = 'none';
    return cachedGpuTier;
  }
}

function loadCesiumLibraryOnce() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Cesium) return Promise.resolve(true);
  if (cesiumSingletonPromise) return cesiumSingletonPromise;

  cesiumSingletonPromise = new Promise((resolve) => {
    const tryCdn = (idx) => {
      if (window.Cesium) {
        resolve(true);
        return;
      }
      if (idx >= CESIUM_CDNS.length) {
        cesiumSingletonPromise = null;
        resolve(false);
        return;
      }

      const cdn = CESIUM_CDNS[idx];
      try {
        window.CESIUM_BASE_URL = cdn.base;
      } catch {}

      let link = document.getElementById('cesium-css-pkg');
      if (!link) {
        link = document.createElement('link');
        link.id = 'cesium-css-pkg';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      if (link.href !== cdn.css) {
        link.href = cdn.css;
      }

      const prevScript = document.getElementById('cesium-js-pkg');
      if (prevScript && (idx > 0 || prevScript.dataset.failed === '1')) {
        prevScript.remove();
      }

      let script = document.getElementById('cesium-js-pkg');
      if (!script) {
        script = document.createElement('script');
        script.id = 'cesium-js-pkg';
        script.src = cdn.js;
        script.async = true;
        document.head.appendChild(script);
      }

      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        if (window.Cesium) {
          resolve(true);
        } else {
          console.warn(`Cesium CDN timed out (${cdn.js}), trying mirror...`);
          try { script.dataset.failed = '1'; script.remove(); } catch {}
          tryCdn(idx + 1);
        }
      }, 9000);

      script.addEventListener(
        'load',
        () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (window.Cesium) resolve(true);
          else {
            try { script.dataset.failed = '1'; script.remove(); } catch {}
            tryCdn(idx + 1);
          }
        },
        { once: true }
      );

      script.addEventListener(
        'error',
        () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          console.warn(`Cesium CDN failed (${cdn.js}), trying mirror...`);
          try { script.dataset.failed = '1'; script.remove(); } catch {}
          tryCdn(idx + 1);
        },
        { once: true }
      );
    };

    tryCdn(0);
  });

  return cesiumSingletonPromise;
}

export default function CesiumGlobe({ 
  displayedMarkers = [], 
  onPointClick = null, 
  mapMode = '3d', 
  mapStyle = 'satellite', 
  focusCoordinate = null, 
  onMapModeChange = null,
  onMapStyleChange = null,
  autoRotate = true,
  onInteraction = null,
  showSatellites = false,
  satellites = [],
  selectedSatellite = null,
  isTracked = false,
  onSatelliteClick = null,
  resetKey = 0,
  eventsEnabled = true,
  weatherEnabled = true,
  oilGasEnabled = true,
  internetCablesEnabled = true,
  powerMineralsEnabled = false,
  dayNightEnabled = true,
  globe3dEnabled = true,
  gpsJammingEnabled = false,
  dataCentersEnabled = false,
  aiRegulationsEnabled = false,
  censorshipEnabled = false,
  envJusticeEnabled = false,
  supplyChainEnabled = false,
  biometricWelfareEnabled = false,
  aiLaborEnabled = false,
  temporalReplayActive = false,
  temporalMilestones = [],
  uiTheme = 'obsidian',
  selectedCountry = null,
  onCountrySelect = null,
  isAdmin = false
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const tilesetRef = useRef(null);
  const petroleumLayerRef = useRef(null);
  const powerLayerRef = useRef(null);
  const cableEntitiesRef = useRef([]);
  const oilGasEntitiesRef = useRef([]);
  const ethicsEntitiesRef = useRef([]);
  const temporalEntitiesRef = useRef([]);
  const gpsJammingEntitiesRef = useRef([]);
  const dataCenterEntitiesRef = useRef([]);
  const aiRegulationsEntitiesRef = useRef([]);
  const threatDataSourceRef = useRef(null);
  const threatEntitiesMapRef = useRef(new Map());
  const renderTimersRef = useRef([]);
  const appliedMapStyleRef = useRef(null);
  const leafletThreatGroupRef = useRef(null);
  const leafletOverlayGroupRef = useRef(null);
  const leafletWeatherLayerRef = useRef(null);
  const lastPickedFeatureRef = useRef(null);
  const selectionEntityRef = useRef(null);
  const lastRepelledMarkersJsonRef = useRef('');
  const lastSelectedSatJsonRef = useRef('');

  // Interactive Country Border Highlights Refs (In-Memory PIP Optimized)
  const countriesGeoJsonRef = useRef(null);
  const selectedCountryEntitiesRef = useRef([]);
  const leafletSelectedLayerRef = useRef(null);

  const ensureCountriesGeoJson = async () => {
    if (countriesGeoJsonRef.current) return countriesGeoJsonRef.current;
    if (GLOBE_LAYER_CACHE.countries) {
      countriesGeoJsonRef.current = GLOBE_LAYER_CACHE.countries;
      return countriesGeoJsonRef.current;
    }
    try {
      const res = await fetch('/data/countries.geo.json');
      if (!res.ok) return null;
      const data = await res.json();
      GLOBE_LAYER_CACHE.countries = data;
      countriesGeoJsonRef.current = data;
      return data;
    } catch (err) {
      console.warn("Failed to lazy-fetch countries GeoJSON:", err);
      return null;
    }
  };

  const [mapError, setMapError] = useState(false);
  const [mapErrorReason, setMapErrorReason] = useState('');
  const [gpuTier, setGpuTier] = useState('pending');
  const [forceHdWebgl, setForceHdWebgl] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(() => typeof window !== 'undefined' && Boolean(window.Cesium));
  const [cesiumRetryNonce, setCesiumRetryNonce] = useState(0);
  const contextLostRetriesRef = useRef(0);
  const prevMapModeRef = useRef(mapMode);

  // Classify client GPU once on mount so older / software-WebGL computers launch instant 60fps 3D instead of freezing or dropping to 2D
  useEffect(() => {
    setGpuTier(detectGpuTier());
  }, []);

  // Schedule immediate + lean follow-up scene renders so async Billboard TextureAtlas / tile uploads
  // ALWAYS paint cleanly even with requestRenderMode=true and autoRotate=false (0% idle GPU).
  const scheduleSceneRenders = useCallback((targetViewer = null) => {
    const v = targetViewer || viewerRef.current;
    if (!v || v.isDestroyed?.()) return;
    try { v.scene.requestRender(); } catch {}
    renderTimersRef.current.forEach(clearTimeout);
    renderTimersRef.current = [];

    let settleFramesAfterLoaded = 0;
    let ticks = 0;
    const pump = () => {
      const cur = viewerRef.current;
      if (!cur || cur.isDestroyed?.() || ticks > 22) return;
      ticks++;
      try {
        cur.scene.requestRender();
        if (cur.scene?.globe?.tilesLoaded) {
          settleFramesAfterLoaded++;
          if (settleFramesAfterLoaded >= 3) return;
        }
      } catch {
        return;
      }
      const tid = setTimeout(pump, ticks < 5 ? 90 : 240);
      renderTimersRef.current.push(tid);
    };
    const firstTid = setTimeout(pump, 75);
    renderTimersRef.current.push(firstTid);
  }, []);

  useEffect(() => {
    return () => {
      renderTimersRef.current.forEach(clearTimeout);
      renderTimersRef.current = [];
    };
  }, []);

  // CRITICAL: 2D Equal Earth is ONLY active when the user explicitly selects '2d'.
  // WebGL failure or software-WebGL NEVER forces the user into 2D or traps them there — 3D seamlessly uses InteractiveCanvasGlobe3D!
  const is2DActive = mapMode === '2d';
  const shouldUseCesiumHd = !is2DActive && !mapError && (forceHdWebgl || gpuTier === 'hd' || gpuTier === 'eco');

  // Keep prevMapModeRef synced
  useEffect(() => {
    prevMapModeRef.current = mapMode;
  }, [mapMode]);

  const triggerSwitchTo3D = useCallback(() => {
    // Always switch immediately to 3D mode (either warm HD Cesium or instant 60fps Canvas 3D Globe — NEVER stuck in 2D!)
    try {
      localStorage.setItem('sovdash_map_mode_v2', '3d');
      window.dispatchEvent(new Event('operator_pref_changed'));
    } catch {}
    if (onMapModeChange) onMapModeChange('3d');

    const hasHealthyViewer = Boolean(!mapError && viewerRef.current && !viewerRef.current.isDestroyed?.());
    if (hasHealthyViewer) {
      try { viewerRef.current.resize(); } catch {}
      scheduleSceneRenders(viewerRef.current);
    }
  }, [mapError, onMapModeChange, scheduleSceneRenders]);

  const triggerTryHdWebgl = useCallback(() => {
    if (typeof viewerCleanupRef.current === 'function') {
      viewerCleanupRef.current();
      viewerCleanupRef.current = null;
    }
    contextLostRetriesRef.current = 0;
    setForceHdWebgl(true);
    setMapError(false);
    setMapErrorReason('');
    setCesiumRetryNonce(n => n + 1);
  }, []);

  // Allow Theme & Settings / Map Options "3D GLOBE" clicks to ALWAYS switch cleanly to 3D
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onForce3D = () => triggerSwitchTo3D();
    window.addEventListener('sovdash_force_3d', onForce3D);
    return () => window.removeEventListener('sovdash_force_3d', onForce3D);
  }, [triggerSwitchTo3D]);

  const [hoverTooltip, setHoverTooltip] = useState({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
  const setHoverTooltipRef = useRef(setHoverTooltip);
  useEffect(() => {
    setHoverTooltipRef.current = setHoverTooltip;
  }, [setHoverTooltip]);

  const onCountrySelectRef = useRef(onCountrySelect);
  useEffect(() => {
    onCountrySelectRef.current = onCountrySelect;
  }, [onCountrySelect]);

  const [regulationsUpdateTrigger, setRegulationsUpdateTrigger] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUpdate = () => {
      setRegulationsUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('event_updated', handleUpdate);
    return () => {
      window.removeEventListener('event_updated', handleUpdate);
    };
  }, []);

  // Track physical keyboard state to differentiate keyboard-scroll shortcuts from trackpad pinch-to-zoom!
  const keysPressedRef = useRef({ ctrl: false, shift: false, alt: false });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e) => {
      if (e.key === 'Control') keysPressedRef.current.ctrl = true;
      if (e.key === 'Shift') keysPressedRef.current.shift = true;
      if (e.key === 'Alt') keysPressedRef.current.alt = true;
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control') keysPressedRef.current.ctrl = false;
      if (e.key === 'Shift') keysPressedRef.current.shift = false;
      if (e.key === 'Alt') keysPressedRef.current.alt = false;
    };

    const handleBlur = () => {
      keysPressedRef.current = { ctrl: false, shift: false, alt: false };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Singleton Cesium loader — only downloads the 2.5MB WebGL bundle when hardware WebGL is active (zero waste on software/no-WebGL PCs!)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Cesium) {
      setScriptsLoaded(true);
      return;
    }
    if (gpuTier === 'pending') return;
    if (!shouldUseCesiumHd && (gpuTier === 'none' || gpuTier === 'software')) {
      return;
    }

    let isMounted = true;
    let idleTimer = null;

    const startLoad = () => {
      loadCesiumLibraryOnce().then((ok) => {
        if (!isMounted) return;
        if (ok && window.Cesium) {
          setScriptsLoaded(true);
        } else if (shouldUseCesiumHd) {
          console.warn('All Cesium CDNs failed; staying seamlessly in Fast 3D Canvas Globe.');
          setMapErrorReason('CDN unavailable');
          setMapError(true);
        }
      });
    };

    if (is2DActive) {
      idleTimer = setTimeout(startLoad, 600);
    } else {
      startLoad();
    }

    return () => {
      isMounted = false;
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [is2DActive, shouldUseCesiumHd, gpuTier, cesiumRetryNonce]);

  const [viewerReady, setViewerReady] = useState(false);
  const [globeSurfaceReady, setGlobeSurfaceReady] = useState(false);
  const [cameraAltitude, setCameraAltitude] = useState(10000000);
  const [tilesetLoaded, setTilesetLoaded] = useState(false);
  const [tilesetLoadingStatus, setTilesetLoadingStatus] = useState('idle'); // 'idle', 'loading', 'loaded', 'error'
  const [showLegend, setShowLegend] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedSkyscraper, setSelectedSkyscraper] = useState(null);
  const selectedSkyscraperRef = useRef(null);
  useEffect(() => {
    selectedSkyscraperRef.current = selectedSkyscraper;
  }, [selectedSkyscraper]);

  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setTargetPos({ x: 0, y: 0 });
  }, [selectedSkyscraper]);

  useEffect(() => {
    if (!isDraggingTarget) return;

    const handleMouseMove = (e) => {
      setTargetPos({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      setTargetPos({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDraggingTarget(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingTarget]);

  const [nearbyLandmark, setNearbyLandmark] = useState(null);

  const [isOrbiting, setIsOrbiting] = useState(false);
  const isOrbitingRef = useRef(false);
  const orbitAngleRef = useRef(0);
  useEffect(() => {
    isOrbitingRef.current = isOrbiting;
  }, [isOrbiting]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletTileLayerRef = useRef(null);

  // Stabilize callback references using a ref to prevent Cesium viewer unmount/recreation loops
  const onPointClickRef = useRef(onPointClick);
  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

  const onSatelliteClickRef = useRef(onSatelliteClick);
  useEffect(() => {
    onSatelliteClickRef.current = onSatelliteClick;
  }, [onSatelliteClick]);

  const selectedSatelliteRef = useRef(selectedSatellite);
  useEffect(() => {
    selectedSatelliteRef.current = selectedSatellite;
  }, [selectedSatellite]);

  // 4. Buttery smooth auto rotation of the globe / cinematic skyscraper orbit (strictly paused in 2D mode & when idle)
  useEffect(() => {
    if (!scriptsLoaded || !viewerRef.current || is2DActive || !viewerReady || (!autoRotate && !isOrbiting)) return;

    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium || viewer.isDestroyed?.()) return;

    let lastTime = performance.now();
    let rafId = null;
    let wasOrbiting = false;

    const stepFrame = (currentTime) => {
      if (!viewerRef.current || viewer.isDestroyed?.()) return;
      const delta = Math.min(0.1, (currentTime - lastTime) / 1000.0);
      lastTime = currentTime;

      if (isOrbitingRef.current && selectedSkyscraperRef.current) {
        wasOrbiting = true;
        const landmark = selectedSkyscraperRef.current;
        const centerPosition = Cesium.Cartesian3.fromDegrees(landmark.lon, landmark.lat, landmark.height / 2);
        orbitAngleRef.current += 0.25 * delta;
        const range = Math.max(landmark.height * 1.6, 350);
        const hpr = new Cesium.HeadingPitchRange(orbitAngleRef.current, Cesium.Math.toRadians(-28.0), range);
        viewer.camera.lookAt(centerPosition, hpr);
        viewer.scene.requestRender();
      } else {
        if (wasOrbiting) {
          try { viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); } catch {}
          wasOrbiting = false;
        }
        if (autoRotate) {
          viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.035 * delta);
          viewer.scene.requestRender();
        }
      }
      rafId = requestAnimationFrame(stepFrame);
    };

    rafId = requestAnimationFrame(stepFrame);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (viewer && viewer.scene && !viewer.isDestroyed?.()) {
        try {
          viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          viewer.scene.requestRender();
        } catch {}
      }
    };
  }, [autoRotate, isOrbiting, is2DActive, viewerReady, scriptsLoaded]);

  // Wake & resize Cesium WebGL canvas cleanly whenever returning from 2D Equal Earth to 3D Globe
  useEffect(() => {
    if (!is2DActive && viewerReady && viewerRef.current && !viewerRef.current.isDestroyed?.()) {
      const v = viewerRef.current;
      try {
        v.resize();
      } catch {}
      scheduleSceneRenders(v);
    }
  }, [is2DActive, viewerReady, scheduleSceneRenders]);

  // 4b. Dynamic loading of Predefined Landmark Reticles in 3D Mode
  const landmarkEntitiesRef = useRef([]);
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current || !viewerReady) return;

    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const clearLandmarks = () => {
      landmarkEntitiesRef.current.forEach(entity => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.entities.remove(entity);
        }
      });
      landmarkEntitiesRef.current = [];
    };

    const shouldShowLandmarks = mapMode === '3d' && mapStyle === 'buildings';

    if (shouldShowLandmarks) {
      clearLandmarks();
      const newEntities = [];

      FAMOUS_LANDMARKS.forEach(landmark => {
        const reticleCanvas = createReticleCanvas('#00f0ff', 36);
        if (!reticleCanvas) return;

        // Position at sea-level but clamp dynamically to Google 3D Tiles rooftops
        const position = Cesium.Cartesian3.fromDegrees(landmark.lon, landmark.lat, 0);

        const entity = viewer.entities.add({
          id: `landmark-reticle-${landmark.id}`,
          name: landmark.name,
          position: position,
          billboard: {
            image: reticleCanvas,
            heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: 100000.0,
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2)
          },
          label: {
            text: landmark.name,
            font: 'bold 9pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.fromCssColorString('#00f0ff'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#020d1a').withAlpha(0.9),
            backgroundPadding: new Cesium.Cartesian2(10, 6),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -22),
            heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 100000.0,
            show: false
          },
          properties: {
            isLandmark: true,
            landmarkData: landmark
          }
        });
        newEntities.push(entity);
      });
      landmarkEntitiesRef.current = newEntities;
    } else {
      clearLandmarks();
    }

    return () => {
      clearLandmarks();
    };
  }, [mapMode, mapStyle, scriptsLoaded, mapError, viewerReady]);

  // 4c. Proximity scanner: detects when camera is looking close to a famous landmark in screen-space (buildings mode only)
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current || !viewerReady || mapStyle !== 'buildings') {
      setNearbyLandmark(null);
      return;
    }

    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    let active = true;

    const checkProximity = () => {
      if (!active || !viewer || viewer.isDestroyed()) return;

      try {
        const camera = viewer.camera;
        const cameraPos = camera.position;
        
        const canvasCenter = new Cesium.Cartesian2(
          viewer.canvas.clientWidth / 2,
          viewer.canvas.clientHeight / 2
        );

        let closest = null;
        let minScreenDist = Infinity;

        FAMOUS_LANDMARKS.forEach(landmark => {
          const lmPosition = Cesium.Cartesian3.fromDegrees(landmark.lon, landmark.lat, landmark.height / 2);
          const windowCoords = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, lmPosition);
          if (Cesium.defined(windowCoords)) {
            const dx = canvasCenter.x - windowCoords.x;
            const dy = canvasCenter.y - windowCoords.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minScreenDist) {
              minScreenDist = dist;
              closest = landmark;
            }
          }
        });

        const cameraHeight = Cesium.Cartographic.fromCartesian(cameraPos).height;

        // If the closest landmark is within 150px in screen space of the viewport center and camera is sufficiently zoomed in
        if (closest && minScreenDist < 150.0 && cameraHeight < 6000.0) {
          if (!selectedSkyscraperRef.current || selectedSkyscraperRef.current.id !== closest.id) {
            setNearbyLandmark(closest);
          } else {
            setNearbyLandmark(null);
          }
        } else {
          setNearbyLandmark(null);
        }
      } catch (err) {
        setNearbyLandmark(null);
      }
    };

    const removeListener = viewer.camera.changed.addEventListener(checkProximity);

    return () => {
      active = false;
      if (removeListener) removeListener();
    };
  }, [viewerReady, scriptsLoaded, mapError, mapStyle]);

  const handleUserInteraction = () => {
    if (isOrbitingRef.current) {
      setIsOrbiting(false);
    }
    if (autoRotate && onInteraction) {
      onInteraction();
    }
  };

  const selectSkyscraper = (landmark) => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    setSelectedSkyscraper(landmark);
    setIsOrbiting(false);

    if (lastPickedFeatureRef.current && !lastPickedFeatureRef.current.isDestroyed?.()) {
      try {
        lastPickedFeatureRef.current.color = Cesium.Color.WHITE;
      } catch (e) {}
    }
    lastPickedFeatureRef.current = null;

    if (selectionEntityRef.current) {
      viewer.entities.remove(selectionEntityRef.current);
      selectionEntityRef.current = null;
    }

    const centerHeight = landmark.height / 2;
    const centerPosition = Cesium.Cartesian3.fromDegrees(landmark.lon, landmark.lat, centerHeight);

    let heading = 0;
    const orientationProperty = new Cesium.CallbackProperty(() => {
      heading += 0.015;
      const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
      return Cesium.Transforms.headingPitchRollQuaternion(centerPosition, hpr);
    }, false);

    selectionEntityRef.current = viewer.entities.add({
      id: `selected-skyscraper-box`,
      position: centerPosition,
      orientation: orientationProperty,
      box: {
        dimensions: new Cesium.Cartesian3(
          landmark.boxDimensions.x,
          landmark.boxDimensions.y,
          landmark.boxDimensions.z
        ),
        material: Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.12)'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#00f0ff'),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.NONE
      }
    });

    // Decoupled beautiful tactical scanning dome / sensor envelope
    const domeRadius = Math.max(landmark.boxDimensions.x, landmark.boxDimensions.y) * 1.5;
    viewer.entities.add({
      id: `selected-skyscraper-dome`,
      position: centerPosition,
      ellipsoid: {
        radii: new Cesium.Cartesian3(domeRadius, domeRadius, landmark.height * 0.8),
        material: Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.08)'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.35)'),
        outlineWidth: 1.5
      }
    });

    // Add tactical floating sensor point cloud nodes
    const numNodes = 4;
    for (let i = 0; i < numNodes; i++) {
      const angle = (i * 2 * Math.PI) / numNodes;
      const radius = domeRadius * 1.35;
      const xOffset = radius * Math.cos(angle);
      const yOffset = radius * Math.sin(angle);
      
      const nodeLon = landmark.lon + xOffset / 111000;
      const nodeLat = landmark.lat + yOffset / (111000 * Math.cos(Cesium.Math.toRadians(landmark.lat)));
      const nodeHeight = landmark.height * (0.35 + i * 0.15);

      const nodePos = Cesium.Cartesian3.fromDegrees(nodeLon, nodeLat, nodeHeight);

      viewer.entities.add({
        id: `selected-skyscraper-node-${i}`,
        position: nodePos,
        ellipsoid: {
          radii: new Cesium.Cartesian3(6, 6, 6),
          material: Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.85)'),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1
        },
        label: {
          text: `VERTEX-0${i+1} [BOUNDING REF]`,
          font: 'bold 7pt monospace',
          fillColor: Cesium.Color.fromCssColorString('#00f0ff'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#020d1a').withAlpha(0.85)
        }
      });
    }

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        landmark.lon - 0.0025, 
        landmark.lat - 0.0025, 
        landmark.height + 200
      ),
      orientation: {
        heading: Cesium.Math.toRadians(45.0),
        pitch: Cesium.Math.toRadians(-35.0),
        roll: 0.0
      },
      duration: 2.0
    });
  };

  const clearSkyscraperSelection = () => {
    setSelectedSkyscraper(null);
    setIsOrbiting(false);
    if (viewerRef.current) {
      const viewer = viewerRef.current;
      if (selectionEntityRef.current) {
        viewer.entities.remove(selectionEntityRef.current);
        selectionEntityRef.current = null;
      }
      try {
        const dome = viewer.entities.getById('selected-skyscraper-dome');
        if (dome) viewer.entities.remove(dome);
        for (let i = 0; i < 4; i++) {
          const node = viewer.entities.getById(`selected-skyscraper-node-${i}`);
          if (node) viewer.entities.remove(node);
        }
      } catch (e) {}
    }
  };

  const handleZoomIn = () => {
    if (!viewerRef.current) return;
    const camera = viewerRef.current.camera;
    const scene = viewerRef.current.scene;
    let height = 10000000.0;
    try {
      const cartographic = scene.globe.ellipsoid.cartesianToCartographic(camera.position);
      if (cartographic) height = cartographic.height;
    } catch(e) {}
    camera.move(camera.direction, height * 0.25);
    try { scene.requestRender(); } catch {}
  };

  const handleZoomOut = () => {
    if (!viewerRef.current) return;
    const camera = viewerRef.current.camera;
    const scene = viewerRef.current.scene;
    let height = 10000000.0;
    try {
      const cartographic = scene.globe.ellipsoid.cartesianToCartographic(camera.position);
      if (cartographic) height = cartographic.height;
    } catch(e) {}
    camera.move(camera.direction, -height * 0.25);
    try { scene.requestRender(); } catch {}
  };

  const handleResetNorth = () => {
    if (!viewerRef.current) return;
    const camera = viewerRef.current.camera;
    const scene = viewerRef.current.scene;
    const Cesium = window.Cesium;
    if (!Cesium) return;
    
    try {
      const windowPosition = new Cesium.Cartesian2(containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2);
      const ray = camera.getPickRay(windowPosition);
      const target = scene.globe.pick(ray, scene);

      if (Cesium.defined(target)) {
        const cartographic = scene.globe.ellipsoid.cartesianToCartographic(camera.position);
        camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            Cesium.Math.toDegrees(cartographic.longitude),
            Cesium.Math.toDegrees(cartographic.latitude),
            cartographic.height
          ),
          orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: camera.pitch,
            roll: 0.0
          },
          duration: 1.0
        });
      }
    } catch(e) {}
  };

  const handleToggleTilt = () => {
    if (!viewerRef.current) return;
    const camera = viewerRef.current.camera;
    const scene = viewerRef.current.scene;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    try {
      const windowPosition = new Cesium.Cartesian2(containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2);
      const ray = camera.getPickRay(windowPosition);
      const target = scene.globe.pick(ray, scene);

      const currentPitchDeg = Cesium.Math.toDegrees(camera.pitch);
      const targetPitchRad = currentPitchDeg < -75 
        ? Cesium.Math.toRadians(-45.0) 
        : Cesium.Math.toRadians(-90.0);

      if (Cesium.defined(target)) {
        // Safe math: pivot smoothly around target point, maintaining correct range to prevent camera sliding/glitching!
        const range = Cesium.Cartesian3.distance(camera.position, target);
        camera.flyTo({
          destination: target,
          orientation: {
            heading: camera.heading,
            pitch: targetPitchRad,
            range: range
          },
          duration: 1.0
        });
      } else {
        // Fallback to top-down or current position if looking off the globe
        camera.flyTo({
          destination: camera.position,
          orientation: {
            heading: camera.heading,
            pitch: targetPitchRad,
            roll: 0.0
          },
          duration: 1.0
        });
      }
    } catch(e) {
      console.error("Failed to toggle camera tilt smoothly:", e);
    }
  };

  // Pre-calculate repelled coordinates to prevent overlapping clusters on both maps!
  const repelledMarkers = useMemo(() => {
    if (!eventsEnabled || !displayedMarkers || displayedMarkers.length === 0) return [];
    
    // Create mutable copy of displayed markers with lat/lon coordinates, filtering invalid ones
    const points = displayedMarkers.map((m, idx) => {
      const parsedLat = parseFloat(m.lat);
      const parsedLon = parseFloat(m.lon);
      return {
        original: m,
        lat: isNaN(parsedLat) ? null : parsedLat,
        lon: isNaN(parsedLon) ? null : parsedLon,
        index: idx
      };
    }).filter(p => {
      return p.lat !== null && p.lon !== null && 
             p.lat >= -90.0 && p.lat <= 90.0 && 
             p.lon >= -180.0 && p.lon <= 180.0;
    });

    // Seed identical/near-identical coordinate pairs deterministically so repulsion separates cleanly
    const seedBuckets = {};
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const bk = `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;
      const bIdx = seedBuckets[bk] || 0;
      seedBuckets[bk] = bIdx + 1;
      if (bIdx > 0) {
        const a = bIdx * 2.39996323;
        const r = 0.35;
        const cosL = Math.max(0.28, Math.cos((p.lat * Math.PI) / 180));
        p.lat = Math.max(-82, Math.min(82, p.lat + r * Math.cos(a)));
        p.lon = Math.max(-179, Math.min(179, p.lon + (r * Math.sin(a)) / cosL));
      }
    }

    const gravity = 0.045;
    const repelForce = 0.36;
    const thresholdDegrees = 2.45;
    const maxDriftDegrees = 2.15;
    const iterations = 16;
    const cellSize = 3.0;

    // Spatial-grid accelerated marker separation (~10x faster than O(N^2) full scan on older CPUs)
    for (let step = 0; step < iterations; step++) {
      const grid = new Map();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const cx = Math.floor(p.lat / cellSize);
        const cy = Math.floor(p.lon / cellSize);
        const key = `${cx},${cy}`;
        let bucket = grid.get(key);
        if (!bucket) {
          bucket = [];
          grid.set(key, bucket);
        }
        bucket.push(i);
      }

      let maxMove = 0;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const cosLat = Math.max(0.28, Math.cos((p1.lat * Math.PI) / 180));
        const cx = Math.floor(p1.lat / cellSize);
        const cy = Math.floor(p1.lon / cellSize);
        const lonSpanCells = Math.min(4, Math.ceil(1 / cosLat));
        let forceLat = 0;
        let forceLon = 0;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -lonSpanCells; dy <= lonSpanCells; dy++) {
            const bucket = grid.get(`${cx + dx},${cy + dy}`);
            if (!bucket) continue;
            for (let b = 0; b < bucket.length; b++) {
              const j = bucket[b];
              if (i === j) continue;
              const p2 = points[j];

              const dLat = p1.lat - p2.lat;
              if (Math.abs(dLat) >= thresholdDegrees) continue;
              const dLonScaled = (p1.lon - p2.lon) * cosLat;
              if (Math.abs(dLonScaled) >= thresholdDegrees) continue;
              const distSq = dLat * dLat + dLonScaled * dLonScaled;
              if (distSq < thresholdDegrees * thresholdDegrees) {
                const dist = Math.sqrt(distSq) || 0.01;
                const overlap = thresholdDegrees - dist;
                const invDist = 1 / dist;
                forceLat += dLat * invDist * overlap * repelForce;
                forceLon += (dLonScaled * invDist * overlap * repelForce) / cosLat;
              }
            }
          }
        }

        const origLatDiff = p1.original.lat - p1.lat;
        const origLonDiff = p1.original.lon - p1.lon;
        forceLat += origLatDiff * gravity;
        forceLon += origLonDiff * gravity;

        const prevLat = p1.lat;
        const prevLon = p1.lon;
        const maxLonDrift = maxDriftDegrees / cosLat;
        p1.lat = Math.max(-82, Math.min(82, Math.max(p1.original.lat - maxDriftDegrees, Math.min(p1.original.lat + maxDriftDegrees, p1.lat + forceLat))));
        p1.lon = Math.max(-179, Math.min(179, Math.max(p1.original.lon - maxLonDrift, Math.min(p1.original.lon + maxLonDrift, p1.lon + forceLon))));
        const mv = Math.abs(p1.lat - prevLat) + Math.abs(p1.lon - prevLon);
        if (mv > maxMove) maxMove = mv;
      }
      if (maxMove < 0.015) break;
    }

    return points.map(p => ({
      ...p.original,
      repelledLat: p.lat,
      repelledLon: p.lon
    }));
  }, [displayedMarkers, eventsEnabled]);

  // Synchronize 3D country selection highlights reactively (lazy-loads countries.geo.json if needed)
  useEffect(() => {
    if (!viewerReady || !viewerRef.current) return;
    let cancelled = false;

    const applyCountryHighlight = async () => {
      const viewer = viewerRef.current;
      const Cesium = window.Cesium;
      if (!viewer || viewer.isDestroyed?.() || !Cesium) return;

      selectedCountryEntitiesRef.current.forEach(entity => {
        try { viewer.entities.remove(entity); } catch {}
      });
      selectedCountryEntitiesRef.current = [];

      if (!selectedCountry) {
        try { viewer.scene.requestRender(); } catch {}
        return;
      }

      const geo = await ensureCountriesGeoJson();
      if (cancelled || !geo?.features || !viewerRef.current || viewer.isDestroyed?.()) return;

      const normalizedSearch = selectedCountry.toLowerCase().trim();
      const matchedFeature = geo.features.find(feature =>
        (feature.properties?.name || '').toLowerCase().trim() === normalizedSearch
      );

      if (matchedFeature?.geometry) {
        const geom = matchedFeature.geometry;
        const createPolygonEntity = (coords) => {
          const degrees = [];
          coords.forEach(coord => {
            degrees.push(coord[0], coord[1]);
          });
          return viewer.entities.add({
            name: selectedCountry,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(degrees),
              material: Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.20)'),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.88)'),
              outlineWidth: 2.0
            }
          });
        };

        try {
          if (geom.type === 'Polygon') {
            selectedCountryEntitiesRef.current.push(createPolygonEntity(geom.coordinates[0]));
          } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach(poly => {
              selectedCountryEntitiesRef.current.push(createPolygonEntity(poly[0]));
            });
          }
        } catch (err) {
          console.warn('Failed to create dynamic country polygon entity:', err);
        }
      }

      try { viewer.scene.requestRender(); } catch {}
    };

    applyCountryHighlight();
    return () => { cancelled = true; };
  }, [selectedCountry, scriptsLoaded, viewerReady]);

  // Handle Map and View Reset trigger upon clicking the Refresh icon in LiveMap
  useEffect(() => {
    if (resetKey > 0) {
      clearSkyscraperSelection();
      lastRepelledMarkersJsonRef.current = '';
      lastSelectedSatJsonRef.current = '';

      if (viewerRef.current && !viewerRef.current.isDestroyed?.()) {
        const viewer = viewerRef.current;
        const Cesium = window.Cesium;
        if (Cesium) {
          viewer.trackedEntity = undefined;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(12.0, 20.0, 15000000.0),
            orientation: {
              heading: Cesium.Math.toRadians(0.0),
              pitch: Cesium.Math.toRadians(-90.0),
              roll: 0.0
            },
            duration: 1.6
          });
          try { viewer.scene.requestRender(); } catch {}
        }
      }
    }
  }, [resetKey]);

  // Handle focusing 3D camera straight down onto specific coordinates + transient target reticle
  useEffect(() => {
    if (!focusCoordinate || focusCoordinate.lat === undefined || focusCoordinate.lon === undefined) return;
    const latNum = Number(focusCoordinate.lat);
    const lonNum = Number(focusCoordinate.lon);
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return;

    let timer = null;
    const viewer = viewerRef.current;
    const Cesium = typeof window !== 'undefined' ? window.Cesium : null;

    if (viewer && !viewer.isDestroyed?.() && Cesium) {
      viewer.trackedEntity = undefined;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lonNum, latNum, 2400000.0),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-90.0),
          roll: 0.0
        },
        duration: 1.4
      });

      try {
        const oldRing = viewer.entities.getById('focus-target-ring');
        if (oldRing) viewer.entities.remove(oldRing);
        viewer.entities.add({
          id: 'focus-target-ring',
          position: Cesium.Cartesian3.fromDegrees(lonNum, latNum, 0),
          ellipse: {
            semiMajorAxis: 135000.0,
            semiMinorAxis: 135000.0,
            height: 0,
            material: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.14),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.95),
            outlineWidth: 2
          }
        });
        viewer.scene.requestRender();
        timer = setTimeout(() => {
          try {
            if (!viewer.isDestroyed?.()) {
              const ring = viewer.entities.getById('focus-target-ring');
              if (ring) viewer.entities.remove(ring);
              viewer.scene.requestRender();
            }
          } catch {}
        }, 6000);
      } catch {}
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [focusCoordinate]);

  // Listen to 3D map container DOM element resizes
  useEffect(() => {
    if (typeof window === 'undefined' || !('ResizeObserver' in window)) return;
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed?.()) {
        try {
          viewerRef.current.resize();
          viewerRef.current.scene.requestRender();
        } catch {}
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [scriptsLoaded, viewerReady]);

  // Cleanup Cesium resources strictly on component unmount
  const viewerCleanupRef = useRef(null);
  useEffect(() => {
    return () => {
      if (typeof viewerCleanupRef.current === 'function') {
        viewerCleanupRef.current();
        viewerCleanupRef.current = null;
      }
    };
  }, []);

  // 3. Initialize Cesium HD WebGL Globe cleanly when hardware 3D is active (with Eco GPU optimization & multi-tier WebGL fallback)
  useEffect(() => {
    if (!scriptsLoaded || !shouldUseCesiumHd || typeof window === 'undefined' || !containerRef.current || viewerRef.current) return;

    const Cesium = window.Cesium;
    if (!Cesium) {
      console.warn('CesiumJS not available in window; staying on Fast 3D Canvas Globe.');
      setMapErrorReason('Cesium unavailable');
      setMapError(true);
      return;
    }

    let viewer;
    try {
      // Ensure container has no stale DOM children from any prior aborted initialization
      containerRef.current.innerHTML = '';

      let mapUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      let creditStr = 'Google Maps';

      if (mapStyle === 'light') {
        mapUrl = CARTO_LIGHT_URL;
        creditStr = 'CartoDB Positron';
      } else if (mapStyle === 'minimal') {
        mapUrl = CARTO_DARK_MINIMAL_URL;
        creditStr = 'CartoDB Dark Minimal';
      } else if (mapStyle === 'tactical' || mapStyle === 'dark') {
        mapUrl = CARTO_DARK_MATTER_URL;
        creditStr = 'CartoDB Dark Matter';
      } else if (mapStyle === 'lights') {
        mapUrl = 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Earth_at_Night_2016/MapServer/tile/{z}/{y}/{x}';
        creditStr = 'Esri Earth at Night';
      }

      const isCartoUrl = mapUrl.includes('basemaps.cartocdn.com');
      const createBaseProvider = () =>
        new Cesium.UrlTemplateImageryProvider({
          url: mapUrl,
          credit: creditStr,
          ...(isCartoUrl ? { subdomains: CARTO_SUBDOMAINS } : {})
        });
      appliedMapStyleRef.current = mapStyle;

      const isMobileDevice = typeof window !== 'undefined' && (window.innerWidth < 768 || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && window.innerWidth < 1024));
      const isLowMem = typeof navigator !== 'undefined' && typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
      const isEcoProfile = gpuTier === 'eco' || gpuTier === 'software' || isMobileDevice || isLowMem;

      // Guard against 0x0 container during initial flexbox hydration so WebGL framebuffer creation never throws
      if (containerRef.current.clientWidth < 16 || containerRef.current.clientHeight < 16) {
        const retryTimer = setTimeout(() => setCesiumRetryNonce(n => n + 1), 120);
        return () => clearTimeout(retryTimer);
      }

      const buildViewerOpts = (tier = 'primary') => {
        const provider = createBaseProvider();
        const isCompat = tier === 'compat' || tier === 'webgl1' || isEcoProfile;
        const opts = {
          contextOptions: {
            ...(tier === 'webgl1' ? { requestWebgl1: true } : {}),
            webgl: isCompat
              ? {
                  alpha: false,
                  depth: true,
                  stencil: false,
                  antialias: false,
                  premultipliedAlpha: true,
                  preserveDrawingBuffer: false,
                  failIfMajorPerformanceCaveat: false,
                  powerPreference: 'low-power'
                }
              : {
                  alpha: false,
                  depth: true,
                  stencil: false,
                  antialias: true,
                  premultipliedAlpha: true,
                  preserveDrawingBuffer: false,
                  failIfMajorPerformanceCaveat: false,
                  powerPreference: 'default'
                }
          },
          // Strip heavy 6-texture skybox/sun/moon/atmosphere shaders on Eco/compat GPUs for ~3-4x faster startup & lower VRAM
          ...(isCompat ? { skyBox: false, sun: false, moon: false, skyAtmosphere: false } : {}),
          msaaSamples: 1,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          navigationInstructionsInitiallyVisible: false,
          animation: false,
          requestRenderMode: true,
          maximumRenderTimeChange: Infinity,
          fullscreenButton: false,
          vrButton: false,
          creditContainer: typeof document !== 'undefined' ? document.createElement('div') : undefined
        };
        if (Cesium.ImageryLayer) {
          opts.baseLayer = new Cesium.ImageryLayer(provider);
        } else {
          opts.imageryProvider = provider;
        }
        return opts;
      };

      try {
        viewer = new Cesium.Viewer(containerRef.current, buildViewerOpts('primary'));
      } catch (primaryErr) {
        console.warn('Primary WebGL context failed, retrying with compatibility WebGL profile:', primaryErr);
        containerRef.current.innerHTML = '';
        try {
          viewer = new Cesium.Viewer(containerRef.current, buildViewerOpts('compat'));
        } catch (compatErr) {
          console.warn('Compatibility WebGL2 profile failed, retrying with WebGL1 ultra-compat profile:', compatErr);
          containerRef.current.innerHTML = '';
          viewer = new Cesium.Viewer(containerRef.current, buildViewerOpts('webgl1'));
        }
      }

      viewer.clock.shouldAnimate = false;
      viewer.resolutionScale = gpuTier === 'software'
        ? 0.72
        : isEcoProfile
          ? 0.86
          : Math.min((typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1, 1.25);
      viewer.useBrowserRecommendedResolution = false;

      // Optimize WebGL2 scene passes (disabling heavy fog & MSAA cuts GPU fill-rate by up to 4x on older laptops!)
      try {
        viewer.scene.msaaSamples = 1;
        if (viewer.scene.fog) viewer.scene.fog.enabled = false;
        if (viewer.scene.postProcessStages?.fxaa) {
          viewer.scene.postProcessStages.fxaa.enabled = !isEcoProfile;
        }
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(mapStyle === 'light' ? '#dbeafe' : '#020617');
      } catch {}

      // Disable default wheel zoom to replace with our normalized, ultra-smooth trackpad/mouse wheel controller
      if (viewer.scene.screenSpaceCameraController) {
        viewer.scene.screenSpaceCameraController.zoomEventTypes = [
          Cesium.CameraEventType.RIGHT_DRAG,
          Cesium.CameraEventType.PINCH
        ];

        // Add Shift + Drag and Ctrl + Drag as intuitive 3D rotation and tilt controls on laptops!
        viewer.scene.screenSpaceCameraController.tiltEventTypes = [
          Cesium.CameraEventType.MIDDLE_DRAG,
          Cesium.CameraEventType.PINCH,
          {
            eventType: Cesium.CameraEventType.LEFT_DRAG,
            modifier: Cesium.KeyboardEventModifier.CTRL
          },
          {
            eventType: Cesium.CameraEventType.LEFT_DRAG,
            modifier: Cesium.KeyboardEventModifier.SHIFT
          }
        ];

        // Ground the camera so panning is immediate, snappy, and intuitive like Google Maps!
        viewer.scene.screenSpaceCameraController.inertiaSpin = 0.15;
        viewer.scene.screenSpaceCameraController.inertiaTranslate = 0.15;
        viewer.scene.screenSpaceCameraController.inertiaZoom = 0.15;
      }

      // Force verification & manual layer loading fallback to ensure we never get a blank blue globe
      if (viewer.imageryLayers.length === 0) {
        viewer.imageryLayers.addImageryProvider(createBaseProvider());
      }

      // Enable Google Maps API key globally in Cesium (defensive guard across CDN builds)
      if (Cesium.GoogleMaps) {
        Cesium.GoogleMaps.defaultApiKey = GOOGLE_API_KEY;
      }

      let removeTileProgressListener = null;
      let removeFirstSurfaceListener = null;
      let surfaceFallbackTimer = null;
      if (viewer.scene?.globe) {
        viewer.scene.globe.show = true;
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(mapStyle === 'light' ? '#dbeafe' : '#0c192c');
        viewer.scene.globe.showGroundAtmosphere = !isEcoProfile;
        viewer.scene.globe.depthTestAgainstTerrain = false;
        viewer.scene.globe.tileCacheSize = isEcoProfile ? 44 : 96;
        viewer.scene.globe.maximumScreenSpaceError = gpuTier === 'software' ? 3.4 : isEcoProfile ? 2.75 : 2.0;
        if (viewer.scene.globe.tileLoadProgressEvent) {
          let lastProgressKick = 0;
          removeTileProgressListener = viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
            const now = performance.now();
            if (now - lastProgressKick > 220) {
              lastProgressKick = now;
              try { viewer.scene.requestRender(); } catch {}
            }
          });
        }
      }

      // Reveal HD WebGL canvas the exact frame root Earth surface tiles finish uploading to GPU (seamless crossfade from Fast 3D Globe!)
      if (viewer.scene?.postRender) {
        removeFirstSurfaceListener = viewer.scene.postRender.addEventListener(() => {
          const renderedTiles = viewer.scene?.globe?._surface?._tilesToRender?.length || 0;
          if (renderedTiles > 0) {
            setGlobeSurfaceReady(true);
            if (surfaceFallbackTimer) {
              clearTimeout(surfaceFallbackTimer);
              surfaceFallbackTimer = null;
            }
            if (removeFirstSurfaceListener) {
              try { removeFirstSurfaceListener(); } catch {}
              removeFirstSurfaceListener = null;
            }
          }
        });
        surfaceFallbackTimer = setTimeout(() => {
          setGlobeSurfaceReady(true);
        }, 2800);
      } else {
        setGlobeSurfaceReady(true);
      }

      viewer.scene.renderError.addEventListener((scene, error) => {
        console.warn('[Cesium Render Loop] Suppressed render error:', error?.message || error);
      });

      // Set camera to premium global view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(12.0, 20.0, 15000000.0),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-90.0),
          roll: 0.0
        }
      });

      // Direct synchronous entity management on viewer.entities (eliminates async CustomDataSource race)
      threatDataSourceRef.current = null;
      threatEntitiesMapRef.current.clear();

      // Safe utility helpers to retrieve properties from Cesium entities without throwing TypeErrors
      const getIsSatellite = (entity) => {
        if (!entity || !entity.properties) return false;
        const props = entity.properties;
        if (typeof props.getValue === 'function') {
          try {
            const val = props.getValue(Cesium.JulianDate.now());
            return val && !!val.isSatellite;
          } catch (e) {
            return false;
          }
        }
        return !!props.isSatellite;
      };

      // Safe utility to read properties from Cesium properties or regular JS objects
      const getPropValue = (propBag, key, defaultValue) => {
        if (!propBag) return defaultValue;
        const prop = propBag[key];
        if (prop === undefined || prop === null) return defaultValue;
        if (typeof prop.getValue === 'function') {
          try {
            return prop.getValue(Cesium.JulianDate.now());
          } catch (e) {
            return prop;
          }
        }
        return prop;
      };

      const resolveProperties = (entity) => {
        if (!entity) return null;
        const props = entity.properties;
        if (!props) return { id: entity.id };
        
        const result = {};
        const keys = props.propertyNames || Object.keys(props);
        keys.forEach(key => {
          result[key] = getPropValue(props, key, null);
        });
        
        // Ensure the ID matches the original event ID (not the "threat-" prefixed map marker ID)
        if (!result.id && entity.id) {
          result.id = entity.id.replace('threat-', '').replace('sat-', '').replace('landmark-reticle-', '');
        }
        
        return result;
      };

      // Screen space event handler for selection and navigation
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      let isPointerDown = false;
      let lastPickTime = 0;
      let lastHoveredId = null;

      handler.setInputAction(() => { isPointerDown = true; }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      handler.setInputAction(() => { isPointerDown = false; }, Cesium.ScreenSpaceEventType.LEFT_UP);
      handler.setInputAction(() => { isPointerDown = true; }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      handler.setInputAction(() => { isPointerDown = false; }, Cesium.ScreenSpaceEventType.RIGHT_UP);

      // Throttled hover pick handler (max ~11 Hz, pauses while orbiting) to eliminate WebGL readPixels stalls
      handler.setInputAction((movement) => {
        if (isPointerDown) return;
        const now = performance.now();
        if (now - lastPickTime < 90) return;
        lastPickTime = now;

        const pickedObject = viewer.scene.pick(movement.endPosition);
        
        // 1. Proximity-based famous landmark hover check (works for 3D building mesh or billboard!)
        const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
        let nearLandmarkEntity = null;
        
        if (is3DActive) {
          let closestLM = null;
          let minLMDist = Infinity;
          
          FAMOUS_LANDMARKS.forEach(lm => {
            const lmPosition = Cesium.Cartesian3.fromDegrees(lm.lon, lm.lat, lm.height || 0);
            const windowCoords = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, lmPosition);
            if (Cesium.defined(windowCoords)) {
              const dx = movement.endPosition.x - windowCoords.x;
              const dy = movement.endPosition.y - windowCoords.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minLMDist) {
                minLMDist = dist;
                closestLM = lm;
              }
            }
          });
          
          if (minLMDist < 60.0 && closestLM) {
            const entId = `landmark-reticle-${closestLM.id}`;
            nearLandmarkEntity = viewer.entities.getById(entId);
          }
        }
        
        if (nearLandmarkEntity) {
          document.body.style.cursor = 'pointer';
          if (nearLandmarkEntity.label) {
            nearLandmarkEntity.label.show = true;
          }
          viewer.entities.values.forEach(entity => {
            if (entity.label && entity !== nearLandmarkEntity) {
              const entIsSat = getIsSatellite(entity);
              if (!entIsSat) {
                entity.label.show = false;
              }
            }
          });
          if (typeof setHoverTooltipRef.current === 'function') {
            setHoverTooltipRef.current({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
          }
          return;
        }

        let hoveredEntity = null;
        if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
          hoveredEntity = pickedObject.id;
        }

        if (hoveredEntity) {
          lastHoveredId = hoveredEntity.id || 'entity';
          const props = hoveredEntity.properties;

          const isCable = getPropValue(props, 'isCable', false);
          const isLandingStation = getPropValue(props, 'isLandingStation', false);
          const isOilGas = getPropValue(props, 'isOilGas', false);
          const isGpsJamming = getPropValue(props, 'isGpsJamming', false);
          const isDataCenter = getPropValue(props, 'isDataCenter', false);
          const isAiRegulation = getPropValue(props, 'isAiRegulation', false);
          const isWeatherStorm = getPropValue(props, 'isWeatherStorm', false);
          const isEthicsOverlay = getPropValue(props, 'isEthicsOverlay', false);
          const isTemporalMilestone = getPropValue(props, 'isTemporalMilestone', false);
          const title = getPropValue(props, 'title', hoveredEntity.name || '');

          if (isCable || isLandingStation || isOilGas || isGpsJamming || isDataCenter || isAiRegulation || isWeatherStorm || isEthicsOverlay || isTemporalMilestone) {
            if (isAiRegulation) {
              document.body.style.cursor = 'pointer';
              const status = getPropValue(props, 'status', 'Proposed');
              const jurisdiction = getPropValue(props, 'jurisdiction', 'Global');
              const area = getPropValue(props, 'area', 'General');
              const dateVal = getPropValue(props, 'date', 'Unknown');
              const tooltipContent = `⚖️ ${title}\nJurisdiction: ${jurisdiction}\nStatus: ${status.toUpperCase()}\nArea: ${area}\nProposed/Effective: ${dateVal}`;
              
              if (typeof setHoverTooltipRef.current === 'function') {
                setHoverTooltipRef.current({
                  show: true,
                  x: movement.endPosition.x,
                  y: movement.endPosition.y,
                  content: tooltipContent,
                  type: 'regulation',
                  title: title,
                  details: {
                    'Jurisdiction': jurisdiction,
                    'Status': status.toUpperCase(),
                    'Area': area,
                    'Proposed/Effective': dateVal
                  }
                });
              }
            } else if (isDataCenter) {
              document.body.style.cursor = 'pointer';
              const operator = getPropValue(props, 'operator', 'Unknown');
              const location = getPropValue(props, 'location', 'Unknown');
              const statusVal = getPropValue(props, 'status', 'active');
              const tooltipContent = `🏢 ${title}\nOperator: ${operator}\nLocation: ${location}\nStatus: ${statusVal.toUpperCase()}`;
              
              if (typeof setHoverTooltipRef.current === 'function') {
                setHoverTooltipRef.current({
                  show: true,
                  x: movement.endPosition.x,
                  y: movement.endPosition.y,
                  content: tooltipContent,
                  type: 'datacenter',
                  title: title,
                  details: {
                    'Operator': operator,
                    'Location': location,
                    'Status': statusVal.toUpperCase()
                  }
                });
              }
            } else if (isGpsJamming) {
              const catVal = getPropValue(props, 'category', 'none');
              if (catVal === 'none') {
                // Ignore background honeycomb grid during interactive hover picks
                document.body.style.cursor = 'default';
                if (typeof setHoverTooltipRef.current === 'function') {
                  setHoverTooltipRef.current({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
                }
                return;
              }
              
              document.body.style.cursor = 'pointer';
              const intensityVal = getPropValue(props, 'intensity', 0);
              const tooltipContent = `📡 GPS Interference Corridor\nRegion: ${title}\nSeverity: ${catVal.toUpperCase()}\nDegradation: ${(intensityVal * 100).toFixed(0)}%`;
              
              if (typeof setHoverTooltipRef.current === 'function') {
                setHoverTooltipRef.current({
                  show: true,
                  x: movement.endPosition.x,
                  y: movement.endPosition.y,
                  content: tooltipContent,
                  type: 'gps',
                  title: 'GPS Interference Corridor',
                  details: {
                    'Region': title,
                    'Severity': catVal.toUpperCase(),
                    'Degradation': `${(intensityVal * 100).toFixed(0)}%`
                  }
                });
              }
            } else {
              document.body.style.cursor = 'pointer';
              let tooltipContent = title;
              let type = 'generic';
              let titlePrefix = '';
              let details = null;
              if (isCable) {
                type = 'cable';
                titlePrefix = '⚓ ';
                tooltipContent = `⚓ Undersea Cable\nName: ${title}`;
                details = { 'Type': 'Undersea Fiber Optic Cable' };
              } else if (isLandingStation) {
                type = 'landing_station';
                titlePrefix = '🔌 ';
                tooltipContent = `🔌 Cable Landing Station\nName: ${title}`;
                details = { 'Type': 'Cable Landing Station' };
              } else if (isTemporalMilestone) {
                const tmDate = getPropValue(props, 'date', '');
                const tmTrack = getPropValue(props, 'track', 'law');
                const tmLoc = getPropValue(props, 'location', 'Global');
                const tmMw = getPropValue(props, 'powerMw', null);
                type = 'regulation';
                titlePrefix = tmTrack === 'compute' ? '⚡ ' : tmTrack === 'institute' ? '🛡️ ' : '⚖️ ';
                tooltipContent = `${titlePrefix}[${tmDate}] ${title}\nTrack: ${tmTrack.toUpperCase()}\nLocation: ${tmLoc}`;
                details = { 'Milestone Date': tmDate, 'Track': tmTrack.toUpperCase(), 'Location': tmLoc, ...(tmMw ? { 'Compute Load': `${tmMw} MW` } : {}) };
              } else if (isEthicsOverlay) {
                const country = getPropValue(props, 'country', 'Global');
                const metricA = getPropValue(props, 'metricLabel', 'Detail');
                const metricVal = getPropValue(props, 'metricValue', 'Verified');
                const src = getPropValue(props, 'source', 'Observatory');
                type = 'regulation';
                titlePrefix = '🔬 ';
                tooltipContent = `🔬 ${title}\nJurisdiction: ${country}\n${metricA}: ${metricVal}\nSource: ${src}`;
                details = { 'Country': country, [metricA]: metricVal, 'Source': src };
              } else if (isWeatherStorm) {
                const stormDate = getPropValue(props, 'date', 'Active');
                type = 'generic';
                titlePrefix = '🌀 ';
                tooltipContent = `🌀 Active Severe Storm\nName: ${title}\nObserved: ${stormDate}`;
                details = { 'Source': 'NASA EONET Satellite Telemetry', 'Observed': stormDate };
              } else if (isOilGas) {
                const isPipeline = getPropValue(props, 'isPipeline', false);
                const isPlant = getPropValue(props, 'isPlant', false);
                if (isPipeline) {
                  const pType = getPropValue(props, 'pipelineType', 'Pipeline');
                  const pCap = getPropValue(props, 'capacity', 'N/A');
                  const pCountries = getPropValue(props, 'countries', '');
                  type = 'energy';
                  titlePrefix = '🛢️ ';
                  tooltipContent = `🛢️ ${title}\nType: ${pType}\nCapacity: ${pCap}${pCountries ? '\nCountries: ' + pCountries : ''}`;
                  details = { 'Type': String(pType).replace(/_/g, ' '), 'Capacity': pCap, 'Countries': pCountries || 'Transnational' };
                } else if (isPlant) {
                  const operator = getPropValue(props, 'operator', 'Operator');
                  const country = getPropValue(props, 'country', 'Global');
                  const capacity = getPropValue(props, 'capacity', 'N/A');
                  const facType = getPropValue(props, 'facilityType', 'refinery');
                  type = 'energy';
                  titlePrefix = facType === 'lng_terminal' ? '⚓ ' : '🏭 ';
                  tooltipContent = `${titlePrefix}${title}\nOperator: ${operator}\nCapacity: ${capacity}\nCountry: ${country}`;
                  details = { 'Facility': facType === 'lng_terminal' ? 'LNG Terminal' : 'Oil Refinery', 'Operator': operator, 'Capacity': capacity, 'Country': country };
                } else {
                  type = 'energy';
                  titlePrefix = '🛢️ ';
                  tooltipContent = `🛢️ Oil/Gas Asset\nName: ${title}`;
                  details = { 'Type': 'Oil/Gas Asset' };
                }
              }
              
              if (typeof setHoverTooltipRef.current === 'function') {
                setHoverTooltipRef.current({
                  show: true,
                  x: movement.endPosition.x,
                  y: movement.endPosition.y,
                  content: tooltipContent,
                  type: type,
                  title: titlePrefix ? `${titlePrefix}${title}` : title,
                  details: details
                });
              }
            }
            return;
          }

          // Clear cables/jamming tooltip for other entities
          if (typeof setHoverTooltipRef.current === 'function') {
            setHoverTooltipRef.current({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
          }

          const isLandmark = props && getPropValue(props, 'isLandmark', false);

          if (isLandmark) {
            document.body.style.cursor = 'pointer';
            if (hoveredEntity.label) {
              hoveredEntity.label.show = true;
            }
            
            viewer.entities.values.forEach(entity => {
              if (entity.label && entity !== hoveredEntity) {
                const entIsSat = getIsSatellite(entity);
                if (!entIsSat) {
                  entity.label.show = false;
                }
              }
            });
            return;
          }

          const isSat = getIsSatellite(hoveredEntity);
          
          if (isSat) {
            document.body.style.cursor = 'pointer';
            const satName = getPropValue(props, 'name', hoveredEntity.name || 'Orbital Node');
            const satCode = getPropValue(props, 'code', '');
            const satAlt = getPropValue(props, 'altitude', 550);
            const satVel = getPropValue(props, 'velocity', '7.6');
            const satOp = getPropValue(props, 'operator', getPropValue(props, 'country', 'Space Agency'));
            const satRegime = getPropValue(props, 'orbitRegime', 'LEO');
            if (typeof setHoverTooltipRef.current === 'function') {
              setHoverTooltipRef.current({
                show: true,
                x: movement.endPosition.x,
                y: movement.endPosition.y,
                content: `🛰️ ${satName}\nNORAD #${satCode} (${satRegime})\nAltitude: ${satAlt} km · ${satVel} km/s`,
                type: 'generic',
                title: `🛰️ ${satName}`,
                details: {
                  'Operator': satOp,
                  'Orbit / NORAD': `${satRegime} · #${satCode}`,
                  'Altitude': `${satAlt} km`,
                  'Velocity': `${satVel} km/s`
                }
              });
            }
          } else if (hoveredEntity.label) {
            // Hovered over a threat feed event: show premium stacked React overlay tooltip
            document.body.style.cursor = 'pointer';

            const evtTitle    = getPropValue(props, 'title',     hoveredEntity.name || '');
            const evtSeverity = getPropValue(props, 'severity',  1);
            const evtCategory = getPropValue(props, 'category',  'Unknown');
            const evtLocation = getPropValue(props, 'location',  'Unknown');
            const evtSource   = getPropValue(props, 'source',    null);
            const evtDetails  = getPropValue(props, 'details',   null);
            const evtTs       = getPropValue(props, 'timestamp', null);

            if (typeof setHoverTooltipRef.current === 'function') {
              setHoverTooltipRef.current({
                show: true,
                x: movement.endPosition.x,
                y: movement.endPosition.y,
                content: `\u26a0\ufe0f ${evtTitle}`,
                type: 'event',
                title: evtTitle,
                details: {
                  'Location': String(evtLocation || 'Unknown'),
                  'Domain': String(evtDetails?.domainPillar || evtCategory || 'Tech Policy'),
                  'Severity': `S${evtSeverity}`,
                  ...(evtSource ? { 'Source': String(evtSource) } : {}),
                  ...(evtTs ? { 'Date': new Date(evtTs).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : {})
                }
              });
            }

            // Keep all non-satellite Cesium labels hidden — the React overlay tooltip
            // handles all event information display; no need to show the raw Cesium label
            viewer.entities.values.forEach(entity => {
              if (entity.label) {
                const entIsSat = getIsSatellite(entity);
                if (!entIsSat) {
                  entity.label.show = false;
                }
              }
            });
          } else {
            // Hovered over another Cesium entity (e.g. dynamic waves ellipse)
            document.body.style.cursor = 'default';
            viewer.entities.values.forEach(entity => {
              if (entity.label) {
                const entIsSat = getIsSatellite(entity);
                if (!entIsSat) {
                  entity.label.show = false;
                }
              }
            });
          }
        } else if (lastHoveredId !== null) {
          lastHoveredId = null;
          document.body.style.cursor = 'default';
          if (typeof setHoverTooltipRef.current === 'function') {
            setHoverTooltipRef.current({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
          }
          viewer.entities.values.forEach(entity => {
            if (entity.label) {
              const entIsSat = getIsSatellite(entity);
              if (!entIsSat) {
                entity.label.show = false;
              }
            }
          });
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // Left-click pick handler to select threat event details, satellites, or 3D buildings
      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.position);
        
        const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
        
        let handled = false;

        // 1. Check screen-space proximity snapping for landmarks first!
        if (is3DActive) {
          let closestLM = null;
          let minLMDist = Infinity;
          
          FAMOUS_LANDMARKS.forEach(lm => {
            const lmPosition = Cesium.Cartesian3.fromDegrees(lm.lon, lm.lat, lm.height || 0);
            const windowCoords = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, lmPosition);
            if (Cesium.defined(windowCoords)) {
              const dx = movement.position.x - windowCoords.x;
              const dy = movement.position.y - windowCoords.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minLMDist) {
                minLMDist = dist;
                closestLM = lm;
              }
            }
          });
          
          if (minLMDist < 80.0 && closestLM) {
            selectSkyscraper(closestLM);
            handled = true;
          }
        }

        // 2. Check if we clicked an existing Cesium Entity (threat marker, satellite, or landmark reticle)
        if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
          const entity = pickedObject.id;
          const props = entity.properties;
          
          const isCable = props && getPropValue(props, 'isCable', false);
          const isLandingStation = props && getPropValue(props, 'isLandingStation', false);
          const isOilGas = props && getPropValue(props, 'isOilGas', false);
          const isGpsJamming = props && getPropValue(props, 'isGpsJamming', false);
          const isDataCenter = props && getPropValue(props, 'isDataCenter', false);
          const isAiRegulation = props && getPropValue(props, 'isAiRegulation', false);
          const isEthicsOverlay = props && getPropValue(props, 'isEthicsOverlay', false);
          const isTemporalMilestone = props && getPropValue(props, 'isTemporalMilestone', false);
          const isSat = getIsSatellite(entity);
          const isThreat = entity.id && entity.id.startsWith('threat-');
          const isLandmark = props && getPropValue(props, 'isLandmark', false);

          if (isThreat || isSat || isCable || isLandingStation || isOilGas || isGpsJamming || isDataCenter || isAiRegulation || isEthicsOverlay || isTemporalMilestone) {
            if (lastPickedFeatureRef.current && !lastPickedFeatureRef.current.isDestroyed?.()) {
              try { lastPickedFeatureRef.current.color = Cesium.Color.WHITE; } catch (e) {}
            }
            lastPickedFeatureRef.current = null;
            clearSkyscraperSelection();

            if (isSat) {
              const metadata = resolveProperties(entity);
              if (onSatelliteClickRef.current && metadata) onSatelliteClickRef.current(metadata);
            } else if (props) {
              const metadata = resolveProperties(entity);
              if (onPointClickRef.current && metadata) onPointClickRef.current(metadata);
            }
            handled = true;
          } else if (isLandmark) {
            const landmark = getPropValue(props, 'landmarkData', null);
            if (landmark) {
              selectSkyscraper(landmark);
            }
            handled = true;
          }
        }

        // 2. General globe surface / 3D building click -> select country in ALL 3D map styles (and skyscrapers in buildings mode)
        if (!handled) {
          let cartesian = is3DActive ? viewer.scene.pickPosition(movement.position) : undefined;
          if (!Cesium.defined(cartesian)) {
            cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
          }
          if (!Cesium.defined(cartesian) && is3DActive) {
            const ray = viewer.camera.getPickRay(movement.position);
            if (ray) cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          }

          if (Cesium.defined(cartesian)) {
            const pickedCartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const pickedLon = Cesium.Math.toDegrees(pickedCartographic.longitude);
            const pickedLat = Cesium.Math.toDegrees(pickedCartographic.latitude);
            const pickedHeight = pickedCartographic.height;

            ensureCountriesGeoJson().then((geo) => {
              if (!geo?.features) return;
              const matchedFeature = geo.features.find((feature) => isPointInCountry(pickedLat, pickedLon, feature));
              if (matchedFeature?.properties?.name && onCountrySelectRef.current) {
                onCountrySelectRef.current(matchedFeature.properties.name);
              }
            });

            if (is3DActive) {
              let closestLandmark = null;
              let minDistance = Infinity;
              FAMOUS_LANDMARKS.forEach((landmark) => {
                const latDiff = (pickedLat - landmark.lat) * 111000;
                const lonDiff = (pickedLon - landmark.lon) * 111000 * Math.cos(Cesium.Math.toRadians(landmark.lat));
                const horizontalDist = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
                if (horizontalDist < minDistance) {
                  minDistance = horizontalDist;
                  closestLandmark = landmark;
                }
              });

              if (minDistance < 300.0 && closestLandmark) {
                selectSkyscraper(closestLandmark);
              }
            }
            handled = true;
          }
        }

        if (!handled) {
          if (lastPickedFeatureRef.current && !lastPickedFeatureRef.current.isDestroyed?.()) {
            try { lastPickedFeatureRef.current.color = Cesium.Color.WHITE; } catch (e) {}
          }
          lastPickedFeatureRef.current = null;
          clearSkyscraperSelection();
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      let lastIsCloseUp = false;
      const updateAltitude = () => {
        try {
          if (viewer && viewer.camera && viewer.camera.position) {
            const cartographic = Cesium.Cartographic.fromCartesian(viewer.camera.position);
            if (cartographic) {
              const height = cartographic.height;
              const isCloseUp = height < 18000;
              if (isCloseUp !== lastIsCloseUp) {
                lastIsCloseUp = isCloseUp;
                setCameraAltitude(height);
              }
            }
          }
        } catch (e) {
          console.warn("Failed to get camera altitude:", e);
        }
      };
      // Initial trigger
      try {
        if (viewer && viewer.camera && viewer.camera.position) {
          const cartographic = Cesium.Cartographic.fromCartesian(viewer.camera.position);
          if (cartographic) {
            lastIsCloseUp = cartographic.height < 18000;
            setCameraAltitude(cartographic.height);
          }
        }
      } catch (e) {}
      
      viewer.camera.changed.addEventListener(updateAltitude);
      viewer.camera.moveEnd.addEventListener(updateAltitude);

      const handleContextLost = (evt) => {
        try { evt.preventDefault(); } catch {}
        if (typeof viewerCleanupRef.current === 'function') {
          viewerCleanupRef.current();
          viewerCleanupRef.current = null;
        }
        if (contextLostRetriesRef.current < 3) {
          contextLostRetriesRef.current += 1;
          console.warn(`[Cesium] Transient WebGL context lost — auto-recovering 3D Globe (attempt ${contextLostRetriesRef.current}/3)...`);
          const scheduleRecover = () => {
            setTimeout(() => setCesiumRetryNonce(n => n + 1), 900 * contextLostRetriesRef.current);
          };
          if (typeof document !== 'undefined' && document.hidden) {
            const onVis = () => {
              if (!document.hidden) {
                document.removeEventListener('visibilitychange', onVis);
                scheduleRecover();
              }
            };
            document.addEventListener('visibilitychange', onVis);
          } else {
            scheduleRecover();
          }
          return;
        }
        console.warn('[Cesium] Repeated WebGL context loss — switching cleanly to Equal Earth 2D.');
        setMapErrorReason('WebGL context lost');
        setMapError(true);
      };
      if (viewer.scene?.canvas) {
        viewer.scene.canvas.addEventListener('webglcontextlost', handleContextLost, false);
      }

      viewerRef.current = viewer;
      setViewerReady(true);
      scheduleSceneRenders(viewer);
      
      // Reset JSON memoization references on new viewer creations
      lastRepelledMarkersJsonRef.current = '';
      lastSelectedSatJsonRef.current = '';

      viewerCleanupRef.current = () => {
        if (surfaceFallbackTimer) {
          clearTimeout(surfaceFallbackTimer);
          surfaceFallbackTimer = null;
        }
        try { if (removeFirstSurfaceListener) removeFirstSurfaceListener(); } catch {}
        try { if (removeTileProgressListener) removeTileProgressListener(); } catch {}
        try { handler.destroy(); } catch {}
        try {
          if (viewer?.scene?.canvas) {
            viewer.scene.canvas.removeEventListener('webglcontextlost', handleContextLost, false);
          }
        } catch {}
        try {
          if (viewer && viewer.camera && !viewer.isDestroyed?.()) {
            viewer.camera.changed.removeEventListener(updateAltitude);
            viewer.camera.moveEnd.removeEventListener(updateAltitude);
          }
        } catch {}
        if (viewerRef.current) {
          try {
            if (!viewerRef.current.isDestroyed?.()) viewerRef.current.destroy();
          } catch {}
          viewerRef.current = null;
        }
        threatDataSourceRef.current = null;
        threatEntitiesMapRef.current.clear();
        appliedMapStyleRef.current = null;
        setViewerReady(false);
        setGlobeSurfaceReady(false);
        tilesetRef.current = null;
        lastPickedFeatureRef.current = null;
        selectionEntityRef.current = null;
      };
    } catch (e) {
      console.warn("Cesium HD WebGL init unavailable; staying smoothly in Fast 3D Canvas Globe:", e);
      if (containerRef.current) containerRef.current.innerHTML = '';
      viewerRef.current = null;
      setViewerReady(false);
      setGlobeSurfaceReady(false);
      setMapErrorReason(String(e?.message || 'WebGL unavailable'));
      setMapError(true);
    }
  }, [mapError, scriptsLoaded, shouldUseCesiumHd, gpuTier, cesiumRetryNonce]);

  // 4. Handle Google 3D Tileset loading and visibility based on Map Mode, Viewport Style, Camera Altitude, and Target Acquisition
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current) return;
    
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const isBuildingsStyle = mapMode === '3d' && mapStyle === 'buildings';
    const isCloseUp = cameraAltitude < 18000;
    const shouldShow3d = (isBuildingsStyle || selectedSkyscraper !== null) && isCloseUp;

    if (shouldShow3d) {
      // Toggle 3D buildings overlay on
      if (tilesetRef.current) {
        tilesetRef.current.show = true;
      } else if (tilesetLoadingStatus === 'idle' || tilesetLoadingStatus === 'error') {
        setTilesetLoadingStatus('loading');
        setTilesetLoaded(false);

        const loadOsmFallback = () => {
          console.log("Attempting fallback to Cesium OSM Buildings...");
          Cesium.createOsmBuildingsAsync().then(osmTileset => {
            if (!viewerRef.current || viewer.isDestroyed?.()) return;

            // Apply cyber-aesthetic styling
            osmTileset.style = new Cesium.Cesium3DTileStyle({
              color: {
                conditions: [
                  ['true', "color('rgba(0, 240, 255, 0.35)')"]
                ]
              }
            });

            viewer.scene.primitives.add(osmTileset);
            tilesetRef.current = osmTileset;
            osmTileset.show = true;
            
            setTilesetLoaded(true);
            setTilesetLoadingStatus('loaded');
            console.log("Cesium OSM Buildings loaded successfully.");
          }).catch(osmErr => {
            console.error("Cesium OSM Buildings fallback failed:", osmErr);
            setTilesetLoadingStatus('error');
          });
        };

        const loadGoogleTilesetViaUrl = () => {
          console.log("Attempting Google 3D Tileset load via URL...");
          const googleTilesUrl = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_API_KEY}`;
          Cesium.Cesium3DTileset.fromUrl(googleTilesUrl, {
            showCreditsOnScreen: true,
            maximumMemoryUsage: 128,
            skipLevelOfDetail: true,
            cullRequestsWithCheckIfSelected: true,
            cullWithSSEBox: true
          }).then(tileset => {
            if (!viewerRef.current || viewer.isDestroyed?.()) return;

            viewer.scene.primitives.add(tileset);
            tilesetRef.current = tileset;
            tileset.show = true;
            
            setTilesetLoaded(true);
            setTilesetLoadingStatus('loaded');
            console.log("Google 3D Tileset loaded successfully via URL.");
          }).catch(err => {
            console.error("Google 3D Tileset load via URL failed. Switching to OSM fallback:", err);
            loadOsmFallback();
          });
        };

        if (!GOOGLE_API_KEY) {
          console.log("No Google Maps API Key found. Loading Cesium OSM Buildings fallback directly...");
          loadOsmFallback();
        } else {
          console.log("Dynamically loading Google Photorealistic 3D Tileset overlay via Cesium helper...");
          Cesium.GoogleMaps.defaultApiKey = GOOGLE_API_KEY;
          
          if (typeof Cesium.createGooglePhotorealistic3DTileset === 'function') {
            Cesium.createGooglePhotorealistic3DTileset().then(tileset => {
              if (!viewerRef.current || viewer.isDestroyed?.()) return;

              viewer.scene.primitives.add(tileset);
              tilesetRef.current = tileset;
              tileset.show = true;
              
              setTilesetLoaded(true);
              setTilesetLoadingStatus('loaded');
              console.log("Google 3D Tileset loaded successfully via createGooglePhotorealistic3DTileset.");
            }).catch(err => {
              console.error("Google 3D Tileset helper load failed. Retrying via URL...", err);
              loadGoogleTilesetViaUrl();
            });
          } else {
            loadGoogleTilesetViaUrl();
          }
        }
      }
    } else {
      // Toggle 3D buildings overlay off
      if (tilesetRef.current) {
        tilesetRef.current.show = false;
      }
    }
  }, [mapMode, mapStyle, cameraAltitude, selectedSkyscraper, tilesetLoadingStatus, mapError, scriptsLoaded, viewerReady]);

  // 5. Update threat markers on Cesium Globe (Synchronous viewer.entities + crisp elevation & async atlas render schedule)
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerReady || !viewerRef.current || viewerRef.current.isDestroyed?.()) return;

    const Cesium = window.Cesium;
    if (!Cesium) return;

    const viewer = viewerRef.current;
    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    // 16km ellipsoidal elevation in standard 3D globe mode eliminates globe-tile chord/skirt Z-fighting on all GPUs
    // while keeping back-hemisphere nodes naturally occluded behind the 6,378km Earth sphere!
    const targetHeight = is3DActive ? 0 : 16000.0;
    const targetHeightRef = is3DActive
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 1200000.0;
    const eyeOffsetGround = new Cesium.Cartesian3(0.0, 0.0, -2500.0);

    // Lightweight structural signature; include viewer entity presence so recreated viewers NEVER skip plotting!
    const repelledSig = repelledMarkers.map(m => `${m.id || m.title}:${m.repelledLat}:${m.repelledLon}:${m.severity}:${m.category}`).join('|');
    const cacheKey = `${is3DActive}_${repelledSig}`;
    if (lastRepelledMarkersJsonRef.current === cacheKey && threatEntitiesMapRef.current.size === repelledMarkers.length) {
      scheduleSceneRenders(viewer);
      return;
    }
    lastRepelledMarkersJsonRef.current = cacheKey;

    try { viewer.entities.suspendEvents(); } catch {}

    try {
      const incomingIds = new Set(repelledMarkers.map(m => `threat-${m.id || m.title}`));

      // Remove stale threat markers tracked in threatEntitiesMapRef
      for (const [entId, ent] of threatEntitiesMapRef.current.entries()) {
        if (!incomingIds.has(entId)) {
          try { viewer.entities.remove(ent); } catch {}
          threatEntitiesMapRef.current.delete(entId);
        }
      }

      // Remove stale pulse rings from viewer.entities
      viewer.entities.values
        .filter(e => e.id && e.id.startsWith('threat-pulse-'))
        .forEach(e => {
          const parentId = e.id.replace('threat-pulse-', 'threat-');
          if (!incomingIds.has(parentId)) {
            viewer.entities.remove(e);
          }
        });

      // Surgically add or update individual grounded event nodes directly on viewer.entities
      repelledMarkers.forEach(m => {
        if (m.repelledLat === undefined || m.repelledLon === undefined || !isValidCoordinate(m.repelledLat, m.repelledLon)) return;

        const sevColorStr = SEV_COLORS[m.severity] || '#ff2d55';
        const threatId = `threat-${m.id || m.title}`;
        const newPos = Cesium.Cartesian3.fromDegrees(m.repelledLon, m.repelledLat, targetHeight);
        const nodeDiameter = 6.8 + (m.severity || 1) * 1.3;

        const existing = threatEntitiesMapRef.current.get(threatId) || viewer.entities.getById(threatId);
        const isManualEvent = String(m.id || '').startsWith('evt-');
        const outlineColor = isManualEvent ? '#00f0ff' : '#ffffff';
        const outlineWidth = isManualEvent ? 1.9 : 1.35;

        if (existing) {
          threatEntitiesMapRef.current.set(threatId, existing);
          const currentPos = existing.position?.getValue?.(Cesium.JulianDate.now());
          if (!currentPos || !Cesium.Cartesian3.equalsEpsilon(currentPos, newPos, 0.01)) {
            existing.position = newPos;
          }

          const prevProps = existing.properties ? (typeof existing.properties.getValue === 'function' ? existing.properties.getValue(Cesium.JulianDate.now()) : existing.properties) : null;
          const needsVisualUpdate = !prevProps || prevProps.severity !== m.severity || prevProps.title !== (m.title || m.name);

          if (needsVisualUpdate) {
            if (existing.billboard) {
              existing.billboard.image = createCircleCanvas(sevColorStr, nodeDiameter, outlineColor, outlineWidth);
            }
            if (existing.label) {
              existing.label.text = `${m.title || m.name}\n[Severity ${m.severity} • ${m.category}]`;
            }
          }

          if (existing.billboard && existing.billboard.heightReference?.getValue() !== targetHeightRef) {
            existing.billboard.heightReference = targetHeightRef;
            existing.billboard.disableDepthTestDistance = targetDisableDepthTest;
          }

          if (existing.label && existing.label.heightReference?.getValue() !== targetHeightRef) {
            existing.label.heightReference = targetHeightRef;
            existing.label.disableDepthTestDistance = targetDisableDepthTest;
            existing.label.show = false;
          }

          existing.properties = m;
        } else {
          const added = viewer.entities.add({
            id: threatId,
            name: m.title || m.name,
            position: newPos,
            billboard: {
              image: createCircleCanvas(sevColorStr, nodeDiameter, outlineColor, outlineWidth),
              scaleByDistance: new Cesium.NearFarScalar(1.5e6, 0.96, 1.8e7, 0.72),
              heightReference: targetHeightRef,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              eyeOffset: eyeOffsetGround,
              disableDepthTestDistance: targetDisableDepthTest,
            },
            label: {
              text: `${m.title || m.name}\n[Severity ${m.severity} • ${m.category}]`,
              font: 'bold 9pt monospace',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.85),
              backgroundPadding: new Cesium.Cartesian2(10, 6),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              heightReference: targetHeightRef,
              disableDepthTestDistance: targetDisableDepthTest,
              show: false,
            },
            properties: m,
          });
          threatEntitiesMapRef.current.set(threatId, added);
        }

        // Crisp static critical-tier halo ring (zero idle GPU wakeups)
        if (m.severity >= 5) {
          const pulseId = `threat-pulse-${m.id || m.title}`;
          const existingPulse = viewer.entities.getById(pulseId);
          if (existingPulse) {
            existingPulse.position = newPos;
            if (existingPulse.ellipse) {
              existingPulse.ellipse.heightReference = targetHeightRef;
            }
          } else {
            viewer.entities.add({
              id: pulseId,
              position: newPos,
              ellipse: {
                semiMajorAxis: 98000.0,
                semiMinorAxis: 98000.0,
                height: 0,
                material: Cesium.Color.fromCssColorString(sevColorStr).withAlpha(0.16),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString(sevColorStr).withAlpha(0.88)
              }
            });
          }
        }
      });
    } finally {
      try { viewer.entities.resumeEvents(); } catch {}
      scheduleSceneRenders(viewer);
    }
  }, [repelledMarkers, mapError, scriptsLoaded, mapMode, mapStyle, isAdmin, viewerReady, scheduleSceneRenders]);

  // 6. Update dynamic orbiting satellites and flight paths
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current) return;

    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    if (!Cesium) return;

    // Create a Set of incoming satellite IDs for quick lookup
    const incomingSatIds = new Set(satellites.map(sat => `sat-${sat.code}`));

    // Surgically remove only satellite entities that are no longer in the satellites list
    const existingSats = viewer.entities.values.filter(e => e.id && e.id.startsWith('sat-'));
    existingSats.forEach(e => {
      // Don't clear paths and Nadir beams here (they are cleared selectively below if needed)
      if (e.id.startsWith('sat-') && !e.id.startsWith('sat-orbit') && !e.id.startsWith('sat-nadir') && !incomingSatIds.has(e.id)) {
        viewer.entities.remove(e);
      }
    });

    // Render 3D Orbiting Satellites in Space dynamically or update existing persistent ones
    const labelBgColor = Cesium.Color.fromCssColorString('#0b132b').withAlpha(0.76);
    const labelOutlineColor = Cesium.Color.fromCssColorString('#020617');

    if (showSatellites && satellites && satellites.length > 0) {
      satellites.forEach(sat => {
        const altInMeters = sat.altitude * 1000;
        const isSelected = selectedSatellite && selectedSatellite.code === sat.code;
        const satId = `sat-${sat.code}`;
        const newPos = Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, altInMeters);

        const satColor = MISSION_COLORS[sat.missionType] || '#38bdf8';
        const labelFillColor = Cesium.Color.fromCssColorString('#f8fafc');
        const existingSat = viewer.entities.getById(satId);
        if (existingSat) {
          existingSat.position = newPos;
          if (existingSat.label) {
            existingSat.label.text = sat.name;
            existingSat.label.show = isSelected;
            existingSat.label.fillColor = labelFillColor;
            existingSat.label.outlineColor = labelOutlineColor;
            existingSat.label.backgroundColor = labelBgColor;
          }
          if (existingSat.billboard) {
            existingSat.billboard.image = createSatelliteGlyphCanvas(satColor, isSelected);
          }
          existingSat.properties = { ...sat, isSatellite: true };
        } else {
          viewer.entities.add({
            id: satId,
            name: sat.name,
            position: newPos,
            billboard: {
              image: createSatelliteGlyphCanvas(satColor, isSelected),
              scaleByDistance: new Cesium.NearFarScalar(2.0e6, 1.1, 2.5e7, 0.72),
              heightReference: Cesium.HeightReference.NONE,
              disableDepthTestDistance: 100000.0,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER
            },
            label: {
              text: sat.name,
              font: '600 8.5pt system-ui, -apple-system, sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: labelFillColor,
              outlineColor: labelOutlineColor,
              outlineWidth: 1.5,
              showBackground: true,
              backgroundColor: labelBgColor,
              backgroundPadding: new Cesium.Cartesian2(8, 4),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -22),
              heightReference: Cesium.HeightReference.NONE,
              show: isSelected,
              disableDepthTestDistance: 100000.0
            },
            properties: { ...sat, isSatellite: true }
          });
        }
      });
    }

    // 6b. Dynamic update/recreation of selected satellite paths & nadir sensors
    const selectedSatToken = selectedSatellite ? `${selectedSatellite.code}` : '';

    if (showSatellites && selectedSatellite) {
      const satPos = Cesium.Cartesian3.fromDegrees(selectedSatellite.longitude, selectedSatellite.latitude, selectedSatellite.altitude * 1000);
      const groundPos = Cesium.Cartesian3.fromDegrees(selectedSatellite.longitude, selectedSatellite.latitude, 0);

      // Only delete and recreate orbit lines when the selected satellite actually changes
      if (lastSelectedSatJsonRef.current !== selectedSatToken) {
        ['sat-orbit-predicted', 'sat-orbit-history'].forEach(id => {
          const ent = viewer.entities.getById(id);
          if (ent) viewer.entities.remove(ent);
        });

        const points = [];
        const inclinationRad = (selectedSatellite.inclination * Math.PI) / 180;
        
        // Exact RAAN alignment math to lock the satellite perfectly centered on its orbit path!
        const satLatRad = (selectedSatellite.latitude * Math.PI) / 180;
        const sinThetaSat = Math.sin(satLatRad) / Math.sin(inclinationRad || 0.001);
        const clampedSinTheta = Math.max(-1.0, Math.min(1.0, sinThetaSat));
        const thetaSat = Math.asin(clampedSinTheta);
        
        const yPrimeSat = Math.cos(inclinationRad) * Math.sin(thetaSat);
        const xPrimeSat = Math.cos(thetaSat);
        const lonOrbitSat = Math.atan2(yPrimeSat, xPrimeSat);
        
        const RAAN_effective = selectedSatellite.longitude - (lonOrbitSat * 180) / Math.PI;

        for (let i = 0; i <= 360; i += 2) {
          const theta = (i * Math.PI) / 180;
          
          const sinLat = Math.sin(inclinationRad) * Math.sin(theta);
          const latRad = Math.asin(sinLat);
          const latitude = (latRad * 180) / Math.PI;
          
          const yPrime = Math.cos(inclinationRad) * Math.sin(theta);
          const xPrime = Math.cos(theta);
          let lonOrbit = Math.atan2(yPrime, xPrime);
          
          let longitude = (lonOrbit * 180) / Math.PI + RAAN_effective;
          longitude = ((longitude + 180) % 360) - 180;
          if (longitude < -180) longitude += 360;

          points.push(Cesium.Cartesian3.fromDegrees(longitude, latitude, selectedSatellite.altitude * 1000));
        }

        // Find index of the closest orbit point
        let closestIdx = 0;
        let minDistance = Infinity;
        
        points.forEach((pt, idx) => {
          const dist = Cesium.Cartesian3.distance(pt, satPos);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = idx;
          }
        });

        const historyPoints = [];
        const futurePoints = [];

        for (let offset = -180; offset <= 0; offset += 2) {
          let idx = closestIdx + Math.round(offset / 2);
          if (idx < 0) idx += points.length;
          if (idx >= points.length) idx -= points.length;
          if (points[idx]) historyPoints.push(points[idx]);
        }

        for (let offset = 0; offset <= 180; offset += 2) {
          let idx = closestIdx + Math.round(offset / 2);
          if (idx < 0) idx += points.length;
          if (idx >= points.length) idx -= points.length;
          if (points[idx]) futurePoints.push(points[idx]);
        }

        // 1. Projected Orbit Path (Neon Cyan Glowing Arrow - Future direction)
        viewer.entities.add({
          id: 'sat-orbit-predicted',
          polyline: {
            positions: futurePoints,
            width: 5.0,
            material: new Cesium.PolylineArrowMaterialProperty(
              Cesium.Color.fromCssColorString('#00ffff').withAlpha(0.85)
            ),
            arcType: Cesium.ArcType.NONE
          }
        });

        // 2. History Orbit Trail (Neon Purple Glow - Past path)
        viewer.entities.add({
          id: 'sat-orbit-history',
          polyline: {
            positions: historyPoints,
            width: 1.5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.15,
              color: Cesium.Color.fromCssColorString('#a855f7').withAlpha(0.4)
            }),
            arcType: Cesium.ArcType.NONE
          }
        });

        lastSelectedSatJsonRef.current = selectedSatToken;
      }

      // Update 3. Vertical Tactical Nadir Scan Beam *in-place*
      const beamEntity = viewer.entities.getById('sat-nadir-beam');
      if (beamEntity) {
        beamEntity.polyline.positions = [satPos, groundPos];
      } else {
        viewer.entities.add({
          id: 'sat-nadir-beam',
          polyline: {
            positions: [satPos, groundPos],
            width: 2.0,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.35,
              color: Cesium.Color.fromCssColorString('#00ffff').withAlpha(0.6)
            })
          }
        });
      }

      // Update 4. Accurate Ground Swath Footprint (static ring — zero continuous frame burn)
      const swathMeters = Math.max(180000.0, Math.min(2200000.0, (Number(selectedSatellite.swathRadiusKm) || 450) * 1000.0));
      const footprintEntity = viewer.entities.getById('sat-nadir-footprint');
      if (footprintEntity) {
        footprintEntity.position = groundPos;
        if (footprintEntity.ellipse) {
          footprintEntity.ellipse.semiMajorAxis = swathMeters;
          footprintEntity.ellipse.semiMinorAxis = swathMeters;
        }
      } else {
        viewer.entities.add({
          id: 'sat-nadir-footprint',
          position: groundPos,
          ellipse: {
            semiMajorAxis: swathMeters,
            semiMinorAxis: swathMeters,
            height: 0,
            material: Cesium.Color.fromCssColorString(MISSION_COLORS[selectedSatellite.missionType] || '#00f0ff').withAlpha(0.09),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(MISSION_COLORS[selectedSatellite.missionType] || '#00f0ff').withAlpha(0.65),
            outlineWidth: 1.5
          }
        });
      }

      // 5. Dynamic Camera Locked Tracking (Assign ONLY ONCE on lock, allowing free user camera navigation around sat!)
      if (isTracked) {
        const satEntity = viewer.entities.getById(`sat-${selectedSatellite.code}`);
        if (satEntity) {
          const currentTracked = viewer.trackedEntity;
          
          // Only assign trackedEntity ONCE if we aren't already tracking it!
          if (currentTracked !== satEntity) {
            viewer.trackedEntity = satEntity;
            
            // Smooth zoom to tracking view on first lock-on
            viewer.zoomTo(satEntity, new Cesium.HeadingPitchRange(
              Cesium.Math.toRadians(0),
              Cesium.Math.toRadians(-28),
              1000000.0 // 1,000 km close-up offset distance
            ));
          }
        }
      } else {
        if (viewer.trackedEntity) {
          viewer.trackedEntity = undefined;
        }
      }
    } else {
      // Clear paths if no active satellite selected or showSatellites is toggled off
      ['sat-orbit-predicted', 'sat-orbit-history', 'sat-nadir-beam', 'sat-nadir-footprint'].forEach(id => {
        const ent = viewer.entities.getById(id);
        if (ent) viewer.entities.remove(ent);
      });
      lastSelectedSatJsonRef.current = '';

      // Release camera tracking if no satellite is selected
      if (viewerRef.current && viewerRef.current.trackedEntity) {
        viewerRef.current.trackedEntity = undefined;
      }
    }
    scheduleSceneRenders(viewer);
  }, [showSatellites, satellites, selectedSatellite, isTracked, scriptsLoaded, mapError, uiTheme, viewerReady, scheduleSceneRenders]);

  // 8. Capture and normalize wheel zoom for perfect laptop trackpad and mouse scroll zoom!
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current || !viewerReady) return;
    const viewer = viewerRef.current;
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Prevent default page scroll/zoom so browser page doesn't bounce
      e.preventDefault();

      const camera = viewer.camera;
      const scene = viewer.scene;
      const Cesium = window.Cesium;
      
      // Get current height above the globe to scale zoom sensitivity beautifully
      let height = 10000000.0;
      try {
        const cartographic = scene.globe.ellipsoid.cartesianToCartographic(camera.position);
        if (cartographic) {
          height = Math.max(100.0, cartographic.height);
        }
      } catch (err) {
        // Fallback
      }

      // Amplify trackpad deltas so they feel natural and active, keeping standard mousewheel inputs clean!
      let delta = e.deltaY;
      if (Math.abs(delta) < 15) {
        // High frequency trackpad scrolling (deltas typically between 0.5 and 5)
        delta = delta * 18; 
      }

      // 1. TILT/ANGLE ACTION: ONLY if physical Ctrl, Shift, or Alt key is held down on the keyboard!
      const isPhysicalKeyPressed = keysPressedRef.current.ctrl || keysPressedRef.current.shift || keysPressedRef.current.alt;
      if (isPhysicalKeyPressed) {
        const tiltAngle = (delta / 120.0) * 0.08; // 0.08 radians (about 4.5 degrees) per scroll tick

        try {
          // Get ground intersection point in the center of the viewport
          const windowPosition = new Cesium.Cartesian2(container.clientWidth / 2, container.clientHeight / 2);
          const ray = camera.getPickRay(windowPosition);
          const target = scene.globe.pick(ray, scene);

          if (Cesium.defined(target)) {
            // Smoothly rotate the camera around the ground center point
            const right = camera.right;
            camera.lookAtTransform(Cesium.Matrix4.fromTranslation(target));
            camera.rotate(right, tiltAngle);
            camera.lookAtTransform(Cesium.Matrix4.IDENTITY); // Restore reference frame
          } else {
            camera.lookUp(tiltAngle); // Safe fallback
          }
        } catch (err) {
          camera.lookUp(tiltAngle);
        }
        try { scene.requestRender(); } catch {}
        return;
      }

      // 2. ZOOM ACTION: Normal scroll zoom
      const zoomRate = height * 0.16;
      const amount = (delta / 120.0) * zoomRate;

      // Adjust camera positioning along its forward direction vector
      camera.move(camera.direction, -amount);
      try { scene.requestRender(); } catch {}
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [mapError, scriptsLoaded, viewerReady]);

  // A. Dynamic Map Style Switcher (Tactical Dark, Satellite, Earth at Night, Terrain, Street)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    // Skip redundant base-layer teardown & re-download if viewer already initialized with this exact mapStyle!
    if (appliedMapStyleRef.current === mapStyle) return;
    appliedMapStyleRef.current = mapStyle;

    const layers = viewer.imageryLayers;
    
    // Choose correct tile URL based on chosen style
    let url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Satellite hybrid default
    let credit = 'Google Maps';

    if (mapStyle === 'light') {
      url = CARTO_LIGHT_URL;
      credit = 'CartoDB Positron';
    } else if (mapStyle === 'minimal') {
      url = CARTO_DARK_MINIMAL_URL;
      credit = 'CartoDB Dark Minimal';
    } else if (mapStyle === 'tactical' || mapStyle === 'dark') {
      url = CARTO_DARK_MATTER_URL;
      credit = 'CartoDB Dark Matter';
    } else if (mapStyle === 'lights') {
      url = 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Earth_at_Night_2016/MapServer/tile/{z}/{y}/{x}';
      credit = 'Esri Earth at Night';
    } else if (mapStyle === 'terrain') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}';
      credit = 'ESRI World Physical';
    } else if (mapStyle === 'street') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      credit = 'OpenStreetMap';
    }

    const isCarto = url.includes('basemaps.cartocdn.com');
    const provider = new Cesium.UrlTemplateImageryProvider({
      url,
      credit,
      ...(isCarto ? { subdomains: CARTO_SUBDOMAINS } : {})
    });
    
    try {
      const newLayer = new Cesium.ImageryLayer(provider);
      // Remove the very first layer (base) and insert this one instead
      if (layers.length > 0) {
        layers.remove(layers.get(0));
        layers.add(newLayer, 0);
      } else {
        layers.add(newLayer);
      }
      if (viewer.scene?.globe) {
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(mapStyle === 'light' ? '#dbeafe' : '#0c192c');
      }
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(mapStyle === 'light' ? '#dbeafe' : '#020617');
      scheduleSceneRenders(viewer);
    } catch (err) {
      console.warn("Dynamic imagery layer swap failed:", err);
    }
  }, [mapStyle, scriptsLoaded, mapError, viewerReady, scheduleSceneRenders]);

  // Dynamic Depth Test toggle to resolve billboard clipping vs premium 3D occlusion
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    
    // Enable depth testing ONLY for premium 3D buildings/mesh to support building occlusion.
    // Keep it disabled for Tactical/Satellite modes to prevent curvature/ellipsoid clipping visual bugs!
    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    viewer.scene.globe.depthTestAgainstTerrain = is3DActive;
    console.log(`Cesium depthTestAgainstTerrain dynamically set to: ${is3DActive}`);
  }, [mapMode, mapStyle, scriptsLoaded, mapError, viewerReady]);

  // C. Day / Night Dynamic Sunlight Shading and Terminator shadows
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    viewer.scene.globe.enableLighting = dayNightEnabled;
    viewer.scene.globe.dynamicAtmosphereColor = dayNightEnabled;
    
    viewer.clock.shouldAnimate = Boolean(dayNightEnabled);
    if (dayNightEnabled) {
      viewer.clock.multiplier = 1.0;
    }
    viewer.scene.requestRender();
  }, [dayNightEnabled, scriptsLoaded, mapError, viewerReady]);

  // D. Real Global Weather: NASA GIBS Global Satellite Precipitation (IMERG) + RainViewer Doppler Radar + EONET Cyclones
  // Deferred until globeSurfaceReady so external weather WMTS tiles NEVER block initial root 3D Earth surface rendering!
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady || !globeSurfaceReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const weatherLayers = [];
    const stormEntities = [];
    let isActive = true;

    if (weatherEnabled) {
      // 1. Global Satellite Precipitation (NASA GIBS IMERG 30-min) with true WebMercator alignment
      try {
        const imergProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate_30min/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
          tilingScheme: new Cesium.WebMercatorTilingScheme(),
          tileWidth: 256,
          tileHeight: 256,
          maximumLevel: 6,
          credit: 'NASA GIBS IMERG 30-Min Global Precipitation'
        });
        const imergLayer = viewer.imageryLayers.addImageryProvider(imergProvider);
        imergLayer.alpha = 0.70;
        weatherLayers.push(imergLayer);
        viewer.scene.requestRender();
      } catch (err) {
        console.warn('NASA GIBS IMERG weather layer failed:', err);
      }

      // 2. Live High-Resolution Ground Doppler Radar (RainViewer NEXRAD Vivid Scheme 6)
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => {
          if (!res.ok) throw new Error('RainViewer metadata request failed');
          return res.json();
        })
        .then(data => {
          if (!isActive || !viewerRef.current || viewer.isDestroyed()) return;
          const host = data.host || 'https://tilecache.rainviewer.com';
          const pastFrames = data.radar?.past;
          if (!pastFrames || pastFrames.length === 0) return;

          const latestFrame = pastFrames[pastFrames.length - 1];
          const weatherProvider = new Cesium.UrlTemplateImageryProvider({
            url: `${host}${latestFrame.path}/256/{z}/{x}/{y}/6/1_1.png`,
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            tileWidth: 256,
            tileHeight: 256,
            maximumLevel: 7,
            credit: 'RainViewer Real-Time Global Radar'
          });

          try {
            const radarLayer = viewer.imageryLayers.addImageryProvider(weatherProvider);
            radarLayer.alpha = 0.80;
            weatherLayers.push(radarLayer);
            viewer.scene.requestRender();
          } catch (err) {
            console.warn('RainViewer radar layer failed:', err);
          }
        })
        .catch(() => {});

      // 3. Active Global Severe Storms & Tropical Cyclones (NASA EONET v3)
      fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=25&category=severeStorms')
        .then(r => (r.ok ? r.json() : null))
        .then(eonet => {
          if (!isActive || !viewerRef.current || viewer.isDestroyed() || !eonet?.events) return;
          eonet.events.forEach(ev => {
            const latestGeo = Array.isArray(ev.geometry) ? ev.geometry[ev.geometry.length - 1] : null;
            const coords = latestGeo?.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) return;
            const ent = viewer.entities.add({
              id: `weather-storm-${ev.id}`,
              name: ev.title,
              position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1], 0),
              billboard: {
                image: createCircleCanvas('#06b6d4', 10, '#ffffff', 2.0),
                scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.1, 1.8e7, 0.72),
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                disableDepthTestDistance: 350000.0
              },
              label: {
                text: `🌀 ${ev.title}`,
                font: 'bold 8.5pt monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.fromCssColorString('#67e8f9'),
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -14),
                disableDepthTestDistance: 350000.0,
                show: true
              },
              properties: {
                isWeatherStorm: true,
                title: ev.title,
                date: String(latestGeo.date || '').slice(0, 10)
              }
            });
            stormEntities.push(ent);
          });
          try { viewer.scene.requestRender(); } catch {}
        })
        .catch(() => {});
    }

    return () => {
      isActive = false;
      if (viewer && !viewer.isDestroyed()) {
        weatherLayers.forEach(layer => {
          try { viewer.imageryLayers.remove(layer); } catch {}
        });
        stormEntities.forEach(ent => {
          try { viewer.entities.remove(ent); } catch {}
        });
        try { viewer.scene.requestRender(); } catch {}
      }
    };
  }, [weatherEnabled, scriptsLoaded, mapError, viewerReady, globeSurfaceReady]);

  // E. Oil & Gas Pipelines (Global Energy Monitor Vector Ingestion)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeight = is3DActive ? 0 : 14000.0;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 1200000.0;
    const eyeOffsetOverlay = new Cesium.Cartesian3(0.0, 0.0, -2200.0);

    // Helper to generate a crisp, solid vector teardrop marker filled dynamically by pipeline category (no bulky white outline)
    const createTeardropCanvas = (colorHex) => {
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 12;
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;
      
      ctx.beginPath();
      ctx.moveTo(5, 0); // Tip of droplet
      ctx.bezierCurveTo(8.5, 3.5, 9.5, 6.5, 9.5, 8.5);
      ctx.arc(5, 8.5, 4.5, 0, Math.PI);
      ctx.bezierCurveTo(0.5, 6.5, 1.5, 3.5, 5, 0);
      ctx.closePath();
      
      ctx.fillStyle = colorHex;
      ctx.fill();
      
      return canvas;
    };

    const clearOilGas = () => {
      if (oilGasEntitiesRef.current && oilGasEntitiesRef.current.length > 0) {
        oilGasEntitiesRef.current.forEach(entity => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.entities.remove(entity);
          }
        });
        oilGasEntitiesRef.current = [];
        try { if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender(); } catch {}
      }
    };

    if (!oilGasEnabled) {
      clearOilGas();
      return;
    }

    const drawOilGas = (data) => {
      if (!data) return;
      clearOilGas();

      const newEntities = [];

      // 1. Draw Pipeline Vector Paths (Geodesic lines anchored on terrain/globe)
      if (data.lines && data.lines.length > 0) {
        data.lines.forEach(line => {
          const degreesArray = [];
          line.coordinates.forEach(coord => {
            degreesArray.push(coord[0], coord[1]);
          });
          if (degreesArray.length < 4) return;

          try {
            const isInactive = String(line.status || '').toLowerCase() === 'inactive';
            const entity = viewer.entities.add({
              name: line.project,
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray(degreesArray),
                width: 1.65,
                arcType: Cesium.ArcType.GEODESIC,
                material: Cesium.Color.fromCssColorString(line.color || '#f97316').withAlpha(isInactive ? 0.35 : 0.72),
                clampToGround: true
              },
              properties: {
                isOilGas: true,
                isPipeline: true,
                title: line.project,
                pipelineType: line.type || 'oil_pipelines',
                capacity: line.capacity || 'N/A',
                countries: line.countries || ''
              }
            });
            newEntities.push(entity);
          } catch (err) {}
        });
      }

      // 2. Draw Verified Oil Refineries (Amber Diamonds) & LNG Terminals (Cyan Nodes)
      if (data.points && data.points.length > 0) {
        data.points.forEach(point => {
          try {
            const isLng = point.facilityType === 'lng_terminal';
            const icon = isLng
              ? createCircleCanvas(point.color || '#38bdf8', 7, '#0f172a', 1.2)
              : createDiamondCanvas(point.color || '#f59e0b', 10, '#0f172a', 1.2);
            const entity = viewer.entities.add({
              name: point.name,
              position: Cesium.Cartesian3.fromDegrees(point.coordinate[0], point.coordinate[1], targetHeight),
              billboard: {
                image: icon,
                scaleByDistance: new Cesium.NearFarScalar(1.2e6, 1.05, 1.6e7, 0.58),
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                eyeOffset: eyeOffsetOverlay,
                heightReference: targetHeightRef,
                disableDepthTestDistance: targetDisableDepthTest
              },
              properties: {
                isOilGas: true,
                isPlant: true,
                title: point.name,
                facilityType: point.facilityType || 'refinery',
                operator: point.operator || 'Major Operator',
                country: point.country || 'Global',
                capacity: point.capacity || 'N/A'
              }
            });
            newEntities.push(entity);
          } catch (err) {}
        });
      }

      oilGasEntitiesRef.current = newEntities;
      scheduleSceneRenders(viewer);
    };

    if (GLOBE_LAYER_CACHE.oilGas) {
      drawOilGas(GLOBE_LAYER_CACHE.oilGas);
    } else {
      fetch('/api/oil-gas')
        .then(res => {
          if (!res.ok) throw new Error("Oil & Gas request failed");
          return res.json();
        })
        .then(data => {
          GLOBE_LAYER_CACHE.oilGas = data;
          drawOilGas(data);
        })
        .catch(err => {
          console.warn("Failed to load vector pipelines and refineries:", err);
        });
    }

    return () => {
      clearOilGas();
    };
  }, [oilGasEnabled, scriptsLoaded, mapError, viewerReady, mapMode, mapStyle]);

  // E2. GPS Jamming & ADS-B Interference Corridors (H3 Hexagonal Grid Ingestion)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const getHexagonPoints = (lat, lon, radiusKm) => {
      const points = [];
      const kmPerDegree = 111.32;
      const latOffset = radiusKm / kmPerDegree;
      const lonOffset = radiusKm / (kmPerDegree * Math.cos(lat * Math.PI / 180));
      
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const vertexLat = lat + latOffset * Math.sin(angle);
        const vertexLon = lon + lonOffset * Math.cos(angle);
        points.push(vertexLon, vertexLat);
      }
      return points;
    };

    const clearGpsJamming = () => {
      if (gpsJammingEntitiesRef.current && gpsJammingEntitiesRef.current.length > 0) {
        gpsJammingEntitiesRef.current.forEach(entity => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.entities.remove(entity);
          }
        });
        gpsJammingEntitiesRef.current = [];
        try { if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender(); } catch {}
      }
    };

    if (!gpsJammingEnabled) {
      clearGpsJamming();
      return;
    }

    const drawGpsJamming = (data) => {
      if (!data || !data.cells) return;
      clearGpsJamming();

      const newEntities = [];

      data.cells.filter(cell => cell.category && cell.category !== 'none' && Number(cell.intensity) > 0).forEach(cell => {
        const points = getHexagonPoints(cell.lat, cell.lon, cell.radiusKm);
        
        // Configurable opacity: less translucency representing more GPS jamming (severe is highly opaque, low is very translucent)
        let opacity = 0.0; // Background mesh cells are empty/fully transparent by default
        let outlineColor = Cesium.Color.fromCssColorString('#eab308').withAlpha(0.08); // Subtle, thin gold grid outline
        
        if (cell.category === 'high') {
          opacity = 0.85; // Highly opaque crimson red
          outlineColor = Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.4);
        } else if (cell.category === 'medium') {
          opacity = 0.55; // Deep translucent orange
          outlineColor = Cesium.Color.fromCssColorString('#f97316').withAlpha(0.35);
        } else if (cell.category === 'low') {
          opacity = 0.28; // Neon translucent gold/yellow
          outlineColor = Cesium.Color.fromCssColorString('#eab308').withAlpha(0.25);
        }

        try {
          const entity = viewer.entities.add({
            name: cell.source,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(points),
              material: opacity > 0 
                ? Cesium.Color.fromCssColorString(cell.color).withAlpha(opacity)
                : Cesium.Color.TRANSPARENT,
              outline: true,
              outlineColor: outlineColor,
              outlineWidth: 0.8, // Elegant hairline outline
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            properties: {
              isGpsJamming: true,
              title: cell.source,
              intensity: cell.intensity,
              category: cell.category
            }
          });
          newEntities.push(entity);
        } catch (err) {
          console.error("Failed to render GPS jamming hexagon polygon:", err);
        }
      });

      gpsJammingEntitiesRef.current = newEntities;
      try { viewer.scene.requestRender(); } catch {}
    };

    if (GLOBE_LAYER_CACHE.gpsJamming) {
      drawGpsJamming(GLOBE_LAYER_CACHE.gpsJamming);
    } else {
      fetch('/api/gps-jamming')
        .then(res => {
          if (!res.ok) throw new Error("GPS Jamming data request failed");
          return res.json();
        })
        .then(data => {
          GLOBE_LAYER_CACHE.gpsJamming = data;
          drawGpsJamming(data);
        })
        .catch(err => {
          console.warn("Failed to load GPS jamming vector cells:", err);
        });
    }

    return () => {
      clearGpsJamming();
    };
  }, [gpsJammingEnabled, scriptsLoaded, mapError, viewerReady]);

  // E3. Global Data Centers & Epoch AI Frontier Compute Clusters (Grounded + Spatially Stratified)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeight = is3DActive ? 0 : 14000.0;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 1200000.0;
    const eyeOffsetDc = new Cesium.Cartesian3(0.0, 0.0, -2200.0);

    const clearDataCenters = () => {
      if (dataCenterEntitiesRef.current && dataCenterEntitiesRef.current.length > 0) {
        dataCenterEntitiesRef.current.forEach(entity => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.entities.remove(entity);
          }
        });
        dataCenterEntitiesRef.current = [];
        try { if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender(); } catch {}
      }
    };

    if (!dataCentersEnabled) {
      clearDataCenters();
      return;
    }

    const drawDataCenters = (data) => {
      if (!data || !data.dataCenters) return;
      clearDataCenters();

      // Always render all Epoch AI Frontier Clusters + spatially stratified colocation hubs globally
      const gridCounts = {};
      const selectedDcs = [];
      for (const dc of data.dataCenters) {
        if (typeof dc.lat !== 'number' || typeof dc.lon !== 'number') continue;
        if (dc.isFrontierCluster) {
          selectedDcs.push(dc);
          continue;
        }
        const gk = `${Math.round(dc.lat / 0.65)},${Math.round(dc.lon / 0.65)}`;
        if ((gridCounts[gk] || 0) < 2 && selectedDcs.length < 750) {
          gridCounts[gk] = (gridCounts[gk] || 0) + 1;
          selectedDcs.push(dc);
        }
      }

      const newEntities = [];
      selectedDcs.forEach(dc => {
        const isFrontier = Boolean(dc.isFrontierCluster || dc.status === 'planned');
        const fillHex = isFrontier ? '#f59e0b' : '#0ea5e9';
        const dotSize = isFrontier ? 10 : 6.5;

        try {
          const entity = viewer.entities.add({
            name: dc.name,
            position: Cesium.Cartesian3.fromDegrees(dc.lon, dc.lat, targetHeight),
            billboard: {
              image: createCircleCanvas(fillHex, dotSize, '#ffffff', isFrontier ? 1.8 : 1.2),
              scaleByDistance: new Cesium.NearFarScalar(1.2e6, 1.0, 1.4e7, 0.65),
              heightReference: targetHeightRef,
              disableDepthTestDistance: targetDisableDepthTest,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              eyeOffset: eyeOffsetDc
            },
            properties: {
              ...dc,
              isDataCenter: true,
              title: dc.name,
              operator: dc.operator || 'Independent',
              location: `${dc.city && !/^unknown$/i.test(dc.city) ? dc.city : ''}${dc.city && !/^unknown$/i.test(dc.city) && dc.country ? ', ' : ''}${dc.country || 'Global'}`,
              status: isFrontier ? (dc.powerMw ? `Frontier (${dc.powerMw} MW)` : 'Frontier Cluster') : (dc.status || 'Active')
            }
          });
          newEntities.push(entity);
        } catch (err) {}
      });

      dataCenterEntitiesRef.current = newEntities;
      scheduleSceneRenders(viewer);
    };

    if (GLOBE_LAYER_CACHE.dataCenters) {
      drawDataCenters(GLOBE_LAYER_CACHE.dataCenters);
    } else {
      fetch('/api/datacenters')
        .then(res => {
          if (!res.ok) throw new Error("Data Centers data request failed");
          return res.json();
        })
        .then(data => {
          GLOBE_LAYER_CACHE.dataCenters = data;
          drawDataCenters(data);
        })
        .catch(err => {
          console.warn("Failed to load global data centers vector points:", err);
        });
    }

    return () => {
      clearDataCenters();
    };
  }, [dataCentersEnabled, scriptsLoaded, mapError, viewerReady, mapMode, mapStyle]);

  // E3.5 Global AI Regulations Map Layer Ingestion & Point Plotting
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeight = is3DActive ? 0 : 14500.0;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 1200000.0;
    const eyeOffsetReg = new Cesium.Cartesian3(0.0, 0.0, -2200.0);

    const clearAiRegulations = () => {
      if (aiRegulationsEntitiesRef.current && aiRegulationsEntitiesRef.current.length > 0) {
        aiRegulationsEntitiesRef.current.forEach(entity => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.entities.remove(entity);
          }
        });
        aiRegulationsEntitiesRef.current = [];
        try { if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender(); } catch {}
      }
    };

    if (!aiRegulationsEnabled) {
      clearAiRegulations();
      return;
    }

    const REG_COLORS = {
      'In effect': '#10b981',
      'Passed': '#0ea5e9',
      'Proposed': '#f59e0b',
      'Policy': '#8b5cf6'
    };

    const drawAiRegulations = (data) => {
      if (!data || !data.aiRegulations) return;
      clearAiRegulations();

      const regBuckets = {};
      const newEntities = [];
      data.aiRegulations.forEach(item => {
        if (typeof item.lon !== 'number' || typeof item.lat !== 'number') return;

        const bk = `${item.lat.toFixed(1)},${item.lon.toFixed(1)}`;
        const idx = regBuckets[bk] || 0;
        regBuckets[bk] = idx + 1;
        const angle = idx * 2.39996323;
        const r = idx === 0 ? 0 : Math.min(0.32, 0.12 * Math.sqrt(idx));
        const dLat = item.lat + r * Math.cos(angle);
        const dLon = item.lon + (r * Math.sin(angle)) / Math.max(0.3, Math.cos(item.lat * Math.PI / 180));

        const statusColor = REG_COLORS[item.status] || '#8b5cf6';

        try {
          const entity = viewer.entities.add({
            id: 'reg-' + item.id,
            name: item.title,
            position: Cesium.Cartesian3.fromDegrees(dLon, dLat, targetHeight),
            billboard: {
              image: createCircleCanvas(statusColor, 9.5, '#ffffff', 1.5),
              scaleByDistance: new Cesium.NearFarScalar(1.2e6, 1.0, 1.4e7, 0.65),
              heightReference: targetHeightRef,
              disableDepthTestDistance: targetDisableDepthTest,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              eyeOffset: eyeOffsetReg
            },
            properties: {
              ...item,
              isAiRegulation: true,
              title: item.title,
              jurisdiction: item.jurisdiction,
              status: item.status,
              area: item.area,
              date: item.date,
              description: item.description
            }
          });
          newEntities.push(entity);
        } catch (err) {
          console.error("Failed to render AI regulation node:", err);
        }
      });

      aiRegulationsEntitiesRef.current = newEntities;
      scheduleSceneRenders(viewer);
    };

    if (GLOBE_LAYER_CACHE.aiRegulations && regulationsUpdateTrigger === 0) {
      drawAiRegulations(GLOBE_LAYER_CACHE.aiRegulations);
    } else {
      fetch('/api/ai-regulations')
        .then(res => {
          if (!res.ok) throw new Error("AI Regulations data request failed");
          return res.json();
        })
        .then(data => {
          GLOBE_LAYER_CACHE.aiRegulations = data;
          drawAiRegulations(data);
        })
        .catch(err => {
          console.warn("Failed to load global AI regulations vector points:", err);
        });
    }

    return () => {
      clearAiRegulations();
    };
  }, [aiRegulationsEnabled, scriptsLoaded, mapError, viewerReady, regulationsUpdateTrigger, mapMode, mapStyle]);

  // F. Undersea Internet Fiber Optic Cables (TeleGeography Submarine Cable API)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeight = is3DActive ? 0 : 13000.0;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 1200000.0;
    const eyeOffsetCable = new Cesium.Cartesian3(0.0, 0.0, -2200.0);

    const clearCables = () => {
      if (cableEntitiesRef.current && cableEntitiesRef.current.length > 0) {
        cableEntitiesRef.current.forEach(entity => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.entities.remove(entity);
          }
        });
        cableEntitiesRef.current = [];
        try { if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender(); } catch {}
      }
    };

    if (!internetCablesEnabled) {
      clearCables();
      return;
    }

    const drawCables = (cablesGeo, landingGeo) => {
      if (!cablesGeo || !cablesGeo.features) return;

      clearCables();
      const newEntities = [];

      // 1. Draw Undersea Cable Lines (Delicate, Color-coded)
      cablesGeo.features.forEach(feature => {
        const { geometry, properties } = feature;
        if (!geometry || !geometry.coordinates) return;

        const colorHex = properties.color || '#ec4899';
        const color = Cesium.Color.fromCssColorString(colorHex);

        const renderLine = (coords) => {
          const degreesArray = [];
          coords.forEach(coord => {
            degreesArray.push(coord[0], coord[1]);
          });

          try {
            const entity = viewer.entities.add({
              name: properties.name,
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray(degreesArray),
                width: 1.3,
                material: color.withAlpha(0.62),
                clampToGround: true
              },
              properties: {
                isCable: true,
                title: properties.name
              }
            });
            newEntities.push(entity);
          } catch (err) {}
        };

        if (geometry.type === 'LineString') {
          renderLine(geometry.coordinates);
        } else if (geometry.type === 'MultiLineString') {
          geometry.coordinates.forEach(coords => renderLine(coords));
        }
      });

      // 2. Draw Landing Station Points (Delicate circles matching color coding)
      if (landingGeo && landingGeo.features) {
        landingGeo.features.forEach(feature => {
          const { geometry, properties } = feature;
          if (!geometry || !geometry.coordinates) return;

          try {
            const entity = viewer.entities.add({
              name: properties.name,
              position: Cesium.Cartesian3.fromDegrees(geometry.coordinates[0], geometry.coordinates[1], targetHeight),
              billboard: {
                image: createCircleCanvas('#a855f7', 5.5, '#ffffff', 1.0),
                scaleByDistance: new Cesium.NearFarScalar(1.2e6, 1.0, 1.4e7, 0.6),
                heightReference: targetHeightRef,
                disableDepthTestDistance: targetDisableDepthTest,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                eyeOffset: eyeOffsetCable
              },
              properties: {
                isLandingStation: true,
                title: properties.name
              }
            });
            newEntities.push(entity);
          } catch (err) {}
        });
      }

      cableEntitiesRef.current = newEntities;
      scheduleSceneRenders(viewer);
    };

    if (GLOBE_LAYER_CACHE.cables && GLOBE_LAYER_CACHE.landingStations) {
      drawCables(GLOBE_LAYER_CACHE.cables, GLOBE_LAYER_CACHE.landingStations);
    } else {
      Promise.all([
        fetch('/api/cables').then(res => {
          if (!res.ok) throw new Error("Cables proxy request failed");
          return res.json();
        }),
        fetch('/api/landing-stations').then(res => {
          if (!res.ok) throw new Error("Landing stations proxy request failed");
          return res.json();
        })
      ])
        .then(([cablesGeo, landingGeo]) => {
          GLOBE_LAYER_CACHE.cables = cablesGeo;
          GLOBE_LAYER_CACHE.landingStations = landingGeo;
          drawCables(cablesGeo, landingGeo);
        })
        .catch(err => {
          console.warn("Failed to dynamically draw global subsea cables or landing points:", err);
        });
    }

    return () => {
      clearCables();
    };
  }, [internetCablesEnabled, scriptsLoaded, mapError, viewerReady, mapMode, mapStyle]);

  // G. Power Grid & Minerals (OpenInfraMap Tiling Services)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const layers = viewer.imageryLayers;

    if (powerMineralsEnabled) {
      if (!powerLayerRef.current) {
        try {
          const provider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://tiles.openinframap.org/power/{z}/{x}/{y}.png',
            credit: 'OpenInfraMap Power'
          });
          const layer = new Cesium.ImageryLayer(provider);
          layers.add(layer);
          powerLayerRef.current = layer;
        } catch (err) {
          console.warn("Failed to load power grid tiles:", err);
        }
      }
    } else {
      if (powerLayerRef.current) {
        layers.remove(powerLayerRef.current);
        powerLayerRef.current = null;
      }
    }
  }, [powerMineralsEnabled, scriptsLoaded, mapError, viewerReady]);

  // H. Five AI Ethics & Society Layers (OONI/IODA Censorship, Env Justice, AI Supply Chain, Biometric Welfare, AI Labor)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const clearEthics = () => {
      if (ethicsEntitiesRef.current.length > 0 && !viewer.isDestroyed()) {
        try { viewer.entities.suspendEvents(); } catch {}
        try {
          ethicsEntitiesRef.current.forEach(e => {
            try { if (!viewer.isDestroyed()) viewer.entities.remove(e); } catch {}
          });
          ethicsEntitiesRef.current = [];
        } finally {
          try { if (!viewer.isDestroyed()) viewer.entities.resumeEvents(); } catch {}
          try { if (!viewer.isDestroyed()) viewer.scene.requestRender(); } catch {}
        }
      } else {
        ethicsEntitiesRef.current = [];
      }
    };

    const anyEnabled = censorshipEnabled || envJusticeEnabled || supplyChainEnabled || biometricWelfareEnabled || aiLaborEnabled;
    if (!anyEnabled) {
      clearEthics();
      return;
    }

    let cancelled = false;
    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeightRef = is3DActive
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const eyeOffsetEthics = new Cesium.Cartesian3(0.0, 0.0, -45.0);

    const fetchCached = async (key, url) => {
      if (GLOBE_LAYER_CACHE[key]) return GLOBE_LAYER_CACHE[key];
      const r = await fetch(url);
      if (!r.ok) return null;
      const d = await r.json();
      GLOBE_LAYER_CACHE[key] = d;
      return d;
    };

    const jobs = [];
    if (censorshipEnabled) jobs.push(fetchCached('censorship', '/api/censorship').then(d => ({ kind: 'censorship', data: d })));
    if (envJusticeEnabled) jobs.push(fetchCached('environmental', '/api/ethics-layers?layer=environmental').then(d => ({ kind: 'environmental', data: d })));
    if (supplyChainEnabled) jobs.push(fetchCached('supplyChain', '/api/ethics-layers?layer=supply_chain').then(d => ({ kind: 'supplyChain', data: d })));
    if (biometricWelfareEnabled) jobs.push(fetchCached('biometricWelfare', '/api/ethics-layers?layer=biometric_welfare').then(d => ({ kind: 'biometricWelfare', data: d })));
    if (aiLaborEnabled) jobs.push(fetchCached('aiLabor', '/api/ethics-layers?layer=ai_labor').then(d => ({ kind: 'aiLabor', data: d })));

    Promise.all(jobs).then(results => {
      if (cancelled || !viewerRef.current || viewer.isDestroyed()) return;
      clearEthics();
      const added = [];
      try { viewer.entities.suspendEvents(); } catch {}
      try {
        results.forEach(({ kind, data }) => {
          if (!data) return;
          (data.arcs || []).forEach((arc, aIdx) => {
            if (!Array.isArray(arc.from) || !Array.isArray(arc.to)) return;
            try {
              const ent = viewer.entities.add({
                id: `ethics-arc-${kind}-${aIdx}`,
                name: arc.name,
                polyline: {
                  positions: Cesium.Cartesian3.fromDegreesArray([arc.from[1], arc.from[0], arc.to[1], arc.to[0]]),
                  width: 1.7,
                  arcType: Cesium.ArcType.GEODESIC,
                  material: Cesium.Color.fromCssColorString(arc.color || '#38bdf8').withAlpha(0.75)
                },
                properties: {
                  isEthicsOverlay: true,
                  title: arc.name,
                  country: 'Global Supply Chain',
                  metricLabel: 'Corridor',
                  metricValue: 'Extractive / Semiconductor Flow',
                  source: 'USGS / ASML / CSET'
                }
              });
              added.push(ent);
            } catch {}
          });

          (data.items || []).forEach(item => {
            if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return;
            const color = item.color || '#a855f7';
            const metricLabel =
              kind === 'censorship' ? 'OONI Blocks'
                : kind === 'environmental' ? 'Water / Carbon'
                : kind === 'supplyChain' ? 'Mineral / Stage'
                : kind === 'biometricWelfare' ? 'Legal Status'
                : 'Hourly Wage';
            const metricValue =
              kind === 'censorship' ? `${(item.confirmedBlocks || 0).toLocaleString()} (${item.blockRatePct || 0}%)`
                : kind === 'environmental' ? `${item.waterStress} · ${item.carbonIntensity}g/kWh`
                : kind === 'supplyChain' ? `${item.stage?.toUpperCase()} · ${item.mineral}`
                : kind === 'biometricWelfare' ? (item.status || 'Active')
                : (item.typicalHourlyUsd || 'Verified');

            try {
              const ent = viewer.entities.add({
                id: `ethics-${kind}-${item.id}`,
                name: item.name,
                position: Cesium.Cartesian3.fromDegrees(item.lon, item.lat, is3DActive ? 0 : 14500.0),
                billboard: {
                  image: kind === 'supplyChain' || kind === 'environmental'
                    ? createDiamondCanvas(color, 11.5, '#0f172a', 1.4)
                    : createCircleCanvas(color, 10.5, '#0f172a', 1.4),
                  scaleByDistance: new Cesium.NearFarScalar(1.2e6, 1.05, 1.8e7, 0.76),
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  eyeOffset: new Cesium.Cartesian3(0.0, 0.0, -2200.0),
                  heightReference: targetHeightRef,
                  disableDepthTestDistance: is3DActive ? 0.0 : 1200000.0
                },
                properties: {
                  ...item,
                  isEthicsOverlay: true,
                  title: item.title || item.name,
                  location: item.country || 'Global',
                  metricLabel,
                  metricValue,
                  category: kind === 'environmental' ? 'Disaster' : kind === 'supplyChain' ? 'Economic' : kind === 'censorship' ? 'Surveillance' : 'Humanitarian',
                  severity: item.severity || 3
                }
              });
              added.push(ent);
            } catch {}
          });
        });

        ethicsEntitiesRef.current = added;
      } finally {
        try { if (!viewer.isDestroyed()) viewer.entities.resumeEvents(); } catch {}
        scheduleSceneRenders(viewer);
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      clearEthics();
    };
  }, [censorshipEnabled, envJusticeEnabled, supplyChainEnabled, biometricWelfareEnabled, aiLaborEnabled, scriptsLoaded, mapError, viewerReady, mapMode, mapStyle]);

  // I. Longitudinal Temporal Replay & Before/After Compute-Regulation Globe Layer
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const clearTemporal = () => {
      if (temporalEntitiesRef.current.length > 0 && !viewer.isDestroyed()) {
        try { viewer.entities.suspendEvents(); } catch {}
        try {
          temporalEntitiesRef.current.forEach(e => {
            try { if (!viewer.isDestroyed()) viewer.entities.remove(e); } catch {}
          });
          temporalEntitiesRef.current = [];
        } finally {
          try { if (!viewer.isDestroyed()) viewer.entities.resumeEvents(); } catch {}
          try { if (!viewer.isDestroyed()) viewer.scene.requestRender(); } catch {}
        }
      } else {
        temporalEntitiesRef.current = [];
      }
    };

    if (!temporalReplayActive || !Array.isArray(temporalMilestones)) {
      clearTemporal();
      return;
    }

    clearTemporal();
    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeightRef = is3DActive
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const added = [];
    try { viewer.entities.suspendEvents(); } catch {}
    try {
      temporalMilestones.forEach((m, idx) => {
        if (typeof m.lat !== 'number' || typeof m.lon !== 'number') return;
        const color = m.track === 'law' ? '#10b981' : m.track === 'institute' ? '#a855f7' : '#f59e0b';
        const dotSize = m.powerMw ? Math.min(16, 7 + Math.sqrt(m.powerMw) * 0.22) : 9.5;
        // Slight deterministic offset when two milestones sit on the same capital
        const a = (idx % 7) * 2.39996323;
        const r = idx % 7 === 0 ? 0 : 0.25;
        const pLat = m.lat + r * Math.cos(a);
        const pLon = m.lon + r * Math.sin(a);
        try {
          const ent = viewer.entities.add({
            id: `temporal-${m.id}`,
            name: m.title,
            position: Cesium.Cartesian3.fromDegrees(pLon, pLat, is3DActive ? 0 : 15000.0),
            billboard: {
              image: createCircleCanvas(color, dotSize + 2, m.isPostBaseline ? '#00f0ff' : '#ffffff', m.isPostBaseline ? 2.2 : 1.4),
              scaleByDistance: new Cesium.NearFarScalar(1.2e6, 1.1, 1.8e7, 0.78),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              eyeOffset: new Cesium.Cartesian3(0.0, 0.0, -2500.0),
              heightReference: targetHeightRef,
              disableDepthTestDistance: is3DActive ? 0.0 : 1200000.0
            },
            properties: {
              ...m,
              isTemporalMilestone: true,
              category: m.track === 'compute' ? 'Economic' : 'Political'
            }
          });
          added.push(ent);
        } catch {}
      });

      temporalEntitiesRef.current = added;
    } finally {
      try { if (!viewer.isDestroyed()) viewer.entities.resumeEvents(); } catch {}
      scheduleSceneRenders(viewer);
    }

    return () => clearTemporal();
  }, [temporalReplayActive, temporalMilestones, scriptsLoaded, mapError, viewerReady, mapMode, mapStyle, scheduleSceneRenders]);

  // Safe utility to parse any tooltip string content (e.g. collapsed cached single-line formats)
  // into a beautifully structured, premium tactical key-value dossier layout.
  const getStructuredTooltip = () => {
    if (hoverTooltip.details) {
      return {
        title: hoverTooltip.title,
        details: hoverTooltip.details,
        emoji: hoverTooltip.type === 'regulation' ? '⚖️' : 
               hoverTooltip.type === 'datacenter' ? '🏢' :
               hoverTooltip.type === 'gps' ? '📡' :
               hoverTooltip.type === 'cable' ? '⚓' :
               hoverTooltip.type === 'landing_station' ? '🔌' :
               hoverTooltip.type === 'energy' ? '🛢️' : 
               hoverTooltip.type === 'event' ? '⚠️' : '🌐'
      };
    }

    const content = hoverTooltip.content || '';
    let cleanStr = content.trim();
    let emoji = '🌐';
    if (cleanStr.startsWith('⚖️')) { emoji = '⚖️'; cleanStr = cleanStr.substring(2).trim(); }
    else if (cleanStr.startsWith('🏢')) { emoji = '🏢'; cleanStr = cleanStr.substring(2).trim(); }
    else if (cleanStr.startsWith('📡')) { emoji = '📡'; cleanStr = cleanStr.substring(2).trim(); }
    else if (cleanStr.startsWith('⚓')) { emoji = '⚓'; cleanStr = cleanStr.substring(2).trim(); }
    else if (cleanStr.startsWith('🔌')) { emoji = '🔌'; cleanStr = cleanStr.substring(2).trim(); }
    else if (cleanStr.startsWith('🏭')) { emoji = '🏭'; cleanStr = cleanStr.substring(2).trim(); }
    else if (cleanStr.startsWith('🛢️')) { emoji = '🛢️'; cleanStr = cleanStr.substring(2).trim(); }
    else if (cleanStr.startsWith('⚠️')) { emoji = '⚠️'; cleanStr = cleanStr.substring(2).trim(); }

    const lines = cleanStr.split(/[\n\r]+/);
    
    // If we have single line with combined items or no newlines, parse using regex split
    if (lines.length === 1 && cleanStr.match(/(Jurisdiction:|Status:|Focus Area:|Area:|Operator:|Location:|Severity:|Degradation:|Proposed\/Effective:|Type:|Name:)/i)) {
      const regex = /\s*(Jurisdiction:|Status:|Focus Area:|Area:|Operator:|Location:|Severity:|Degradation:|Proposed\/Effective:|Type:|Name:|Proposed\/Effective Date:)/gi;
      const parts = cleanStr.split(regex);
      const titleVal = parts[0] ? parts[0].trim() : '';
      const details = {};
      for (let i = 1; i < parts.length; i += 2) {
        if (parts[i] && parts[i + 1]) {
          const key = parts[i].replace(':', '').trim();
          details[key] = parts[i + 1].trim();
        }
      }
      return { title: titleVal, details, emoji };
    } else {
      // Multiple lines or plain text fallback
      const titleVal = lines[0] ? lines[0].trim() : '';
      const details = {};
      let hasDetails = false;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const key = line.substring(0, colonIdx).trim();
          const val = line.substring(colonIdx + 1).trim();
          details[key] = val;
          hasDetails = true;
        }
      }
      if (hasDetails) {
        return { title: titleVal, details, emoji };
      }
      // Simple string fallback formatted line-by-line
      return { title: titleVal, details: null, emoji };
    }
  };

  const parsed = getStructuredTooltip();

  // Dynamic bounded layout calculations for the hover tooltip to prevent off-screen spillover (especially on mobile)
  let tooltipLeft = hoverTooltip.x + 12;
  let tooltipTop = hoverTooltip.y - 12;
  let tooltipWidth = 280;

  if (typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    tooltipWidth = isMobile ? Math.min(280, viewportWidth - 32) : 280;

    // Shift tooltip to the left of the cursor if it spills past the right edge
    if (tooltipLeft + tooltipWidth > viewportWidth - 16) {
      tooltipLeft = hoverTooltip.x - tooltipWidth - 12;
    }
    // Keep it at least 8px away from the left edge of the screen
    if (tooltipLeft < 8) {
      tooltipLeft = 8;
    }

    // Shift tooltip upwards if it spills past the bottom edge
    const estHeight = 220; // safe estimation of maximum height for a threat event info card
    if (tooltipTop + estHeight > viewportHeight - 16) {
      tooltipTop = hoverTooltip.y - estHeight - 12;
    }
    // Keep it at least 8px away from the top edge of the screen
    if (tooltipTop < 8) {
      tooltipTop = 8;
    }
  }

  // 3D Globe is ALWAYS the active view when mapMode === '3d':
  //   - InteractiveCanvasGlobe3D renders instantaneously (<120ms, 60fps, zero WebGL required) as immediate boot globe AND permanent Eco 3D engine on older/software-WebGL hardware
  //   - Cesium HD WebGL Globe seamlessly crossfades in over it once root tiles upload on hardware-accelerated GPUs
  const is3DReadyToDisplay = shouldUseCesiumHd && viewerReady && globeSurfaceReady;
  const isCanvas3DActive = !is2DActive && !is3DReadyToDisplay;
  const isLightBackdrop = mapStyle === 'light' || uiTheme === 'light';
  const canTryHdWebgl = (gpuTier === 'software' || mapError) && gpuTier !== 'none';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: isLightBackdrop ? '#e2e8f0' : '#020617' }}>
      
      {/* Equal Earth 2D Map (Active ONLY when user explicitly chooses 2D mode — NEVER traps 3D users!) */}
      <EqualEarthMap2D
        active={is2DActive}
        layerCache={GLOBE_LAYER_CACHE}
        ensureCountriesGeoJson={ensureCountriesGeoJson}
        repelledMarkers={repelledMarkers}
        eventsEnabled={eventsEnabled}
        showSatellites={showSatellites}
        satellites={satellites}
        selectedSatellite={selectedSatellite}
        onSatelliteClick={(sat) => { if (onSatelliteClickRef.current) onSatelliteClickRef.current(sat); }}
        onPointClick={(pt) => { if (onPointClickRef.current) onPointClickRef.current(pt); }}
        onCountrySelect={(cName) => { if (onCountrySelectRef.current) onCountrySelectRef.current(cName); }}
        selectedCountry={selectedCountry}
        onHoverTooltip={setHoverTooltip}
        onInteraction={handleUserInteraction}
        resetKey={resetKey}
        focusCoordinate={focusCoordinate}
        uiTheme={uiTheme}
        mapStyle={mapStyle}
        dayNightEnabled={dayNightEnabled}
        weatherEnabled={weatherEnabled}
        oilGasEnabled={oilGasEnabled}
        internetCablesEnabled={internetCablesEnabled}
        gpsJammingEnabled={gpsJammingEnabled}
        dataCentersEnabled={dataCentersEnabled}
        aiRegulationsEnabled={aiRegulationsEnabled}
        censorshipEnabled={censorshipEnabled}
        envJusticeEnabled={envJusticeEnabled}
        supplyChainEnabled={supplyChainEnabled}
        biometricWelfareEnabled={biometricWelfareEnabled}
        aiLaborEnabled={aiLaborEnabled}
        temporalReplayActive={temporalReplayActive}
        temporalMilestones={temporalMilestones}
        regulationsUpdateTrigger={regulationsUpdateTrigger}
      />

      {/* Instant 60fps Zero-WebGL Interactive 3D Spherical Globe (immediate cold-boot globe + Eco 3D engine for older/software-WebGL hardware) */}
      <InteractiveCanvasGlobe3D
        active={isCanvas3DActive}
        layerCache={GLOBE_LAYER_CACHE}
        ensureCountriesGeoJson={ensureCountriesGeoJson}
        repelledMarkers={repelledMarkers}
        eventsEnabled={eventsEnabled}
        showSatellites={showSatellites}
        satellites={satellites}
        selectedSatellite={selectedSatellite}
        onSatelliteClick={(sat) => { if (onSatelliteClickRef.current) onSatelliteClickRef.current(sat); }}
        onPointClick={(pt) => { if (onPointClickRef.current) onPointClickRef.current(pt); }}
        onCountrySelect={(cName) => { if (onCountrySelectRef.current) onCountrySelectRef.current(cName); }}
        selectedCountry={selectedCountry}
        onHoverTooltip={setHoverTooltip}
        onInteraction={handleUserInteraction}
        autoRotate={autoRotate}
        resetKey={resetKey}
        focusCoordinate={focusCoordinate}
        uiTheme={uiTheme}
        mapStyle={mapStyle}
        dayNightEnabled={dayNightEnabled}
        weatherEnabled={weatherEnabled}
        oilGasEnabled={oilGasEnabled}
        internetCablesEnabled={internetCablesEnabled}
        gpsJammingEnabled={gpsJammingEnabled}
        dataCentersEnabled={dataCentersEnabled}
        aiRegulationsEnabled={aiRegulationsEnabled}
        censorshipEnabled={censorshipEnabled}
        envJusticeEnabled={envJusticeEnabled}
        supplyChainEnabled={supplyChainEnabled}
        biometricWelfareEnabled={biometricWelfareEnabled}
        aiLaborEnabled={aiLaborEnabled}
        temporalReplayActive={temporalReplayActive}
        temporalMilestones={temporalMilestones}
        regulationsUpdateTrigger={regulationsUpdateTrigger}
        isWarmingHd={shouldUseCesiumHd && !is3DReadyToDisplay}
        statusBadgeLabel={
          shouldUseCesiumHd && !is3DReadyToDisplay
            ? '3D GLOBE · LOADING HD TILES…'
            : gpuTier === 'none'
              ? '3D GLOBE · FAST ECO ENGINE'
              : '3D GLOBE · FAST ECO ENGINE'
        }
        onTryHdWebgl={canTryHdWebgl ? triggerTryHdWebgl : null}
      />

      {/* 3D Cesium HD WebGL Spherical Globe Container (crossfades smoothly in once root tiles paint) */}
      <div 
        ref={containerRef} 
        onMouseDown={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        onWheel={handleUserInteraction}
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          zIndex: is3DReadyToDisplay ? 3 : 1,
          opacity: is3DReadyToDisplay ? 1 : 0,
          pointerEvents: is3DReadyToDisplay ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }} 
      />

      {/* 2D Equal Earth Mode / 3D Globe Quick Switcher Badge */}
      {is2DActive && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          background: 'var(--sov-panel-bg)',
          border: '1px solid var(--sov-border)',
          borderRadius: '7px',
          padding: '6px 11px',
          fontSize: '9.5px',
          fontFamily: 'var(--font-jetbrains-fallback)',
          color: 'var(--sov-text)',
          boxShadow: 'var(--sov-shadow)',
          backdropFilter: 'blur(10px)',
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontWeight: 700, color: 'var(--sov-muted)' }}>
            🗺️ 2D EQUAL EARTH MAP
          </span>
          <button
            type="button"
            onClick={triggerSwitchTo3D}
            style={{
              background: 'var(--sov-accent-soft)',
              border: '1px solid var(--sov-accent)',
              borderRadius: '4px',
              color: 'var(--sov-accent)',
              padding: '3px 9px',
              fontSize: '9px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
            title="Switch to 3D Spherical Globe"
          >
            SWITCH TO 3D GLOBE
          </button>
        </div>
      )}

      {/* Visual Navigation controls HUD overlay (Cesium HD only) */}
      {is3DReadyToDisplay && (
        <>
          {/* Tactical Controls Legend Overlay (Bottom Left, theme-aware) */}
          {showLegend && !isMobile && (
            <div
              className="sov-popover-shell"
              style={{
                position: 'absolute',
                bottom: '48px',
                left: '20px',
                zIndex: 10,
                background: 'var(--sov-panel-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontFamily: 'var(--font-jetbrains-fallback)',
                fontSize: '10px',
                color: 'var(--sov-text)',
                boxShadow: 'var(--sov-shadow)',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: '800',
                color: 'var(--sov-accent)',
                marginBottom: '2px',
                borderBottom: '1px solid var(--sov-border)',
                paddingBottom: '4px',
                gap: '24px'
              }}>
                <span>📡 MAP NAVIGATION HUD</span>
                <span
                  onClick={() => setShowLegend(false)}
                  style={{ cursor: 'pointer', color: 'var(--sov-muted)', fontWeight: 'bold', fontSize: '13px', padding: '0 4px' }}
                  title="Close Controls HUD"
                >
                  ×
                </span>
              </div>
              <div style={{ pointerEvents: 'none' }}>🖱️ <span style={{ color: 'var(--sov-sky)', fontWeight: 700 }}>Drag:</span> Pan / Orbit</div>
              <div style={{ pointerEvents: 'none' }}>⌨️ <span style={{ color: 'var(--sov-sky)', fontWeight: 700 }}>Shift + Drag:</span> Rotate &amp; Tilt</div>
              <div style={{ pointerEvents: 'none' }}>🔄 <span style={{ color: 'var(--sov-sky)', fontWeight: 700 }}>Scroll:</span> Zoom <span style={{ color: 'var(--sov-muted)' }}>[Shift+Scroll to Tilt]</span></div>
            </div>
          )}
        </>
      )}

      {/* 3D Zoom Reminder overlay */}
      {is3DReadyToDisplay && mapStyle === 'buildings' && cameraAltitude >= 18000 && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(8, 12, 24, 0.9)',
          border: '1px solid #00f0ff',
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
          borderRadius: '6px',
          padding: '10px 18px',
          fontFamily: 'Courier New, monospace',
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#00f0ff',
          letterSpacing: '0.1em',
          pointerEvents: 'none',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          animation: 'hudPulse 2s infinite ease-in-out'
        }}>
          <style>{`
            @keyframes hudPulse {
              0%, 100% { opacity: 1; border-color: #00f0ff; box-shadow: 0 0 15px rgba(0, 240, 255, 0.4); }
              50% { opacity: 0.65; border-color: rgba(0, 240, 255, 0.4); box-shadow: 0 0 6px rgba(0, 240, 255, 0.1); }
            }
          `}</style>
          [3D URBAN MESH STANDBY // ZOOM CLOSE TO ENGAGE DETAILED RADAR SCANNING]
        </div>
      )}

      {/* 3D Loading Overlay */}
      {is3DReadyToDisplay && mapStyle === 'buildings' && !tilesetLoaded && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          background: 'rgba(2, 6, 23, 0.9)', zIndex: 10, color: '#38bdf8', fontFamily: 'monospace', gap: '12px'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', border: '4px solid rgba(56, 189, 248, 0.1)',
            borderTopColor: '#38bdf8', animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span>SYNCHRONIZING GOOGLE 3D TILES...</span>
        </div>
      )}

      {hoverTooltip.show && (
        <div
          className="cesium-hover-tooltip"
          style={{
            position: 'absolute',
            left: `${tooltipLeft}px`,
            top: `${tooltipTop}px`,
            background: 'var(--sov-panel-bg)',
            border: hoverTooltip.type === 'regulation'
              ? '1px solid rgba(168, 85, 247, 0.65)'
              : hoverTooltip.type === 'event'
              ? '1px solid rgba(251, 146, 60, 0.65)'
              : '1px solid var(--sov-border)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--sov-text)',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.5',
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: 'var(--sov-shadow)',
            backdropFilter: 'blur(8px)',
            maxWidth: `${tooltipWidth}px`,
            width: `${tooltipWidth}px`,
            wordBreak: 'break-word',
            whiteSpace: 'normal'
          }}
        >
          {parsed.details && Object.keys(parsed.details).length > 0 ? (
            <div>
              {/* Header */}
              <div style={{ 
                borderBottom: '1px solid var(--sov-border)',
                paddingBottom: '6px',
                marginBottom: '6.5px', 
                fontWeight: 'bold', 
                color: 'var(--sov-text)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>{parsed.emoji}</span>
                <span>{parsed.title}</span>
              </div>
              {/* Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {Object.entries(parsed.details).map(([label, val]) => {
                  const upperVal = val ? String(val).toUpperCase() : '';
                  return (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span style={{ color: 'var(--sov-muted)', fontWeight: '500' }}>{label}:</span>
                      <span style={{ 
                        color: upperVal === 'IN EFFECT' || upperVal === 'ACTIVE' || upperVal === 'TRUE' ? 'var(--sov-emerald)' : 
                               upperVal === 'PROPOSED' || upperVal === 'PENDING' ? 'var(--sov-amber)' :
                               upperVal === 'HIGH' || upperVal === 'CRITICAL' ? 'var(--sov-danger)' : 
                               /^S[1-5]$/.test(upperVal) ? (SEV_COLORS[parseInt(upperVal[1])] || '#ff2d55') :
                               'var(--sov-text)',
                        fontWeight: 'bold' 
                      }}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {hoverTooltip.content.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Individual nodes spaced cleanly without cluster Consolidation Popover */}

      {/* Nearby Landmark Target Detector Pop-up */}
      {nearbyLandmark && !selectedSkyscraper && (
        <div style={{
          position: 'absolute',
          bottom: '160px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(5, 11, 28, 0.9)',
          border: '1px solid #00f0ff',
          borderRadius: '8px',
          padding: '12px 18px',
          fontFamily: 'Courier New, monospace',
          color: '#ffffff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.3)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'auto',
          animation: 'pulseGlow 2s infinite ease-in-out, slideUpNearby 0.3s ease-out',
          textAlign: 'center',
          width: isMobile ? 'calc(100% - 32px)' : '320px'
        }}>
          <style>{`
            @keyframes slideUpNearby {
              from { transform: translate(-50%, 20px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
            @keyframes pulseGlow {
              0%, 100% { border-color: #00f0ff; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.3); }
              50% { border-color: rgba(0, 240, 255, 0.4); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 5px rgba(0, 240, 255, 0.1); }
            }
          `}</style>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🎯</span>
            <span style={{ fontSize: '10px', color: '#00f0ff', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              TACTICAL TARGET IDENTIFIED
            </span>
          </div>
          
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
            {nearbyLandmark.name}
          </div>
          
          <button
            onClick={() => {
              selectSkyscraper(nearbyLandmark);
              setNearbyLandmark(null);
            }}
            style={{
              marginTop: '4px',
              padding: '6px 12px',
              background: 'rgba(0, 240, 255, 0.2)',
              border: '1px solid #00f0ff',
              borderRadius: '4px',
              color: '#00f0ff',
              fontFamily: 'Courier New, monospace',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00f0ff';
              e.currentTarget.style.color = '#050b1c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)';
              e.currentTarget.style.color = '#00f0ff';
            }}
          >
            LOCK TARGET & ENGAGE ORBIT
          </button>
        </div>
      )}

      {/* 3D Skyscraper Selection React HUD Dossier */}
      {selectedSkyscraper && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: isMobile ? '12px' : '24px',
          width: isMobile ? 'calc(100% - 24px)' : '380px',
          zIndex: 1000,
          pointerEvents: 'none',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          {/* Inner Draggable Container */}
          <div 
            style={{
              width: '100%',
              background: 'rgba(5, 11, 28, 0.85)',
              border: '1px solid #00f0ff',
              borderRadius: '10px',
              padding: '16px',
              fontFamily: 'Courier New, monospace',
              color: '#ffffff',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 240, 255, 0.25)',
              backdropFilter: 'blur(16px)',
              transition: isDraggingTarget ? 'none' : 'transform 0.15s ease-out',
              pointerEvents: 'auto',
              transform: `translate(${targetPos.x}px, ${targetPos.y}px)`,
              cursor: isMobile ? 'default' : (isDraggingTarget ? 'grabbing' : 'grab')
            }}
            onMouseDown={(e) => {
              if (isMobile) return;
              const isButton = e.target.tagName.toLowerCase() === 'button' || e.target.closest('button');
              if (isButton) return;
              e.preventDefault(); // Stop native text selection / browser dragging
              setIsDraggingTarget(true);
              dragStartRef.current = {
                x: e.clientX - targetPos.x,
                y: e.clientY - targetPos.y
              };
            }}
            onTouchStart={(e) => {
              const isButton = e.target.tagName.toLowerCase() === 'button' || e.target.closest('button');
              if (isButton) return;
              const touch = e.touches[0];
              setIsDraggingTarget(true);
              dragStartRef.current = {
                x: touch.clientX - targetPos.x,
                y: touch.clientY - targetPos.y
              };
            }}
          >

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
            paddingBottom: '8px',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{ fontSize: '9px', color: '#00f0ff', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                🛰️ TARGET ACQUIRED
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px', color: '#ffffff', wordBreak: 'break-word' }}>
                {selectedSkyscraper.name}
              </div>
            </div>
            <button 
              onClick={clearSkyscraperSelection}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(0, 240, 255, 0.6)',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1,
                outline: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ff2d55'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0, 240, 255, 0.6)'}
            >
              ×
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 16px',
            fontSize: '10.5px',
            color: '#cbd5e1',
            marginBottom: '14px',
            lineHeight: 1.4
          }}>
            <div>
              <span style={{ color: '#00f0ff', opacity: 0.8 }}>LAT: </span>
              <span style={{ fontWeight: 'bold' }}>{selectedSkyscraper.lat.toFixed(6)}°N</span>
            </div>
            <div>
              <span style={{ color: '#00f0ff', opacity: 0.8 }}>LON: </span>
              <span style={{ fontWeight: 'bold' }}>{selectedSkyscraper.lon.toFixed(6)}°E</span>
            </div>
            <div>
              <span style={{ color: '#00f0ff', opacity: 0.8 }}>ALT: </span>
              <span style={{ fontWeight: 'bold' }}>{selectedSkyscraper.height.toFixed(0)}m</span>
            </div>
            <div>
              <span style={{ color: '#00f0ff', opacity: 0.8 }}>CITY: </span>
              <span style={{ fontWeight: 'bold', wordBreak: 'break-all' }}>{selectedSkyscraper.city.toUpperCase()}</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(2, 6, 23, 0.5)',
            border: '1px solid rgba(0, 240, 255, 0.15)',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '9.5px',
            color: '#94a3b8',
            lineHeight: '1.4',
            marginBottom: '16px',
            maxHeight: '75px',
            overflowY: 'auto'
          }}>
            {selectedSkyscraper.description}
          </div>

          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => {
                if (isOrbiting) {
                  setIsOrbiting(false);
                } else {
                  if (viewerRef.current) {
                    orbitAngleRef.current = viewerRef.current.camera.heading;
                  }
                  setIsOrbiting(true);
                }
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: isOrbiting ? 'rgba(255, 45, 85, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                border: isOrbiting ? '1px solid #ff2d55' : '1px solid #00f0ff',
                borderRadius: '6px',
                color: isOrbiting ? '#ff2d55' : '#00f0ff',
                fontFamily: 'Courier New, monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxShadow: isOrbiting 
                  ? '0 0 10px rgba(255, 45, 85, 0.25)' 
                  : '0 0 10px rgba(0, 240, 255, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isOrbiting ? '#ff2d55' : '#00f0ff';
                e.currentTarget.style.color = '#020617';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isOrbiting ? 'rgba(255, 45, 85, 0.15)' : 'rgba(0, 240, 255, 0.15)';
                e.currentTarget.style.color = isOrbiting ? '#ff2d55' : '#00f0ff';
              }}
            >
              <span>{isOrbiting ? '⏹️ STOP ORBIT' : '🔄 ORBIT CAMERA'}</span>
            </button>
          </div>
        </div>
      </div>
      )}

      <style>{`
        .cesium-viewer-bottom {
          display: none !important;
        }
        .leaflet-tooltip-dark {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(56, 189, 248, 0.3) !important;
          color: #f8fafc !important;
          border-radius: 4px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
          white-space: normal !important;
          word-break: break-word !important;
        }
        .leaflet-tooltip-dark:before {
          border-top-color: rgba(15, 23, 42, 0.95) !important;
        }
        /* Override Leaflet's default white-space:nowrap and constrain tooltip wrapper width */
        .leaflet-tooltip.leaflet-tooltip-custom,
        .leaflet-tooltip-custom {
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          width: auto !important;
          max-width: none !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip.leaflet-tooltip-custom::before {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
