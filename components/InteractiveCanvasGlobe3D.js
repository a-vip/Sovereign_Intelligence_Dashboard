'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const SEV_COLORS = {
  1: '#38bdf8',
  2: '#22c55e',
  3: '#facc15',
  4: '#ff6b35',
  5: '#ff2d55'
};

const MISSION_COLORS = {
  station: '#00f0ff',
  earth_obs: '#10b981',
  navigation: '#f59e0b',
  comms: '#38bdf8',
  weather_geo: '#a855f7',
  science: '#ec4899'
};

const REG_COLORS = {
  'In effect': '#10b981',
  Passed: '#0ea5e9',
  Proposed: '#f59e0b',
  Policy: '#8b5cf6'
};

// Deterministic background stars for dark 3D space backdrop
const SPACE_STARS = (() => {
  const arr = [];
  let s = 4219;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 190; i++) {
    arr.push({
      x: rand(),
      y: rand(),
      r: 0.5 + rand() * 1.15,
      a: 0.16 + rand() * 0.56
    });
  }
  return arr;
})();

function lonLatToUnit(lonDeg, latDeg) {
  const phi = latDeg * DEG2RAD;
  const lam = lonDeg * DEG2RAD;
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.sin(lam), Math.sin(phi), cosPhi * Math.cos(lam)];
}

// Precomputed 3D unit-vector country geometry cache (zero trig per vertex during render!)
let PREPARED_SPHERE_COUNTRIES = null;

function prepareSphereCountries(geoJson) {
  if (PREPARED_SPHERE_COUNTRIES) return PREPARED_SPHERE_COUNTRIES;
  if (!geoJson?.features) return [];

  const prepared = geoJson.features.map((feature) => {
    const name = feature.properties?.name || 'Unknown';
    const rawPolys =
      feature.geometry?.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry?.type === 'MultiPolygon'
          ? feature.geometry.coordinates
          : [];

    const rings = [];
    let bestRingArea = -1;
    let labelLon = 0;
    let labelLat = 0;
    let totalArea = 0;
    let minLat = 90;
    let maxLat = -90;
    let minLon = 180;
    let maxLon = -180;

    for (const poly of rawPolys) {
      const exterior = poly[0];
      if (!Array.isArray(exterior) || exterior.length < 3) continue;

      let sumLon = 0;
      let sumLat = 0;
      let rMinLon = 180;
      let rMaxLon = -180;
      let rMinLat = 90;
      let rMaxLat = -90;
      let cx = 0;
      let cy = 0;
      let cz = 0;

      // Subsample very dense rings slightly only if huge (>220 verts) to guarantee <2ms 60fps on old CPUs
      const stride = exterior.length > 260 ? 2 : 1;
      const pts = [];
      for (let i = 0; i < exterior.length; i += stride) {
        const lon = exterior[i][0];
        const lat = exterior[i][1];
        const u = lonLatToUnit(lon, lat);
        pts.push(u);
        cx += u[0];
        cy += u[1];
        cz += u[2];
        sumLon += lon;
        sumLat += lat;
        if (lon < rMinLon) rMinLon = lon;
        if (lon > rMaxLon) rMaxLon = lon;
        if (lat < rMinLat) rMinLat = lat;
        if (lat > rMaxLat) rMaxLat = lat;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      }

      if (pts.length < 3) continue;
      const n = pts.length;
      const cLen = Math.hypot(cx, cy, cz) || 1;
      const center = [cx / cLen, cy / cLen, cz / cLen];
      // Bounding cosine dot product for fast hemisphere culling
      let minDot = 1;
      for (let i = 0; i < n; i++) {
        const d = pts[i][0] * center[0] + pts[i][1] * center[1] + pts[i][2] * center[2];
        if (d < minDot) minDot = d;
      }
      const sinRadius = Math.sqrt(Math.max(0, 1 - minDot * minDot));

      const approxArea =
        Math.max(0.01, Math.min(360, rMaxLon - rMinLon)) *
        Math.max(0.01, rMaxLat - rMinLat) *
        Math.max(0.15, Math.cos(((sumLat / n) * Math.PI) / 180));
      totalArea += approxArea;

      if (approxArea > bestRingArea) {
        bestRingArea = approxArea;
        labelLon = sumLon / n;
        labelLat = sumLat / n;
      }
      rings.push({ pts, center, sinRadius });
    }

    return {
      feature,
      name,
      nameUpper:
        name === 'United States of America'
          ? 'UNITED STATES'
          : name === 'United Republic of Tanzania'
            ? 'TANZANIA'
            : name === 'Democratic Republic of the Congo'
              ? 'DR CONGO'
              : name.toUpperCase(),
      rings,
      totalArea,
      labelVec: lonLatToUnit(labelLon, labelLat),
      bbox: { minLat, maxLat, minLon, maxLon }
    };
  });

  prepared.sort((a, b) => b.totalArea - a.totalArea);
  PREPARED_SPHERE_COUNTRIES = prepared;
  return prepared;
}

function pointInRingLonLat(lat, lon, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInFeature(lat, lon, item) {
  const { bbox, feature } = item;
  if (lat < bbox.minLat - 0.5 || lat > bbox.maxLat + 0.5) return false;
  const geom = feature.geometry;
  if (!geom) return false;
  if (geom.type === 'Polygon') return pointInRingLonLat(lat, lon, geom.coordinates[0]);
  if (geom.type === 'MultiPolygon') {
    for (let k = 0; k < geom.coordinates.length; k++) {
      if (pointInRingLonLat(lat, lon, geom.coordinates[k][0])) return true;
    }
  }
  return false;
}

const VECTOR_THEMES = {
  obsidian: {
    label: 'OBSIDIAN',
    isLight: false,
    spaceBg: '#020612',
    spaceGlow: 'rgba(56, 189, 248, 0.18)',
    oceanCenter: '#1f364d',
    oceanMid: '#122234',
    oceanEdge: '#081220',
    atmoHalo: 'rgba(148, 197, 235, 0.42)',
    rimStroke: 'rgba(186, 230, 253, 0.65)',
    graticule: 'rgba(148, 163, 184, 0.085)',
    equator: 'rgba(56, 189, 248, 0.24)',
    landFill: '#1b2636',
    landHover: '#283b54',
    landStroke: 'rgba(148, 163, 184, 0.40)',
    selectedFill: 'rgba(0, 240, 255, 0.22)',
    selectedStroke: '#00f0ff',
    labelColor: 'rgba(226, 232, 240, 0.74)',
    labelHalo: 'rgba(2, 6, 23, 0.92)',
    nodeStroke: '#ffffff',
    accent: '#00f0ff'
  },
  editorial: {
    label: 'EDITORIAL',
    isLight: true,
    spaceBg: '#e2e8f0',
    spaceGlow: 'rgba(14, 165, 233, 0.16)',
    oceanCenter: '#dbeafe',
    oceanMid: '#bfdbfe',
    oceanEdge: '#93c5fd',
    atmoHalo: 'rgba(14, 165, 233, 0.34)',
    rimStroke: 'rgba(2, 132, 199, 0.58)',
    graticule: 'rgba(51, 65, 85, 0.11)',
    equator: 'rgba(2, 132, 199, 0.26)',
    landFill: '#f8fafc',
    landHover: '#e0f2fe',
    landStroke: '#94a3b8',
    selectedFill: 'rgba(2, 132, 199, 0.22)',
    selectedStroke: '#0284c7',
    labelColor: 'rgba(15, 23, 42, 0.78)',
    labelHalo: 'rgba(255, 255, 255, 0.90)',
    nodeStroke: '#0f172a',
    accent: '#0284c7'
  },
  blueprint: {
    label: 'BLUEPRINT',
    isLight: false,
    spaceBg: '#040b1c',
    spaceGlow: 'rgba(56, 189, 248, 0.24)',
    oceanCenter: '#0d2b57',
    oceanMid: '#081d40',
    oceanEdge: '#041029',
    atmoHalo: 'rgba(56, 189, 248, 0.48)',
    rimStroke: 'rgba(125, 211, 252, 0.78)',
    graticule: 'rgba(125, 211, 252, 0.16)',
    equator: 'rgba(56, 189, 248, 0.40)',
    landFill: '#103466',
    landHover: '#19498c',
    landStroke: 'rgba(125, 211, 252, 0.62)',
    selectedFill: 'rgba(56, 189, 248, 0.28)',
    selectedStroke: '#38bdf8',
    labelColor: 'rgba(224, 242, 254, 0.86)',
    labelHalo: 'rgba(4, 16, 41, 0.92)',
    nodeStroke: '#ffffff',
    accent: '#38bdf8'
  },
  thermal: {
    label: 'THERMAL',
    isLight: false,
    spaceBg: '#0b0406',
    spaceGlow: 'rgba(249, 115, 22, 0.20)',
    oceanCenter: '#261015',
    oceanMid: '#18090d',
    oceanEdge: '#0b0406',
    atmoHalo: 'rgba(249, 115, 22, 0.42)',
    rimStroke: 'rgba(251, 146, 60, 0.68)',
    graticule: 'rgba(251, 146, 60, 0.11)',
    equator: 'rgba(239, 68, 68, 0.30)',
    landFill: '#2f161b',
    landHover: '#472128',
    landStroke: 'rgba(251, 146, 60, 0.46)',
    selectedFill: 'rgba(249, 115, 22, 0.28)',
    selectedStroke: '#fb923c',
    labelColor: 'rgba(255, 237, 213, 0.80)',
    labelHalo: 'rgba(11, 4, 6, 0.94)',
    nodeStroke: '#ffffff',
    accent: '#f97316'
  },
  emerald: {
    label: 'EMERALD',
    isLight: false,
    spaceBg: '#020a08',
    spaceGlow: 'rgba(16, 185, 129, 0.18)',
    oceanCenter: '#0d2c24',
    oceanMid: '#071d17',
    oceanEdge: '#03110d',
    atmoHalo: 'rgba(16, 185, 129, 0.40)',
    rimStroke: 'rgba(52, 211, 153, 0.64)',
    graticule: 'rgba(52, 211, 153, 0.10)',
    equator: 'rgba(52, 211, 153, 0.28)',
    landFill: '#12362c',
    landHover: '#1a4d3f',
    landStroke: 'rgba(52, 211, 153, 0.44)',
    selectedFill: 'rgba(16, 185, 129, 0.26)',
    selectedStroke: '#34d399',
    labelColor: 'rgba(209, 250, 229, 0.78)',
    labelHalo: 'rgba(2, 10, 8, 0.92)',
    nodeStroke: '#ffffff',
    accent: '#34d399'
  },
  solaris: {
    label: 'SOLARIS',
    isLight: false,
    spaceBg: '#070612',
    spaceGlow: 'rgba(234, 179, 8, 0.18)',
    oceanCenter: '#1b1833',
    oceanMid: '#110f24',
    oceanEdge: '#070612',
    atmoHalo: 'rgba(250, 204, 21, 0.38)',
    rimStroke: 'rgba(253, 224, 71, 0.62)',
    graticule: 'rgba(250, 204, 21, 0.09)',
    equator: 'rgba(250, 204, 21, 0.28)',
    landFill: '#24203d',
    landHover: '#342e57',
    landStroke: 'rgba(250, 204, 21, 0.44)',
    selectedFill: 'rgba(250, 204, 21, 0.24)',
    selectedStroke: '#facc15',
    labelColor: 'rgba(254, 249, 195, 0.80)',
    labelHalo: 'rgba(7, 6, 18, 0.94)',
    nodeStroke: '#ffffff',
    accent: '#facc15'
  }
};

// Major urban lights illuminated strictly on the night hemisphere when Day/Night terminator is ON
const NIGHT_CITY_HUBS = [
  [-74.0, 40.7], [-118.2, 34.0], [-87.6, 41.9], [-122.4, 37.8], [-99.1, 19.4], [-46.6, -23.5],
  [-58.4, -34.6], [-0.1, 51.5], [2.35, 48.85], [13.4, 52.5], [-3.7, 40.4], [12.5, 41.9],
  [28.9, 41.0], [37.6, 55.7], [31.2, 30.0], [3.4, 6.5], [28.0, -26.2], [55.3, 25.2],
  [72.8, 19.1], [77.2, 28.6], [103.8, 1.35], [100.5, 13.7], [116.4, 39.9], [121.5, 31.2],
  [114.2, 22.3], [127.0, 37.5], [139.7, 35.7], [151.2, -33.9]
].map(([lon, lat]) => ({ lon, lat, u: lonLatToUnit(lon, lat) }));

// Fast local Keplerian live-position interpolation matching /api/satellite so satellites glide smoothly at 24fps
function getLiveSatelliteCoords(sat, nowMs) {
  const baseLon = Number(sat?.longitude);
  const baseLat = Number(sat?.latitude);
  const inc = Number(sat?.inclination);
  const period = Number(sat?.period);
  const raan = Number(sat?.raan);
  const phase = Number(sat?.phaseOffset);
  if (Number.isFinite(inc) && Number.isFinite(period) && period > 10 && Number.isFinite(raan) && Number.isFinite(phase)) {
    const nowMin = nowMs / 60000;
    const incRad = inc * DEG2RAD;
    const theta = (2 * Math.PI * nowMin) / period + phase;
    const lat = Math.asin(Math.max(-1, Math.min(1, Math.sin(incRad) * Math.sin(theta)))) * RAD2DEG;
    const lonOrb = Math.atan2(Math.cos(incRad) * Math.sin(theta), Math.cos(theta)) * RAD2DEG;
    let lon = lonOrb + raan - ((nowMin * 0.25) % 360);
    lon = ((lon + 540) % 360) - 180;
    return { lon, lat, theta };
  }
  return { lon: Number.isFinite(baseLon) ? baseLon : 0, lat: Number.isFinite(baseLat) ? baseLat : 0, theta: null };
}

// Convert Web-Mercator tile pixel (z=2: 1024x1024 mosaic) to spherical [lon, lat]
function mercatorPxToLonLat(px, py, size) {
  const lon = (px / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * py) / size;
  const lat = RAD2DEG * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lon, lat];
}

function getGlobePalette(uiTheme, mapStyle, isVectorMode, vectorTheme) {
  if (isVectorMode || mapStyle === 'vector') {
    return VECTOR_THEMES[vectorTheme] || VECTOR_THEMES.obsidian;
  }
  const isLight =
    mapStyle === 'light' ||
    (uiTheme === 'light' &&
      mapStyle !== 'tactical' &&
      mapStyle !== 'minimal' &&
      mapStyle !== 'lights' &&
      mapStyle !== 'satellite');

  if (isLight) {
    return {
      isLight: true,
      spaceBg: '#e2e8f0',
      spaceGlow: 'rgba(56, 189, 248, 0.16)',
      oceanCenter: '#dbeafe',
      oceanMid: '#bfdbfe',
      oceanEdge: '#93c5fd',
      atmoHalo: 'rgba(14, 165, 233, 0.34)',
      rimStroke: 'rgba(2, 132, 199, 0.55)',
      graticule: 'rgba(51, 65, 85, 0.11)',
      equator: 'rgba(2, 132, 199, 0.25)',
      landFill: '#f8fafc',
      landHover: '#e0f2fe',
      landStroke: '#cbd5e1',
      selectedFill: 'rgba(2, 132, 199, 0.20)',
      selectedStroke: '#0284c7',
      labelColor: 'rgba(30, 41, 59, 0.74)',
      labelHalo: 'rgba(255, 255, 255, 0.88)',
      nodeStroke: '#0f172a',
      accent: '#0284c7'
    };
  }
  if (mapStyle === 'lights') {
    return {
      isLight: false,
      spaceBg: '#02040a',
      spaceGlow: 'rgba(245, 158, 11, 0.12)',
      oceanCenter: '#081326',
      oceanMid: '#050c1b',
      oceanEdge: '#020611',
      atmoHalo: 'rgba(245, 158, 11, 0.28)',
      rimStroke: 'rgba(245, 158, 11, 0.45)',
      graticule: 'rgba(148, 163, 184, 0.08)',
      equator: 'rgba(245, 158, 11, 0.22)',
      landFill: '#0e1628',
      landHover: '#1a2744',
      landStroke: 'rgba(245, 158, 11, 0.30)',
      selectedFill: 'rgba(0, 240, 255, 0.22)',
      selectedStroke: '#00f0ff',
      labelColor: 'rgba(226, 232, 240, 0.68)',
      labelHalo: 'rgba(2, 6, 23, 0.92)',
      nodeStroke: '#ffffff',
      accent: '#00f0ff'
    };
  }
  if (uiTheme === 'emerald') {
    return {
      isLight: false,
      spaceBg: '#020908',
      spaceGlow: 'rgba(16, 185, 129, 0.14)',
      oceanCenter: '#0a251f',
      oceanMid: '#061a15',
      oceanEdge: '#03100d',
      atmoHalo: 'rgba(16, 185, 129, 0.34)',
      rimStroke: 'rgba(52, 211, 153, 0.52)',
      graticule: 'rgba(52, 211, 153, 0.09)',
      equator: 'rgba(52, 211, 153, 0.24)',
      landFill: '#113028',
      landHover: '#19453a',
      landStroke: 'rgba(52, 211, 153, 0.32)',
      selectedFill: 'rgba(16, 185, 129, 0.25)',
      selectedStroke: '#34d399',
      labelColor: 'rgba(209, 250, 229, 0.66)',
      labelHalo: 'rgba(2, 10, 8, 0.92)',
      nodeStroke: '#ffffff',
      accent: '#34d399'
    };
  }
  if (mapStyle === 'satellite') {
    return {
      isLight: false,
      spaceBg: '#020612',
      spaceGlow: 'rgba(56, 189, 248, 0.18)',
      oceanCenter: '#13355c',
      oceanMid: '#0b2240',
      oceanEdge: '#051226',
      atmoHalo: 'rgba(56, 189, 248, 0.42)',
      rimStroke: 'rgba(125, 211, 252, 0.62)',
      graticule: 'rgba(148, 163, 184, 0.08)',
      equator: 'rgba(56, 189, 248, 0.22)',
      landFill: '#1c3b34',
      landHover: '#265047',
      landStroke: 'rgba(148, 163, 184, 0.34)',
      selectedFill: 'rgba(0, 240, 255, 0.22)',
      selectedStroke: '#00f0ff',
      labelColor: 'rgba(241, 245, 249, 0.78)',
      labelHalo: 'rgba(2, 6, 23, 0.92)',
      nodeStroke: '#ffffff',
      accent: '#00f0ff'
    };
  }
  // Tactical Dark / Cambridge / Minimal / Obsidian
  return {
    isLight: false,
    spaceBg: '#020612',
    spaceGlow: 'rgba(56, 189, 248, 0.16)',
    oceanCenter: '#1f364d',
    oceanMid: '#122234',
    oceanEdge: '#081220',
    atmoHalo: 'rgba(148, 197, 235, 0.38)',
    rimStroke: 'rgba(186, 230, 253, 0.56)',
    graticule: 'rgba(148, 163, 184, 0.08)',
    equator: 'rgba(56, 189, 248, 0.20)',
    landFill: mapStyle === 'minimal' ? '#121b2b' : '#1b2636',
    landHover: '#26364d',
    landStroke: mapStyle === 'minimal' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.34)',
    selectedFill: 'rgba(0, 240, 255, 0.22)',
    selectedStroke: '#00f0ff',
    labelColor: mapStyle === 'minimal' ? 'rgba(148, 163, 184, 0.42)' : 'rgba(226, 232, 240, 0.68)',
    labelHalo: 'rgba(2, 6, 23, 0.92)',
    nodeStroke: '#ffffff',
    accent: '#00f0ff'
  };
}

export default function InteractiveCanvasGlobe3D({
  active = false,
  layerCache = {},
  ensureCountriesGeoJson,
  repelledMarkers = [],
  eventsEnabled = true,
  showSatellites = false,
  satellites = [],
  selectedSatellite = null,
  isTracked = false,
  onSatelliteClick = null,
  onPointClick = null,
  onCountrySelect = null,
  selectedCountry = null,
  onHoverTooltip = null,
  onInteraction = null,
  autoRotate = false,
  resetKey = 0,
  focusCoordinate = null,
  uiTheme = 'obsidian',
  mapStyle = 'tactical',
  isVectorMode = false,
  vectorTheme = 'obsidian',
  dayNightEnabled = false,
  weatherEnabled = false,
  oilGasEnabled = false,
  internetCablesEnabled = false,
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
  regulationsUpdateTrigger = 0,
  statusBadgeLabel = null,
  onTryHdWebgl = null,
  isWarmingHd = false
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  // Default view: centered on Europe/Africa/Americas/Asia corridor (matching Cesium initial camera 12E, 20N)
  const viewRef = useRef({ lon: 14.0, lat: 20.0, zoom: 1.0, velLon: 0, velLat: 0 });
  const drawReqRef = useRef(null);
  const animFrameRef = useRef(null);
  const spinFrameRef = useRef(null);
  const focusRingRef = useRef(null);
  const hoveredCountryRef = useRef(null);
  const interactivePointsRef = useRef([]);
  const activeRef = useRef(active);
  activeRef.current = active;
  const isDraggingRef = useRef(false);
  const renderCanvasRef = useRef(null);
  const tooltipActiveRef = useRef(false);
  const callbacksRef = useRef({
    onSatelliteClick,
    onPointClick,
    onCountrySelect,
    onHoverTooltip,
    onInteraction
  });
  callbacksRef.current = {
    onSatelliteClick,
    onPointClick,
    onCountrySelect,
    onHoverTooltip,
    onInteraction
  };

  const [countriesReady, setCountriesReady] = useState(0);
  const [overlayTick, setOverlayTick] = useState(0);
  const [storms, setStorms] = useState([]);
  const [radarCells, setRadarCells] = useState([]);
  const [radarTimeLabel, setRadarTimeLabel] = useState('');
  const [zoomLabel, setZoomLabel] = useState('1.0x');
  const [isCompact, setIsCompact] = useState(false);
  const satLoopRef = useRef(null);
  const lastSelectedSatCodeRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncViewport = () => setIsCompact(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport, { passive: true });
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const syncZoomLabel = useCallback((z) => {
    const formatted = `${Number(z).toFixed(1)}x`;
    setZoomLabel((prev) => (prev === formatted ? prev : formatted));
  }, []);

  const requestDraw = useCallback(() => {
    if (!activeRef.current || drawReqRef.current != null) return;
    drawReqRef.current = requestAnimationFrame(() => {
      drawReqRef.current = null;
      if (activeRef.current && typeof renderCanvasRef.current === 'function') {
        renderCanvasRef.current();
      }
    });
  }, []);

  useEffect(() => {
    if (active) {
      requestDraw();
    } else {
      if (drawReqRef.current != null) {
        cancelAnimationFrame(drawReqRef.current);
        drawReqRef.current = null;
      }
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (spinFrameRef.current != null) {
        cancelAnimationFrame(spinFrameRef.current);
        spinFrameRef.current = null;
      }
    }
  }, [active, requestDraw]);

  // Load countries GeoJSON once (fast local static file, <100ms)
  useEffect(() => {
    if (!active) return;
    let alive = true;
    (async () => {
      let geo = layerCache.countries;
      if (!geo && ensureCountriesGeoJson) {
        geo = await ensureCountriesGeoJson();
      }
      if (!geo) {
        try {
          const r = await fetch('/data/countries.geo.json');
          if (r.ok) {
            geo = await r.json();
            layerCache.countries = geo;
          }
        } catch {}
      }
      if (alive && geo) {
        prepareSphereCountries(geo);
        setCountriesReady((v) => v + 1);
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, ensureCountriesGeoJson, layerCache]);

  // Lazy-fetch enabled overlay datasets into shared layerCache
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const fetchLayer = async (key, url, force = false) => {
      if (!force && layerCache[key]) {
        if (!cancelled) setOverlayTick((t) => t + 1);
        return;
      }
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        layerCache[key] = json;
        if (!cancelled) setOverlayTick((t) => t + 1);
      } catch {}
    };

    if (internetCablesEnabled) {
      fetchLayer('cables', '/api/cables');
      fetchLayer('landingStations', '/api/landing-stations');
    }
    if (oilGasEnabled) fetchLayer('oilGas', '/api/oil-gas');
    if (gpsJammingEnabled) fetchLayer('gpsJamming', '/api/gps-jamming');
    if (dataCentersEnabled) fetchLayer('dataCenters', '/api/datacenters');
    if (aiRegulationsEnabled) fetchLayer('aiRegulations', '/api/ai-regulations', regulationsUpdateTrigger > 0);
    if (censorshipEnabled) fetchLayer('censorship', '/api/censorship');
    if (envJusticeEnabled) fetchLayer('environmental', '/api/ethics-layers?layer=environmental');
    if (supplyChainEnabled) fetchLayer('supplyChain', '/api/ethics-layers?layer=supply_chain');
    if (biometricWelfareEnabled) fetchLayer('biometricWelfare', '/api/ethics-layers?layer=biometric_welfare');
    if (aiLaborEnabled) fetchLayer('aiLabor', '/api/ethics-layers?layer=ai_labor');

    if (weatherEnabled) {
      // 1) NASA EONET v3 active global hazards (Severe Storms, Wildfires, Volcanoes)
      fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=45&category=severeStorms,wildfires,volcanoes')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && Array.isArray(d?.events)) setStorms(d.events);
        })
        .catch(() => {});

      // 2) RainViewer Live Global Precipitation Radar Mosaic (z=2, 4x4 tiles -> spherical radar cells for 60fps 3D projection)
      if (layerCache.radarCells && Date.now() - (layerCache.radarFetchedAt || 0) < 300000) {
        setRadarCells(layerCache.radarCells);
        setRadarTimeLabel(layerCache.radarTimeLabel || 'LIVE');
      } else {
        fetch('https://api.rainviewer.com/public/weather-maps.json')
          .then((r) => (r.ok ? r.json() : null))
          .then(async (meta) => {
            if (cancelled || !meta?.host || !Array.isArray(meta?.radar?.past) || !meta.radar.past.length) return;
            const latest = meta.radar.past[meta.radar.past.length - 1];
            const host = meta.host;
            const tilePath = latest.path;
            const timeStr = latest.time
              ? new Date(latest.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + 'Z'
              : 'LIVE';
            const z = 2;
            const grid = 4; // 2^2 = 4x4 tiles
            const tileSz = 128;
            const mosaic = document.createElement('canvas');
            mosaic.width = grid * tileSz;
            mosaic.height = grid * tileSz;
            const mctx = mosaic.getContext('2d', { willReadFrequently: true });
            if (!mctx) return;

            const loadTile = (tx, ty) =>
              new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  try { mctx.drawImage(img, tx * tileSz, ty * tileSz, tileSz, tileSz); } catch {}
                  resolve();
                };
                img.onerror = () => resolve();
                // Color scheme 6 (NEXRAD/Tactical radar palette), smooth=1, snow=1
                img.src = `${host}${tilePath}/256/${z}/${tx}/${ty}/6/1_1.png`;
              });

            const jobs = [];
            for (let ty = 0; ty < grid; ty++) {
              for (let tx = 0; tx < grid; tx++) {
                jobs.push(loadTile(tx, ty));
              }
            }
            await Promise.all(jobs);
            if (cancelled) return;

            try {
              const imgData = mctx.getImageData(0, 0, mosaic.width, mosaic.height).data;
              const cells = [];
              const stride = 4;
              for (let py = 2; py < mosaic.height - 2; py += stride) {
                for (let px = 0; px < mosaic.width; px += stride) {
                  const idx = (py * mosaic.width + px) * 4;
                  const a = imgData[idx + 3];
                  if (a < 28) continue;
                  const r = imgData[idx];
                  const g = imgData[idx + 1];
                  const b = imgData[idx + 2];
                  const [lon, lat] = mercatorPxToLonLat(px + 1.5, py + 1.5, mosaic.width);
                  if (Math.abs(lat) > 78) continue;
                  cells.push({
                    u: lonLatToUnit(lon, lat),
                    color: `rgba(${r},${g},${b},${Math.min(0.72, (a / 255) * 0.78).toFixed(2)})`,
                    intensity: Math.min(1, a / 255)
                  });
                }
              }
              layerCache.radarCells = cells;
              layerCache.radarFetchedAt = Date.now();
              layerCache.radarTimeLabel = timeStr;
              if (!cancelled) {
                setRadarCells(cells);
                setRadarTimeLabel(timeStr);
              }
            } catch {}
          })
          .catch(() => {});
      }
    } else {
      setStorms([]);
    }
    return () => {
      cancelled = true;
    };
  }, [
    active,
    internetCablesEnabled,
    oilGasEnabled,
    gpsJammingEnabled,
    dataCentersEnabled,
    aiRegulationsEnabled,
    censorshipEnabled,
    envJusticeEnabled,
    supplyChainEnabled,
    biometricWelfareEnabled,
    aiLaborEnabled,
    weatherEnabled,
    regulationsUpdateTrigger,
    layerCache
  ]);

  const focusPulseRef = useRef(null);

  const animateTo = useCallback((targetLon, targetLat, targetZoom, durationMs = 540) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const startLon = viewRef.current.lon;
    const startLat = viewRef.current.lat;
    const startZoom = viewRef.current.zoom;
    const clampedZoom = Math.max(0.55, Math.min(14.0, targetZoom));
    // Shortest angular delta for longitude
    let dLon = ((targetLon - startLon + 540) % 360) - 180;
    const dLat = Math.max(-78, Math.min(78, targetLat)) - startLat;
    const dZoom = clampedZoom - startZoom;
    viewRef.current.velLon = 0;
    viewRef.current.velLat = 0;
    const t0 = performance.now();

    const step = (now) => {
      if (!activeRef.current) {
        animFrameRef.current = null;
        return;
      }
      const p = Math.min(1, (now - t0) / durationMs);
      const ease = 1 - Math.pow(1 - p, 3);
      let nextLon = startLon + dLon * ease;
      if (nextLon > 180) nextLon -= 360;
      if (nextLon < -180) nextLon += 360;
      viewRef.current.lon = nextLon;
      viewRef.current.lat = startLat + dLat * ease;
      viewRef.current.zoom = startZoom + dZoom * ease;
      syncZoomLabel(viewRef.current.zoom);
      if (typeof renderCanvasRef.current === 'function') renderCanvasRef.current();
      if (p < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, [syncZoomLabel]);

  // Reset view
  useEffect(() => {
    if (!active || resetKey <= 0) return;
    focusRingRef.current = null;
    animateTo(14.0, 20.0, 1.0, 480);
  }, [resetKey, active, animateTo]);

  // Smooth 3D spherical fly-to + pulsing reticle when clicking feed event / Locate on Globe
  useEffect(() => {
    if (!active || !focusCoordinate || focusCoordinate.lat == null || focusCoordinate.lon == null) return;
    const lat = Number(focusCoordinate.lat);
    const lon = Number(focusCoordinate.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const now = Date.now();
    focusRingRef.current = { lat, lon, startedAt: now, expiresAt: now + 6000 };
    animateTo(lon, Math.max(-74, Math.min(74, lat)), Math.max(viewRef.current.zoom, 2.6), 620);

    if (focusPulseRef.current) cancelAnimationFrame(focusPulseRef.current);
    const pulseStep = () => {
      if (!activeRef.current || !focusRingRef.current || focusRingRef.current.expiresAt <= Date.now()) {
        focusRingRef.current = null;
        focusPulseRef.current = null;
        requestDraw();
        return;
      }
      requestDraw();
      focusPulseRef.current = requestAnimationFrame(pulseStep);
    };
    focusPulseRef.current = requestAnimationFrame(pulseStep);

    return () => {
      if (focusPulseRef.current) {
        cancelAnimationFrame(focusPulseRef.current);
        focusPulseRef.current = null;
      }
    };
  }, [focusCoordinate, active, animateTo, requestDraw]);

  // Smoothly fly camera toward newly selected satellite (e.g. from ORBIT sidebar or clicking globe spacecraft)
  useEffect(() => {
    if (!active || !showSatellites || !selectedSatellite) {
      lastSelectedSatCodeRef.current = null;
      return;
    }
    const code = selectedSatellite.code || selectedSatellite.id;
    if (code && code !== lastSelectedSatCodeRef.current) {
      lastSelectedSatCodeRef.current = code;
      const live = getLiveSatelliteCoords(selectedSatellite, Date.now());
      animateTo(live.lon, Math.max(-72, Math.min(72, live.lat)), Math.max(viewRef.current.zoom, 1.55), 560);
    }
  }, [active, showSatellites, selectedSatellite, animateTo]);

  // Smooth real-time orbital motion & live camera tracking loop (runs ONLY when active && showSatellites)
  useEffect(() => {
    if (!active || !showSatellites || !Array.isArray(satellites) || satellites.length === 0) {
      if (satLoopRef.current) {
        cancelAnimationFrame(satLoopRef.current);
        satLoopRef.current = null;
      }
      return;
    }
    let lastDraw = 0;
    const step = (now) => {
      if (!activeRef.current) return;
      if (!document.hidden && now - lastDraw >= 42) { // ~24fps ultra-lean orbital motion
        lastDraw = now;
        if (isTracked && selectedSatellite && !isDraggingRef.current && !animFrameRef.current) {
          const live = getLiveSatelliteCoords(selectedSatellite, Date.now());
          let dLon = ((live.lon - viewRef.current.lon + 540) % 360) - 180;
          viewRef.current.lon = ((viewRef.current.lon + dLon * 0.18 + 540) % 360) - 180;
          const tgtLat = Math.max(-74, Math.min(74, live.lat));
          viewRef.current.lat += (tgtLat - viewRef.current.lat) * 0.18;
        }
        if (typeof renderCanvasRef.current === 'function') renderCanvasRef.current();
      }
      satLoopRef.current = requestAnimationFrame(step);
    };
    satLoopRef.current = requestAnimationFrame(step);
    return () => {
      if (satLoopRef.current) {
        cancelAnimationFrame(satLoopRef.current);
        satLoopRef.current = null;
      }
    };
  }, [active, showSatellites, satellites, selectedSatellite, isTracked]);

  // Auto-rotate spin loop (ONLY runs when active && autoRotate && not dragging; 0% CPU when off!)
  useEffect(() => {
    if (!active || !autoRotate) {
      if (spinFrameRef.current) {
        cancelAnimationFrame(spinFrameRef.current);
        spinFrameRef.current = null;
      }
      return;
    }
    let last = performance.now();
    const tick = (now) => {
      if (!activeRef.current) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!isDraggingRef.current && !animFrameRef.current && !document.hidden) {
        viewRef.current.lon += dt * 4.2;
        if (viewRef.current.lon > 180) viewRef.current.lon -= 360;
        if (typeof renderCanvasRef.current === 'function') renderCanvasRef.current();
      }
      spinFrameRef.current = requestAnimationFrame(tick);
    };
    spinFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (spinFrameRef.current) {
        cancelAnimationFrame(spinFrameRef.current);
        spinFrameRef.current = null;
      }
    };
  }, [active, autoRotate]);

  function renderCanvas() {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    if (width <= 0 || height <= 0) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    const palette = getGlobePalette(uiTheme, mapStyle, isVectorMode, vectorTheme);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const { lon: lon0, lat: lat0, zoom } = viewRef.current;
    const baseRadius = Math.min(width, height) * (width < 768 ? 0.42 : 0.43);
    const R = baseRadius * zoom;
    const limbVisible = R < Math.hypot(width, height) * 1.15;

    const lam0 = lon0 * DEG2RAD;
    const phi0 = lat0 * DEG2RAD;
    const sinL0 = Math.sin(lam0);
    const cosL0 = Math.cos(lam0);
    const sinP0 = Math.sin(phi0);
    const cosP0 = Math.cos(phi0);
    // Camera forward unit vector in Earth-fixed coords
    const vx0 = cosP0 * sinL0;
    const vy0 = sinP0;
    const vz0 = cosP0 * cosL0;

    // Fast unit-vector projection into view space [x, y, z]
    const projVec = (ux, uy, uz) => {
      const x1 = ux * cosL0 - uz * sinL0;
      const z1 = ux * sinL0 + uz * cosL0;
      const y2 = uy * cosP0 - z1 * sinP0;
      const z2 = uy * sinP0 + z1 * cosP0;
      return [cx + x1 * R, cy - y2 * R, z2, x1, y2];
    };

    const projLonLat = (lon, lat) => {
      const phi = lat * DEG2RAD;
      const lam = (lon - lon0) * DEG2RAD;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const cosLam = Math.cos(lam);
      const x1 = cosPhi * Math.sin(lam);
      const y2 = cosP0 * sinPhi - sinP0 * cosPhi * cosLam;
      const z2 = sinP0 * sinPhi + cosP0 * cosPhi * cosLam;
      return [cx + x1 * R, cy - y2 * R, z2];
    };

    const onScreen = (sx, sy, pad = 42) => sx >= -pad && sx <= width + pad && sy >= -pad && sy <= height + pad;

    // 1. Deep Space / Light Backdrop + Starfield
    ctx.fillStyle = palette.spaceBg;
    ctx.fillRect(0, 0, width, height);

    if (!palette.isLight && limbVisible) {
      ctx.fillStyle = '#e2e8f0';
      for (let i = 0; i < SPACE_STARS.length; i++) {
        const st = SPACE_STARS[i];
        ctx.globalAlpha = st.a;
        ctx.fillRect(st.x * width, st.y * height, st.r, st.r);
      }
      ctx.globalAlpha = 1;
    }

    // 2. Atmospheric Outer Corona Glow (only when globe limb is inside viewport)
    if (limbVisible) {
      const haloGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.18);
      haloGrad.addColorStop(0, palette.atmoHalo);
      haloGrad.addColorStop(0.55, palette.spaceGlow);
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Spherical Ocean Base with 3D Illumination Gradient + Clip
    ctx.save();
    if (limbVisible) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      const oceanGrad = ctx.createRadialGradient(
        cx - R * 0.28,
        cy - R * 0.28,
        R * 0.08,
        cx,
        cy,
        R
      );
      oceanGrad.addColorStop(0, palette.oceanCenter);
      oceanGrad.addColorStop(0.62, palette.oceanMid);
      oceanGrad.addColorStop(1, palette.oceanEdge);
      ctx.fillStyle = oceanGrad;
      ctx.fill();
      ctx.clip();
    } else {
      // Deep zoom inside the ocean disc: fast viewport-only fill for <3ms 60fps
      ctx.fillStyle = palette.oceanMid;
      ctx.fillRect(0, 0, width, height);
    }

    // 4. Curved 3D Spherical Graticule Lines (adaptive 30deg -> 15deg on deep zoom)
    const gratStep = zoom >= 2.6 ? 15 : 30;
    const sampleStep = zoom >= 3.0 ? 3 : 6;
    ctx.lineWidth = 0.75;
    for (let lat = -75; lat <= 75; lat += gratStep) {
      if (lat % 30 !== 0 && zoom < 2.6) continue;
      ctx.beginPath();
      let pen = false;
      for (let lon = -180; lon <= 180; lon += sampleStep) {
        const [sx, sy, z] = projLonLat(lon, lat);
        if (z >= -0.02) {
          if (!pen) { ctx.moveTo(sx, sy); pen = true; }
          else ctx.lineTo(sx, sy);
        } else {
          pen = false;
        }
      }
      ctx.strokeStyle = lat === 0 ? palette.equator : palette.graticule;
      ctx.globalAlpha = lat % 30 === 0 ? 1 : 0.45;
      ctx.stroke();
    }
    for (let lon = -180; lon < 180; lon += gratStep) {
      if (lon % 30 !== 0 && zoom < 2.6) continue;
      ctx.beginPath();
      let pen = false;
      for (let lat = -84; lat <= 84; lat += sampleStep) {
        const [sx, sy, z] = projLonLat(lon, lat);
        if (z >= -0.02) {
          if (!pen) { ctx.moveTo(sx, sy); pen = true; }
          else ctx.lineTo(sx, sy);
        } else {
          pen = false;
        }
      }
      ctx.strokeStyle = lon === 0 ? palette.equator : palette.graticule;
      ctx.globalAlpha = lon % 30 === 0 ? 1 : 0.45;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 5. Spherical 3D Country Polygons (horizon-clamped + optional AI Regulation jurisdiction tint)
    const countries = PREPARED_SPHERE_COUNTRIES || [];
    const normSelected = (selectedCountry || '').trim().toLowerCase();
    const normHovered = (hoveredCountryRef.current || '').trim().toLowerCase();
    let selectedCountryItem = null;

    // Build optional AI Regulation country status map when layer is active
    let regCountryTint = null;
    if (aiRegulationsEnabled && Array.isArray(layerCache.aiRegulations?.aiRegulations)) {
      const EU27 = [
        'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic', 'czechia', 'denmark',
        'estonia', 'finland', 'france', 'germany', 'greece', 'hungary', 'ireland', 'italy', 'latvia',
        'lithuania', 'luxembourg', 'malta', 'netherlands', 'poland', 'portugal', 'romania', 'slovakia',
        'slovenia', 'spain', 'sweden'
      ];
      const rank = { 'In effect': 4, Passed: 3, Proposed: 2, Policy: 1 };
      const statusMap = new Map();
      const setStatus = (k, status) => {
        const prev = statusMap.get(k);
        if (!prev || (rank[status] || 0) > (rank[prev] || 0)) statusMap.set(k, status);
      };
      for (const item of layerCache.aiRegulations.aiRegulations) {
        const j = String(item.jurisdiction || '').trim().toLowerCase();
        const st = item.status || 'Policy';
        if (!j) continue;
        setStatus(j, st);
        if (j === 'european union' || j === 'eu') EU27.forEach((m) => setStatus(m, st));
        if (j === 'united states' || j === 'usa' || j === 'us') {
          setStatus('united states of america', st);
          setStatus('united states', st);
        }
        if (j === 'uk' || j === 'united kingdom') setStatus('united kingdom', st);
        if (j === 'south korea') setStatus('republic of korea', st);
      }
      regCountryTint = statusMap;
    }

    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(0.55, Math.min(1.45, 0.72 * Math.sqrt(zoom)));

    const traceCountryRings = (item) => {
      let drewAny = false;
      ctx.beginPath();
      for (let r = 0; r < item.rings.length; r++) {
        const ring = item.rings[r];
        // Fast bounding-cone backface cull
        const cDot = ring.center[0] * vx0 + ring.center[1] * vy0 + ring.center[2] * vz0;
        if (cDot < -ring.sinRadius - 0.14) continue;

        const pts = ring.pts;
        let hasFront = false;
        for (let i = 0; i < pts.length; i++) {
          const u = pts[i];
          const z1 = u[0] * sinL0 + u[2] * cosL0;
          const z2 = u[1] * sinP0 + z1 * cosP0;
          if (z2 > -0.04) {
            hasFront = true;
            break;
          }
        }
        if (!hasFront) continue;

        drewAny = true;
        for (let i = 0; i < pts.length; i++) {
          const u = pts[i];
          let x1 = u[0] * cosL0 - u[2] * sinL0;
          const z1 = u[0] * sinL0 + u[2] * cosL0;
          let y2 = u[1] * cosP0 - z1 * sinP0;
          const z2 = u[1] * sinP0 + z1 * cosP0;
          if (z2 < 0) {
            const hLen = Math.hypot(x1, y2) || 1;
            x1 = (x1 / hLen) * 1.01;
            y2 = (y2 / hLen) * 1.01;
          }
          const sx = cx + x1 * R;
          const sy = cy - y2 * R;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      }
      return drewAny;
    };

    for (let c = 0; c < countries.length; c++) {
      const item = countries[c];
      const nameLower = item.name.toLowerCase();
      const isSel = normSelected && nameLower === normSelected;
      if (isSel) selectedCountryItem = item;
      const isHov = !isSel && normHovered && nameLower === normHovered;

      if (traceCountryRings(item)) {
        ctx.fillStyle = isHov ? palette.landHover : palette.landFill;
        ctx.fill();
        if (regCountryTint && regCountryTint.has(nameLower)) {
          const st = regCountryTint.get(nameLower);
          ctx.fillStyle =
            st === 'In effect'
              ? 'rgba(16, 185, 129, 0.24)'
              : st === 'Passed'
                ? 'rgba(14, 165, 233, 0.20)'
                : st === 'Proposed'
                  ? 'rgba(245, 158, 11, 0.18)'
                  : 'rgba(139, 92, 246, 0.18)';
          ctx.fill();
        }
        ctx.strokeStyle = palette.landStroke;
        ctx.stroke();
      }
    }

    if (selectedCountryItem && traceCountryRings(selectedCountryItem)) {
      ctx.save();
      ctx.fillStyle = palette.selectedFill;
      ctx.fill();
      ctx.strokeStyle = palette.selectedStroke;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = palette.selectedStroke;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }

    // 6. Authentic Spherical Day/Night Solar Terminator + Twilight Curve + Night City Glows
    if (dayNightEnabled) {
      const now = new Date();
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
      const dayOfYear = (now - startOfYear) / 86400000;
      const subsolarLat = -23.44 * Math.cos(((2 * Math.PI) / 365.24) * (dayOfYear + 10));
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
      const subsolarLon = ((12 - utcHours) * 15 + 540) % 360 - 180;
      const sunVec = lonLatToUnit(subsolarLon, subsolarLat);

      // Compute two orthonormal tangent basis vectors perpendicular to sunVec to trace the exact terminator great circle
      const refUp = Math.abs(sunVec[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const bxRaw = [
        refUp[1] * sunVec[2] - refUp[2] * sunVec[1],
        refUp[2] * sunVec[0] - refUp[0] * sunVec[2],
        refUp[0] * sunVec[1] - refUp[1] * sunVec[0]
      ];
      const bxLen = Math.hypot(bxRaw[0], bxRaw[1], bxRaw[2]) || 1;
      const b1 = [bxRaw[0] / bxLen, bxRaw[1] / bxLen, bxRaw[2] / bxLen];
      const b2 = [
        sunVec[1] * b1[2] - sunVec[2] * b1[1],
        sunVec[2] * b1[0] - sunVec[0] * b1[2],
        sunVec[0] * b1[1] - sunVec[1] * b1[0]
      ];

      // Night hemisphere shading anchored cleanly opposite the sub-solar point
      const [antiSx, antiSy] = projVec(-sunVec[0], -sunVec[1], -sunVec[2]);
      const nightGrad = ctx.createRadialGradient(
        antiSx,
        antiSy,
        R * 0.08,
        antiSx,
        antiSy,
        R * 1.48
      );
      nightGrad.addColorStop(0, palette.isLight ? 'rgba(15, 23, 42, 0.36)' : 'rgba(2, 6, 23, 0.68)');
      nightGrad.addColorStop(0.55, palette.isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(2, 6, 23, 0.34)');
      nightGrad.addColorStop(0.86, 'rgba(2, 6, 23, 0.06)');
      nightGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nightGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw crisp golden-cyan solar twilight terminator curve (sunVec · p = 0)
      ctx.save();
      ctx.beginPath();
      let pen = false;
      for (let deg = 0; deg <= 360; deg += 4) {
        const a = deg * DEG2RAD;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const ux = b1[0] * ca + b2[0] * sa;
        const uy = b1[1] * ca + b2[1] * sa;
        const uz = b1[2] * ca + b2[2] * sa;
        const [tx, ty, tz] = projVec(ux, uy, uz);
        if (tz >= -0.01) {
          if (!pen) { ctx.moveTo(tx, ty); pen = true; }
          else ctx.lineTo(tx, ty);
        } else {
          pen = false;
        }
      }
      ctx.strokeStyle = palette.isLight ? 'rgba(217, 119, 6, 0.55)' : 'rgba(251, 191, 36, 0.58)';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = 'rgba(251, 191, 36, 0.45)';
      ctx.shadowBlur = 7;
      ctx.stroke();
      ctx.restore();

      // Subtle glowing city lights exclusively inside the night hemisphere
      if (!palette.isLight) {
        for (let i = 0; i < NIGHT_CITY_HUBS.length; i++) {
          const city = NIGHT_CITY_HUBS[i];
          const sunDot = city.u[0] * sunVec[0] + city.u[1] * sunVec[1] + city.u[2] * sunVec[2];
          if (sunDot > -0.04) continue;
          const [lx, ly, lz] = projVec(city.u[0], city.u[1], city.u[2]);
          if (lz < 0.06 || !onScreen(lx, ly)) continue;
          const glowR = Math.min(8, 3.6 * Math.sqrt(zoom));
          ctx.beginPath();
          ctx.arc(lx, ly, glowR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(lx, ly, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
          ctx.fill();
        }
      }

      // Sub-solar beacon on the day side
      const [sunSx, sunSy, sunZ] = projVec(sunVec[0], sunVec[1], sunVec[2]);
      if (sunZ > 0.08 && onScreen(sunSx, sunSy)) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sunSx, sunSy, 8.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sunSx, sunSy, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.fill();
        ctx.restore();
      }
    }

    // 7. Country Labels (front hemisphere, zoom-adaptive, non-overlapping)
    if (countries.length > 0 && mapStyle !== 'minimal') {
      const placedBoxes = [];
      const areaThreshold = zoom >= 3.2 ? 3 : zoom >= 2.0 ? 22 : zoom >= 1.3 ? 65 : 105;
      const fontSize = Math.round(Math.max(8.5, Math.min(11.5, 9 + Math.log2(Math.max(1, zoom)) * 0.85)));
      ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < countries.length; i++) {
        const c = countries[i];
        if (c.totalArea < areaThreshold && c !== selectedCountryItem) continue;
        if (c.name === 'Antarctica') continue;
        const [lx, ly, lz] = projVec(c.labelVec[0], c.labelVec[1], c.labelVec[2]);
        if (lz < 0.26) continue;
        if (lx < 20 || lx > width - 20 || ly < 20 || ly > height - 20) continue;

        const wLabel = c.nameUpper.length * (fontSize * 0.62) + 8;
        const hLabel = fontSize + 5;
        const box = { x1: lx - wLabel / 2, y1: ly - hLabel / 2, x2: lx + wLabel / 2, y2: ly + hLabel / 2 };
        let collides = false;
        for (let k = 0; k < placedBoxes.length; k++) {
          const b = placedBoxes[k];
          if (box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1) {
            collides = true;
            break;
          }
        }
        if (collides) continue;
        placedBoxes.push(box);

        ctx.globalAlpha = Math.min(1, (lz - 0.22) * 2.2);
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = palette.labelHalo;
        ctx.strokeText(c.nameUpper, lx, ly);
        ctx.fillStyle = c === selectedCountryItem ? palette.selectedStroke : palette.labelColor;
        ctx.fillText(c.nameUpper, lx, ly);
      }
      ctx.globalAlpha = 1;
    }

    const hitPoints = [];

    const drawSphericalLine = (coordsLonLat, color, lineW, alpha = 0.7) => {
      if (!Array.isArray(coordsLonLat) || coordsLonLat.length < 2) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineW;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < coordsLonLat.length; i++) {
        const lon = Number(coordsLonLat[i][0]);
        const lat = Number(coordsLonLat[i][1]);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        const [sx, sy, z] = projLonLat(lon, lat);
        if (z > 0.02) {
          if (!pen) { ctx.moveTo(sx, sy); pen = true; }
          else ctx.lineTo(sx, sy);
        } else {
          pen = false;
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    // 8A. Submarine Cables + Coastal Landing Stations
    if (internetCablesEnabled && layerCache.cables?.features) {
      const cableWidth = Math.max(1.15, Math.min(2.2, 1.25 * Math.sqrt(Math.min(zoom, 4))));
      layerCache.cables.features.forEach((f) => {
        const g = f.geometry;
        const col = f.properties?.color || '#ec4899';
        if (g?.type === 'LineString') drawSphericalLine(g.coordinates, col, cableWidth, 0.66);
        else if (g?.type === 'MultiLineString') g.coordinates.forEach((c) => drawSphericalLine(c, col, cableWidth, 0.66));
      });
    }
    if (internetCablesEnabled && layerCache.landingStations?.features) {
      const lsGrid = {};
      const lsBucket = zoom >= 3.2 ? 0.25 : zoom >= 1.8 ? 0.9 : 2.1;
      for (const f of layerCache.landingStations.features) {
        const coords = f.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) continue;
        const lon = Number(coords[0]);
        const lat = Number(coords[1]);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        const gk = `${Math.round(lat / lsBucket)},${Math.round(lon / lsBucket)}`;
        if (lsGrid[gk]) continue;
        lsGrid[gk] = true;
        const [sx, sy, z] = projLonLat(lon, lat);
        if (z < 0.04 || !onScreen(sx, sy)) continue;
        const r = zoom >= 2.5 ? 3.4 : 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#f472b6';
        ctx.fill();
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        const stName = f.properties?.name || 'Subsea Landing Station';
        hitPoints.push({
          x: sx, y: sy, r: r + 5, priority: 4, tooltipType: 'generic',
          title: `🔌 ${stName}`,
          details: { Infrastructure: 'Subsea Fiber Landing Point', Source: 'TeleGeography Live Map' },
          payload: { id: f.properties?.id || stName, title: stName, lat, lon, category: 'Infrastructure', severity: 2, source: 'TeleGeography Submarine Cable Map' }
        });
      }
    }

    // 8B. Oil & Gas Pipelines & Refineries
    if (oilGasEnabled && layerCache.oilGas) {
      (layerCache.oilGas.lines || []).forEach((line) => {
        drawSphericalLine(line.coordinates, line.color || '#f97316', 1.55, 0.72);
      });
      (layerCache.oilGas.points || []).forEach((pt) => {
        if (!Array.isArray(pt.coordinate) || pt.coordinate.length < 2) return;
        const [sx, sy, z] = projLonLat(pt.coordinate[0], pt.coordinate[1]);
        if (z < 0.04 || !onScreen(sx, sy)) return;
        const isLng = pt.facilityType === 'lng_terminal';
        const r = isLng ? 4.0 : 4.4;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = pt.color || (isLng ? '#38bdf8' : '#f59e0b');
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
        hitPoints.push({
          x: sx, y: sy, r: r + 5, priority: 3, tooltipType: 'energy',
          title: `${isLng ? '⚓ ' : '🏭 '}${pt.name || 'Energy Facility'}`,
          details: { Operator: pt.operator || 'Operator', Country: pt.country || 'Global', Capacity: pt.capacity || 'N/A' },
          payload: { ...pt, title: pt.name || 'Energy Facility', lat: pt.coordinate[1], lon: pt.coordinate[0], isOilGas: true, category: 'Economic', severity: 2 }
        });
      });
    }

    // 8C. GPS Jamming (Sharp Hexagonal Honeycomb Cells)
    if (gpsJammingEnabled && layerCache.gpsJamming?.cells) {
      layerCache.gpsJamming.cells
        .filter((cell) => cell.category && cell.category !== 'none' && cell.intensity > 0)
        .forEach((cell) => {
          const [sx, sy, z] = projLonLat(cell.lon, cell.lat);
          if (z < 0.05 || !onScreen(sx, sy, 32)) return;
          const radPx = Math.max(3.6, Math.min(20, ((cell.radiusKm || 14) * 1.45 / 6371) * R * 1.7));
          ctx.beginPath();
          for (let h = 0; h < 6; h++) {
            const ang = (Math.PI / 3) * h + Math.PI / 6;
            const hx = sx + radPx * Math.cos(ang);
            const hy = sy + radPx * Math.sin(ang);
            if (h === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fillStyle = cell.category === 'high' ? 'rgba(239,68,68,0.44)' : cell.category === 'medium' ? 'rgba(249,115,22,0.32)' : 'rgba(250,204,21,0.22)';
          ctx.fill();
          ctx.strokeStyle = cell.color || '#ef4444';
          ctx.lineWidth = 0.85;
          ctx.stroke();
          hitPoints.push({
            x: sx, y: sy, r: Math.max(7, radPx + 2), priority: 3, tooltipType: 'gps',
            title: '📡 GPS Interference Corridor',
            details: { Corridor: cell.source || cell.region || 'Contested Airspace', Severity: String(cell.category).toUpperCase(), Degradation: `${Math.round((cell.intensity || 0) * 100)}%` },
            payload: { ...cell, title: cell.source || cell.region || 'GPS Interference Corridor', isGpsJamming: true, category: 'Conflict', severity: cell.category === 'high' ? 4 : 3 }
          });
        });
    }

    // 8D. Data Centers & Frontier AI Compute Clusters (Zoom-Adaptive Density + Glowing Gold Diamonds)
    if (dataCentersEnabled && layerCache.dataCenters?.dataCenters) {
      const gridCounts = {};
      const bucketDeg = 0.85 / Math.sqrt(Math.max(1, zoom));
      const maxColoc = Math.round(650 * Math.min(3.4, zoom));
      let count = 0;
      for (const dc of layerCache.dataCenters.dataCenters) {
        if (typeof dc.lat !== 'number' || typeof dc.lon !== 'number') continue;
        const isFrontier = Boolean(dc.isFrontierCluster || dc.status === 'planned');
        if (!isFrontier) {
          const gk = `${Math.round(dc.lat / bucketDeg)},${Math.round(dc.lon / bucketDeg)}`;
          if ((gridCounts[gk] || 0) >= 2 || count >= maxColoc) continue;
          gridCounts[gk] = (gridCounts[gk] || 0) + 1;
        }
        count++;
        const [sx, sy, z] = projLonLat(dc.lon, dc.lat);
        if (z < 0.04 || !onScreen(sx, sy)) continue;
        if (isFrontier) {
          const d = zoom >= 2.2 ? 6.4 : 5.4;
          ctx.beginPath();
          ctx.moveTo(sx, sy - d);
          ctx.lineTo(sx + d, sy);
          ctx.lineTo(sx, sy + d);
          ctx.lineTo(sx - d, sy);
          ctx.closePath();
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
          if (zoom >= 2.0 && dc.name) {
            ctx.font = '700 8.5px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const shortName = dc.name.length > 26 ? `${dc.name.slice(0, 24)}…` : dc.name;
            ctx.lineWidth = 2.4;
            ctx.strokeStyle = palette.labelHalo;
            ctx.strokeText(shortName, sx + d + 4, sy);
            ctx.fillStyle = palette.isLight ? '#b45309' : '#fcd34d';
            ctx.fillText(shortName, sx + d + 4, sy);
          }
        } else {
          const r = zoom >= 2.8 ? 3.8 : 3.0;
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = '#0ea5e9';
          ctx.fill();
          ctx.lineWidth = 0.9;
          ctx.strokeStyle = '#0f172a';
          ctx.stroke();
        }
        hitPoints.push({
          x: sx, y: sy, r: isFrontier ? 10 : 7.5, priority: isFrontier ? 7 : 4, tooltipType: 'datacenter',
          title: `${isFrontier ? '⚡ ' : '🏢 '}${dc.name}`,
          details: {
            Operator: dc.operator || 'Independent',
            Country: dc.country || 'Global',
            ...(dc.powerMw ? { Power: `${dc.powerMw} MW` } : {}),
            Status: String(dc.status || 'Active').toUpperCase()
          },
          payload: { ...dc, isDataCenter: true, title: dc.name }
        });
      }
    }

    // 8E. AI Regulations
    if (aiRegulationsEnabled && layerCache.aiRegulations?.aiRegulations) {
      layerCache.aiRegulations.aiRegulations.forEach((item) => {
        if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return;
        const [sx, sy, z] = projLonLat(item.lon, item.lat);
        if (z < 0.04 || !onScreen(sx, sy)) return;
        const color = REG_COLORS[item.status] || '#8b5cf6';
        ctx.beginPath();
        ctx.arc(sx, sy, 4.8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        hitPoints.push({
          x: sx, y: sy, r: 9, priority: 5, tooltipType: 'regulation',
          title: `⚖️ ${item.title}`,
          details: { Jurisdiction: item.jurisdiction || 'Global', Status: String(item.status || 'Policy').toUpperCase(), Area: item.area || 'General' },
          payload: { ...item, isAiRegulation: true }
        });
      });
    }

    // 8F. Live Global Weather Layer: RainViewer Doppler Precipitation Radar + NASA EONET Active Cyclones, Wildfires & Volcanoes
    if (weatherEnabled) {
      if (radarCells.length > 0) {
        const cellR = Math.max(2.6, Math.min(12.5, (R / 215) * 3.4));
        for (let i = 0; i < radarCells.length; i++) {
          const rc = radarCells[i];
          const [rx, ry, rz] = projVec(rc.u[0], rc.u[1], rc.u[2]);
          if (rz < 0.04 || !onScreen(rx, ry, 24)) continue;
          const rScaled = cellR * (0.65 + 0.55 * rc.intensity) * (0.72 + 0.28 * Math.min(1, rz));
          ctx.fillStyle = rc.color;
          ctx.beginPath();
          ctx.arc(rx, ry, rScaled, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (storms.length > 0) {
        storms.forEach((ev) => {
          const latest = Array.isArray(ev.geometry) ? ev.geometry[ev.geometry.length - 1] : null;
          const coords = latest?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return;
          const [sx, sy, z] = projLonLat(coords[0], coords[1]);
          if (z < 0.04 || !onScreen(sx, sy)) return;

          const catId = String(ev.categories?.[0]?.id || 'severeStorms').toLowerCase();
          const isFire = catId.includes('wildfire');
          const isVolcano = catId.includes('volcano');
          const col = isFire ? '#f97316' : isVolcano ? '#ef4444' : '#06b6d4';
          const icon = isFire ? '🔥' : isVolcano ? '🌋' : '🌀';

          if (isVolcano) {
            ctx.beginPath();
            ctx.moveTo(sx, sy - 6.8);
            ctx.lineTo(sx + 6.4, sy + 5.2);
            ctx.lineTo(sx - 6.4, sy + 5.2);
            ctx.closePath();
            ctx.fillStyle = col;
            ctx.fill();
            ctx.lineWidth = 1.4;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(sx, sy, isFire ? 8.2 : 11.2, 0, Math.PI * 2);
            ctx.strokeStyle = isFire ? 'rgba(249, 115, 22, 0.55)' : 'rgba(6, 182, 212, 0.65)';
            ctx.lineWidth = 1.5;
            if (!isFire) ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(sx, sy, isFire ? 4.6 : 5.8, 0, Math.PI * 2);
            ctx.fillStyle = col;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }

          hitPoints.push({
            x: sx, y: sy, r: 11, priority: 5, tooltipType: 'generic',
            title: `${icon} ${ev.title}`,
            details: {
              Hazard: isFire ? 'Active Wildfire' : isVolcano ? 'Volcanic Activity' : 'Severe Tropical / Weather System',
              Source: 'NASA EONET + RainViewer Live Telemetry',
              Observed: String(latest.date || 'Active').slice(0, 10)
            },
            payload: { id: ev.id || ev.title, title: ev.title, lat: coords[1], lon: coords[0], category: 'Disaster', severity: isFire || isVolcano ? 3 : 4 }
          });
        });
      }
    }

    // 8G. AI Ethics & Censorship Layers (including Supply Chain curved arcs!)
    if (supplyChainEnabled && Array.isArray(layerCache.supplyChain?.arcs)) {
      layerCache.supplyChain.arcs.forEach((arc) => {
        if (!Array.isArray(arc.from) || !Array.isArray(arc.to)) return;
        const pts = [];
        for (let step = 0; step <= 18; step++) {
          const t = step / 18;
          const lat = arc.from[0] + (arc.to[0] - arc.from[0]) * t;
          let dLon = arc.to[1] - arc.from[1];
          if (dLon > 180) dLon -= 360;
          if (dLon < -180) dLon += 360;
          const lon = ((arc.from[1] + dLon * t + 540) % 360) - 180;
          pts.push([lon, lat]);
        }
        drawSphericalLine(pts, arc.color || '#f59e0b', 1.65, 0.72);
      });
    }
    const ethicsJobs = [
      [censorshipEnabled, 'censorship', '🔒'],
      [envJusticeEnabled, 'environmental', '🌍'],
      [supplyChainEnabled, 'supplyChain', '🪨'],
      [biometricWelfareEnabled, 'biometricWelfare', '👁️'],
      [aiLaborEnabled, 'aiLabor', '⚖️']
    ];
    ethicsJobs.forEach(([on, key, icon]) => {
      if (!on || !layerCache[key]?.items) return;
      layerCache[key].items.forEach((item) => {
        if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return;
        const [sx, sy, z] = projLonLat(item.lon, item.lat);
        if (z < 0.04 || !onScreen(sx, sy)) return;
        const col = item.color || '#a855f7';
        ctx.beginPath();
        ctx.arc(sx, sy, 7.6, 0, Math.PI * 2);
        ctx.fillStyle = `${col}2a`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 5.0, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        hitPoints.push({
          x: sx, y: sy, r: 9.5, priority: 6, tooltipType: 'regulation',
          title: `${icon} ${item.title || item.name}`,
          details: { Country: item.country || 'Global', Source: item.source || 'Observatory' },
          payload: { ...item, isEthicsOverlay: true, title: item.title || item.name }
        });
      });
    });

    // 8H. Temporal Replay Milestones
    if (temporalReplayActive && Array.isArray(temporalMilestones)) {
      temporalMilestones.forEach((m) => {
        if (typeof m.lat !== 'number' || typeof m.lon !== 'number') return;
        const [sx, sy, z] = projLonLat(m.lon, m.lat);
        if (z < 0.04) return;
        const color = m.track === 'law' ? '#10b981' : m.track === 'institute' ? '#a855f7' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(sx, sy, 5.2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = m.isPostBaseline ? 2 : 1.2;
        ctx.strokeStyle = m.isPostBaseline ? '#00f0ff' : '#ffffff';
        ctx.stroke();
        hitPoints.push({
          x: sx, y: sy, r: 9, priority: 7, tooltipType: 'regulation',
          title: `[${m.date}] ${m.title}`,
          details: { Track: String(m.track || 'law').toUpperCase(), Location: m.location || 'Global' },
          payload: { ...m, isTemporalMilestone: true }
        });
      });
    }

    // 8I. Live Threat / Intelligence Event Nodes (front hemisphere, crisp S1-S5 styling)
    if (eventsEnabled && Array.isArray(repelledMarkers) && repelledMarkers.length > 0) {
      // Draw lower severity first so S5 critical rings always sit cleanly on top
      const sorted = [...repelledMarkers].sort((a, b) => (a.severity || 1) - (b.severity || 1));
      for (let i = 0; i < sorted.length; i++) {
        const m = sorted[i];
        const lat = Number(m.repelledLat ?? m.lat);
        const lon = Number(m.repelledLon ?? m.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const [sx, sy, z] = projLonLat(lon, lat);
        if (z < 0.01) continue;

        const sev = Number(m.severity) || 1;
        const col = SEV_COLORS[sev] || '#ff2d55';
        const isManual = String(m.id || '').startsWith('evt-');
        const depthScale = 0.72 + Math.min(1, z) * 0.28;
        const r = (3.4 + sev * 0.72) * depthScale;

        // S5 outer tactical halo ring
        if (sev >= 5) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + 4.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 45, 85, 0.16)';
          ctx.fill();
          ctx.lineWidth = 1.25;
          ctx.strokeStyle = 'rgba(255, 45, 85, 0.85)';
          ctx.stroke();
        }

        // Grounding contact shadow
        ctx.beginPath();
        ctx.arc(sx, sy, r + 1.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(2, 6, 23, 0.42)';
        ctx.fill();

        // Main event circle
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.lineWidth = isManual ? 1.8 : 1.3;
        ctx.strokeStyle = isManual ? '#00f0ff' : palette.nodeStroke;
        ctx.stroke();

        const ts = m.original_post_time || m.timestamp;
        hitPoints.push({
          x: sx,
          y: sy,
          r: Math.max(8, r + 4.5),
          priority: 10 + sev,
          tooltipType: 'event',
          title: m.title || m.name || 'Intelligence Signal',
          details: {
            Location: String(m.location || 'Global'),
            Domain: String(m.details?.domainPillar || m.category || 'Tech Policy'),
            Severity: `S${sev}`,
            ...(m.source ? { Source: String(m.source) } : {}),
            ...(ts ? { Date: new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : {})
          },
          payload: m
        });
      }
    }

    // 8J. Pulsing Focus Target Reticle
    if (focusRingRef.current && focusRingRef.current.expiresAt > Date.now()) {
      const [fx, fy, fz] = projLonLat(focusRingRef.current.lon, focusRingRef.current.lat);
      if (fz > 0.01 && onScreen(fx, fy, 48)) {
        const pulse = ((Date.now() - (focusRingRef.current.startedAt || 0)) % 1200) / 1200;
        ctx.beginPath();
        ctx.arc(fx, fy, 12 + pulse * 22, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - pulse) * 0.85})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fx, fy, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#00f0ff';
        ctx.stroke();
      }
    }

    // 9. Spherical 3D Rim Shading (viewport-clamped so deep zoom stays 60fps!)
    if (limbVisible) {
      const rimShade = ctx.createRadialGradient(
        cx - R * 0.25,
        cy - R * 0.25,
        R * 0.52,
        cx,
        cy,
        R
      );
      rimShade.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
      rimShade.addColorStop(0.76, 'rgba(0, 0, 0, 0)');
      rimShade.addColorStop(1, palette.isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(2, 6, 23, 0.42)');
      ctx.fillStyle = rimShade;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore(); // end sphere clip

    // 10. Crisp Luminous Atmospheric Limb Ring (when visible in viewport)
    if (limbVisible) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = palette.rimStroke;
      ctx.stroke();
    }

    // 11. Live Orbiting Satellites (Real-Time Keplerian Motion + Custom Spacecraft Icons + Orbital Tracks + Nadir Beam + Ground Swath Footprint)
    if (showSatellites && Array.isArray(satellites) && satellites.length > 0) {
      const nowMs = Date.now();
      const projOrbitPt = (lonDeg, latDeg, altScale) => {
        const phi = latDeg * DEG2RAD;
        const lam = (lonDeg - lon0) * DEG2RAD;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        const x1 = cosPhi * Math.sin(lam);
        const y2 = cosP0 * sinPhi - sinP0 * cosPhi * Math.cos(lam);
        const z2 = sinP0 * sinPhi + cosP0 * cosPhi * Math.cos(lam);
        const occluded = z2 < 0 && x1 * x1 + y2 * y2 < 1 / (altScale * altScale);
        return [cx + x1 * R * altScale, cy - y2 * R * altScale, z2, occluded];
      };

      const drawKeplerOrbitRing = (sat, liveCoords, altScale, startDeg, endDeg, strokeStyle, lineW, dashed = false) => {
        const incRad = Math.max(0.05, ((Number(sat.inclination) || 51.6) * Math.PI) / 180);
        const satLatRad = liveCoords.lat * DEG2RAD;
        const sinTheta = Math.max(-1, Math.min(1, Math.sin(satLatRad) / Math.sin(incRad)));
        const theta0 = liveCoords.theta != null ? liveCoords.theta : Math.asin(sinTheta);
        const lonOrb0 = Math.atan2(Math.cos(incRad) * Math.sin(theta0), Math.cos(theta0));
        const raanDeg = liveCoords.lon - lonOrb0 * RAD2DEG;

        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineW;
        if (dashed) ctx.setLineDash([4, 5]);
        ctx.beginPath();
        let pen = false;
        for (let off = startDeg; off <= endDeg; off += 4) {
          const th = theta0 + off * DEG2RAD;
          const latD = Math.asin(Math.max(-1, Math.min(1, Math.sin(incRad) * Math.sin(th)))) * RAD2DEG;
          let lonD = Math.atan2(Math.cos(incRad) * Math.sin(th), Math.cos(th)) * RAD2DEG + raanDeg;
          lonD = ((lonD + 540) % 360) - 180;
          const [ox, oy, , occ] = projOrbitPt(lonD, latD, altScale);
          if (!occ) {
            if (!pen) { ctx.moveTo(ox, oy); pen = true; }
            else ctx.lineTo(ox, oy);
          } else {
            pen = false;
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      };

      // Draw subtle orbital guide rings for flagship stations (ISS / Tiangong) so the orbital shell is unmistakably legible
      satellites.forEach((sat) => {
        if (sat.missionType !== 'station') return;
        const live = getLiveSatelliteCoords(sat, nowMs);
        const altScale = 1 + Math.min(0.24, Math.max(0.045, (Number(sat.altitude) || 420) / 14000));
        drawKeplerOrbitRing(sat, live, altScale, -180, 180, palette.isLight ? 'rgba(2, 132, 199, 0.24)' : 'rgba(0, 240, 255, 0.22)', 1.1, true);
      });

      // Draw selected satellite full luminous orbital track + nadir scan beam + projected ground sensor swath footprint
      if (selectedSatellite) {
        const selLive = getLiveSatelliteCoords(selectedSatellite, nowMs);
        const satAltScale = 1 + Math.min(0.26, Math.max(0.05, (Number(selectedSatellite.altitude) || 550) / 14000));

        drawKeplerOrbitRing(selectedSatellite, selLive, satAltScale, -175, 0, 'rgba(168, 85, 247, 0.70)', 1.8, false);
        drawKeplerOrbitRing(selectedSatellite, selLive, satAltScale, 0, 175, '#00f0ff', 2.4, false);

        // Projected spherical ground sensor swath footprint circle on Earth's surface
        const swathDeg = Math.max(2.2, Math.min(18, ((Number(selectedSatellite.swathRadiusKm) || 480) / 111.32)));
        const [gX, gY, gZ] = projLonLat(selLive.lon, selLive.lat);
        if (gZ > 0.04) {
          ctx.save();
          ctx.beginPath();
          let pen = false;
          for (let deg = 0; deg <= 360; deg += 12) {
            const a = deg * DEG2RAD;
            const fpLat = Math.max(-85, Math.min(85, selLive.lat + swathDeg * Math.sin(a)));
            const fpLon = selLive.lon + (swathDeg * Math.cos(a)) / Math.max(0.2, Math.cos(selLive.lat * DEG2RAD));
            const [fx, fy, fz] = projLonLat(fpLon, fpLat);
            if (fz > 0.01) {
              if (!pen) { ctx.moveTo(fx, fy); pen = true; }
              else ctx.lineTo(fx, fy);
            } else {
              pen = false;
            }
          }
          ctx.closePath();
          ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.80)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.restore();
        }

        // Vertical nadir scan beam from satellite down to sub-satellite surface point
        const [satX, satY, , satOcc] = projOrbitPt(selLive.lon, selLive.lat, satAltScale);
        if (!satOcc && gZ > 0.02) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
          ctx.lineWidth = 1.7;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(satX, satY);
          ctx.lineTo(gX, gY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(gX, gY, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = '#00f0ff';
          ctx.fill();
          ctx.restore();
        }
      }

      const drawSpacecraftGlyph = (sx, sy, col, isSel, isStation) => {
        const s = isSel ? 1.45 : isStation ? 1.25 : 1.0;
        ctx.save();
        ctx.translate(sx, sy);

        // Luminous orbital beacon halo
        ctx.beginPath();
        ctx.arc(0, 0, (isSel ? 11.5 : isStation ? 8.5 : 6.4) * s, 0, Math.PI * 2);
        ctx.fillStyle = `${col}33`;
        ctx.fill();
        if (isSel || isStation) {
          ctx.strokeStyle = col;
          ctx.lineWidth = isSel ? 1.4 : 1.0;
          ctx.stroke();
        }

        // Angled dual photovoltaic solar-panel wings (instantly recognizable spacecraft silhouette!)
        ctx.rotate(-0.42);
        ctx.fillStyle = palette.isLight ? '#0369a1' : '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.85;
        // Left solar wing
        ctx.fillRect(-9.2 * s, -2.2 * s, 5.2 * s, 4.4 * s);
        ctx.strokeRect(-9.2 * s, -2.2 * s, 5.2 * s, 4.4 * s);
        // Right solar wing
        ctx.fillRect(4.0 * s, -2.2 * s, 5.2 * s, 4.4 * s);
        ctx.strokeRect(4.0 * s, -2.2 * s, 5.2 * s, 4.4 * s);

        // Central spacecraft bus
        ctx.fillStyle = isSel ? '#ffffff' : col;
        ctx.strokeStyle = palette.isLight ? '#0f172a' : '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.fillRect(-2.6 * s, -2.8 * s, 5.2 * s, 5.6 * s);
        ctx.strokeRect(-2.6 * s, -2.8 * s, 5.2 * s, 5.6 * s);

        ctx.restore();
      };

      const satLabelBoxes = [];
      satellites.forEach((sat) => {
        const live = getLiveSatelliteCoords(sat, nowMs);
        const altScale = 1 + Math.min(0.26, Math.max(0.045, (Number(sat.altitude) || 550) / 14000));
        const [sx, sy, , occluded] = projOrbitPt(live.lon, live.lat, altScale);
        if (occluded || !onScreen(sx, sy, 36)) return;

        const isSel = selectedSatellite && (selectedSatellite.code === sat.code || selectedSatellite.id === sat.id);
        const isStation = sat.missionType === 'station';
        const col = MISSION_COLORS[sat.missionType] || '#38bdf8';

        // Draw crisp spacecraft solar-panel glyph
        drawSpacecraftGlyph(sx, sy, col, isSel, isStation);

        // Crisp non-overlapping callsign labels for selected, flagship stations, and nearby sats on zoom
        const shouldLabel = isSel || isStation || sat.code === '20580' || zoom >= 2.2;
        if (shouldLabel && sat.name) {
          const shortLbl = String(sat.name).replace(/\s*\(.*?\)/g, '').slice(0, 16);
          const bx = { x1: sx + 9, y1: sy - 7, x2: sx + 9 + shortLbl.length * 6.2, y2: sy + 7 };
          const collides = !isSel && satLabelBoxes.some((b) => bx.x1 < b.x2 && bx.x2 > b.x1 && bx.y1 < b.y2 && bx.y2 > b.y1);
          if (!collides) {
            satLabelBoxes.push(bx);
            ctx.save();
            ctx.font = isSel ? '800 9.5px var(--font-jetbrains-fallback), monospace' : '700 8.5px var(--font-jetbrains-fallback), monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = palette.labelHalo;
            ctx.strokeText(shortLbl, sx + 11, sy);
            ctx.fillStyle = isSel ? '#00f0ff' : col;
            ctx.fillText(shortLbl, sx + 11, sy);
            ctx.restore();
          }
        }

        hitPoints.push({
          x: sx, y: sy, r: isSel ? 15 : 13, priority: 22, isSatellite: true, tooltipType: 'generic',
          title: `🛰️ ${sat.name}`,
          details: {
            Operator: sat.operator || sat.country || 'Space Agency',
            Altitude: `${sat.altitude || 550} km (${sat.orbitRegime || 'LEO'})`,
            Velocity: sat.velocity ? `${sat.velocity} km/s` : '7.6 km/s',
            Position: `${live.lat.toFixed(2)}°, ${live.lon.toFixed(2)}°`
          },
          payload: { ...sat, latitude: live.lat, longitude: live.lon }
        });
      });
    }

    interactivePointsRef.current = hitPoints;
    ctx.restore();
  }

  renderCanvasRef.current = renderCanvas;

  // Redraw when data, theme, or overlays change
  useEffect(() => {
    if (active) requestDraw();
  }, [
    active,
    countriesReady,
    overlayTick,
    repelledMarkers,
    eventsEnabled,
    showSatellites,
    satellites,
    selectedSatellite,
    selectedCountry,
    uiTheme,
    mapStyle,
    isVectorMode,
    vectorTheme,
    dayNightEnabled,
    weatherEnabled,
    storms,
    radarCells,
    oilGasEnabled,
    internetCablesEnabled,
    gpsJammingEnabled,
    dataCentersEnabled,
    aiRegulationsEnabled,
    censorshipEnabled,
    envJusticeEnabled,
    supplyChainEnabled,
    biometricWelfareEnabled,
    aiLaborEnabled,
    temporalReplayActive,
    temporalMilestones,
    requestDraw
  ]);

  // Resize observer
  useEffect(() => {
    if (!wrapperRef.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (activeRef.current) requestDraw();
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [requestDraw]);

  // Multi-touch pinch-to-zoom, cursor-anchored wheel zoom, inertial drag-to-orbit, double-click zoom, keyboard & hover/tap hit-testing
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const activePointers = new Map();
    let moved = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let prevPinchDist = null;
    let prevPinchMidX = 0;
    let prevPinchMidY = 0;
    let lastHoverCheck = 0;
    let lastTapTs = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let inertiaRaf = null;

    const stopInertia = () => {
      if (inertiaRaf) {
        cancelAnimationFrame(inertiaRaf);
        inertiaRaf = null;
      }
      viewRef.current.velLon = 0;
      viewRef.current.velLat = 0;
    };

    const getGlobeRadius = () => {
      const w = wrapper.clientWidth || 1;
      const h = wrapper.clientHeight || 1;
      return Math.min(w, h) * (w < 768 ? 0.42 : 0.43) * viewRef.current.zoom;
    };

    const screenToLonLat = (mx, my) => {
      const w = wrapper.clientWidth || 1;
      const h = wrapper.clientHeight || 1;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const R = getGlobeRadius();
      const dx = (mx - cx) / R;
      const dy = (cy - my) / R;
      const rho2 = dx * dx + dy * dy;
      if (rho2 > 0.9995) return null;
      const rho = Math.sqrt(rho2);
      const phi0 = viewRef.current.lat * DEG2RAD;
      const lam0 = viewRef.current.lon * DEG2RAD;
      if (rho < 1e-7) return { lat: viewRef.current.lat, lon: viewRef.current.lon };
      const c = Math.asin(Math.min(1, rho));
      const sinC = Math.sin(c);
      const cosC = Math.cos(c);
      const sinP0 = Math.sin(phi0);
      const cosP0 = Math.cos(phi0);
      const lat = Math.asin(Math.max(-1, Math.min(1, cosC * sinP0 + (dy * sinC * cosP0) / rho))) * RAD2DEG;
      let lon = (lam0 + Math.atan2(dx * sinC, rho * cosP0 * cosC - dy * sinP0 * sinC)) * RAD2DEG;
      lon = ((lon + 540) % 360) - 180;
      return { lat, lon };
    };

    const pickPoint = (mx, my, extraPad = 0) => {
      const pts = interactivePointsRef.current;
      let best = null;
      let bestScore = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const dx = mx - p.x;
        const dy = my - p.y;
        const d2 = dx * dx + dy * dy;
        const hitR = p.r + extraPad;
        if (d2 <= hitR * hitR) {
          const score = p.priority * 100 - Math.sqrt(d2);
          if (score > bestScore) {
            bestScore = score;
            best = p;
          }
        }
      }
      return best;
    };

    const applyCursorZoom = (factor, mx, my) => {
      const prevZoom = viewRef.current.zoom;
      const nextZoom = Math.max(0.55, Math.min(14.0, prevZoom * factor));
      if (Math.abs(nextZoom - prevZoom) < 1e-5) return;

      const geoBefore = mx != null && my != null ? screenToLonLat(mx, my) : null;
      viewRef.current.zoom = nextZoom;

      if (geoBefore) {
        const geoAfter = screenToLonLat(mx, my);
        if (geoAfter) {
          let dLon = ((geoBefore.lon - geoAfter.lon + 540) % 360) - 180;
          const dLat = geoBefore.lat - geoAfter.lat;
          if (Math.abs(dLon) < 40 && Math.abs(dLat) < 40) {
            let nextLon = viewRef.current.lon + dLon * 0.85;
            if (nextLon > 180) nextLon -= 360;
            if (nextLon < -180) nextLon += 360;
            viewRef.current.lon = nextLon;
            viewRef.current.lat = Math.max(-78, Math.min(78, viewRef.current.lat + dLat * 0.85));
          }
        }
      }
      syncZoomLabel(nextZoom);
      requestDraw();
    };

    const onPointerDown = (e) => {
      if (!activeRef.current) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stopInertia();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
      isDraggingRef.current = true;
      canvas.style.cursor = 'grabbing';
      if (callbacksRef.current.onInteraction) callbacksRef.current.onInteraction();
      try { canvas.setPointerCapture(e.pointerId); } catch {}

      if (activePointers.size === 1) {
        moved = false;
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        prevPinchDist = null;
      } else if (activePointers.size === 2) {
        moved = true;
        const [p1, p2] = Array.from(activePointers.values());
        prevPinchDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        prevPinchMidX = (p1.x + p2.x) * 0.5;
        prevPinchMidY = (p1.y + p2.y) * 0.5;
      }
    };

    const onPointerMove = (e) => {
      if (!activeRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });

        // 2-finger pinch-to-zoom + midpoint pan on touch devices
        if (activePointers.size >= 2) {
          const [p1, p2] = Array.from(activePointers.values());
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const midX = (p1.x + p2.x) * 0.5;
          const midY = (p1.y + p2.y) * 0.5;

          if (prevPinchDist && prevPinchDist > 10 && dist > 10) {
            const R = getGlobeRadius();
            const degPerPx = 90 / Math.max(80, R);
            const mdx = midX - prevPinchMidX;
            const mdy = midY - prevPinchMidY;
            let nextLon = viewRef.current.lon - mdx * degPerPx;
            if (nextLon > 180) nextLon -= 360;
            if (nextLon < -180) nextLon += 360;
            viewRef.current.lon = nextLon;
            viewRef.current.lat = Math.max(-78, Math.min(78, viewRef.current.lat + mdy * degPerPx));

            const scaleRatio = Math.max(0.75, Math.min(1.35, dist / prevPinchDist));
            applyCursorZoom(scaleRatio, midX - rect.left, midY - rect.top);
          }
          prevPinchDist = dist;
          prevPinchMidX = midX;
          prevPinchMidY = midY;
          return;
        }

        // Single-finger / mouse spherical drag
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > (e.pointerType === 'touch' ? 7 : 3)) {
          moved = true;
        }
        lastX = e.clientX;
        lastY = e.clientY;

        const R = getGlobeRadius();
        const degPerPx = 90 / Math.max(80, R);
        const dLon = -dx * degPerPx;
        const dLat = dy * degPerPx;

        let nextLon = viewRef.current.lon + dLon;
        if (nextLon > 180) nextLon -= 360;
        if (nextLon < -180) nextLon += 360;
        viewRef.current.lon = nextLon;
        viewRef.current.lat = Math.max(-78, Math.min(78, viewRef.current.lat + dLat));
        viewRef.current.velLon = dLon;
        viewRef.current.velLat = dLat;
        requestDraw();
        return;
      }

      // Desktop hover inspection
      if (e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - lastHoverCheck < 40) return;
      lastHoverCheck = now;

      const hit = pickPoint(mx, my, 0);
      if (hit) {
        canvas.style.cursor = 'pointer';
        tooltipActiveRef.current = true;
        if (callbacksRef.current.onHoverTooltip) {
          callbacksRef.current.onHoverTooltip({
            show: true,
            x: mx,
            y: my,
            content: hit.title,
            type: hit.tooltipType || 'generic',
            title: hit.title,
            details: hit.details || null
          });
        }
        return;
      }

      if (tooltipActiveRef.current) {
        tooltipActiveRef.current = false;
        if (callbacksRef.current.onHoverTooltip) {
          callbacksRef.current.onHoverTooltip({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
        }
      }

      const geo = screenToLonLat(mx, my);
      let matched = null;
      if (geo && PREPARED_SPHERE_COUNTRIES) {
        for (let i = 0; i < PREPARED_SPHERE_COUNTRIES.length; i++) {
          if (isPointInFeature(geo.lat, geo.lon, PREPARED_SPHERE_COUNTRIES[i])) {
            matched = PREPARED_SPHERE_COUNTRIES[i].name;
            break;
          }
        }
      }
      canvas.style.cursor = matched ? 'pointer' : 'grab';
      if (matched !== hoveredCountryRef.current) {
        hoveredCountryRef.current = matched;
        requestDraw();
      }
    };

    const onPointerUp = (e) => {
      if (!activePointers.has(e.pointerId)) return;
      const pointerType = activePointers.get(e.pointerId)?.type || e.pointerType;
      activePointers.delete(e.pointerId);
      try { canvas.releasePointerCapture(e.pointerId); } catch {}

      if (activePointers.size === 1) {
        // One finger still down after pinch: smoothly re-anchor single drag without jumping
        const remaining = Array.from(activePointers.values())[0];
        lastX = remaining.x;
        lastY = remaining.y;
        prevPinchDist = null;
        return;
      }

      prevPinchDist = null;
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';

      if (!moved) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const isTouch = pointerType === 'touch';

        // Double-tap on mobile zooms cleanly into tapped coordinates
        if (isTouch) {
          const now = Date.now();
          if (now - lastTapTs < 310 && Math.hypot(mx - lastTapX, my - lastTapY) < 34) {
            lastTapTs = 0;
            const geoTap = screenToLonLat(mx, my);
            if (geoTap) {
              animateTo(geoTap.lon, geoTap.lat, Math.min(14.0, viewRef.current.zoom * 1.85), 320);
              return;
            }
          }
          lastTapTs = now;
          lastTapX = mx;
          lastTapY = my;
        }

        const hit = pickPoint(mx, my, isTouch ? 11 : 2);
        if (hit) {
          if (hit.isSatellite) {
            if (callbacksRef.current.onSatelliteClick) callbacksRef.current.onSatelliteClick(hit.payload);
          } else if (callbacksRef.current.onPointClick) {
            callbacksRef.current.onPointClick(hit.payload);
          }
          return;
        }
        const geo = screenToLonLat(mx, my);
        if (geo && PREPARED_SPHERE_COUNTRIES) {
          for (let i = 0; i < PREPARED_SPHERE_COUNTRIES.length; i++) {
            if (isPointInFeature(geo.lat, geo.lon, PREPARED_SPHERE_COUNTRIES[i])) {
              if (callbacksRef.current.onCountrySelect) {
                callbacksRef.current.onCountrySelect(PREPARED_SPHERE_COUNTRIES[i].name);
              }
              return;
            }
          }
        }
      } else {
        // Gentle inertial glide after a crisp drag/flick
        const speed = Math.hypot(viewRef.current.velLon, viewRef.current.velLat);
        if (speed > 0.08 && speed < 14) {
          const glide = () => {
            if (!activeRef.current || isDraggingRef.current) {
              inertiaRaf = null;
              return;
            }
            viewRef.current.velLon *= 0.89;
            viewRef.current.velLat *= 0.89;
            if (Math.hypot(viewRef.current.velLon, viewRef.current.velLat) < 0.015) {
              inertiaRaf = null;
              return;
            }
            let nextLon = viewRef.current.lon + viewRef.current.velLon;
            if (nextLon > 180) nextLon -= 360;
            if (nextLon < -180) nextLon += 360;
            viewRef.current.lon = nextLon;
            viewRef.current.lat = Math.max(-78, Math.min(78, viewRef.current.lat + viewRef.current.velLat));
            requestDraw();
            inertiaRaf = requestAnimationFrame(glide);
          };
          inertiaRaf = requestAnimationFrame(glide);
        }
      }
    };

    const onDblClick = (e) => {
      if (!activeRef.current) return;
      stopInertia();
      const rect = canvas.getBoundingClientRect();
      const geo = screenToLonLat(e.clientX - rect.left, e.clientY - rect.top);
      if (geo) {
        animateTo(geo.lon, geo.lat, Math.min(14.0, viewRef.current.zoom * 1.85), 340);
      } else {
        animateTo(viewRef.current.lon, viewRef.current.lat, Math.min(14.0, viewRef.current.zoom * 1.5), 280);
      }
    };

    const onPointerLeave = () => {
      if (hoveredCountryRef.current) {
        hoveredCountryRef.current = null;
        requestDraw();
      }
      if (tooltipActiveRef.current) {
        tooltipActiveRef.current = false;
        if (callbacksRef.current.onHoverTooltip) {
          callbacksRef.current.onHoverTooltip({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
        }
      }
    };

    const onWheel = (e) => {
      if (!activeRef.current) return;
      e.preventDefault();
      stopInertia();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (callbacksRef.current.onInteraction) callbacksRef.current.onInteraction();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const unitScale = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 220 : 1;
      const rawDelta = e.deltaY * unitScale * (e.ctrlKey ? 2.4 : 1);
      const clampedDelta = Math.max(-220, Math.min(220, rawDelta));
      const factor = Math.exp(-clampedDelta * 0.0024);
      applyCursorZoom(factor, mx, my);
    };

    const onKeyDown = (e) => {
      if (!activeRef.current) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        animateTo(viewRef.current.lon, viewRef.current.lat, Math.min(14.0, viewRef.current.zoom * 1.38), 220);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        animateTo(viewRef.current.lon, viewRef.current.lat, Math.max(0.55, viewRef.current.zoom / 1.38), 220);
      }
    };

    // Prevent browser native pinch/page scroll on mobile touchscreens
    const onTouchMovePrevent = (e) => {
      if (activeRef.current) e.preventDefault();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchmove', onTouchMovePrevent, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      stopInertia();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchmove', onTouchMovePrevent);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [requestDraw, animateTo, syncZoomLabel]);

  const handleStepZoom = (dir) => {
    const nextZoom = Math.max(0.55, Math.min(14.0, viewRef.current.zoom * (dir > 0 ? 1.42 : 1 / 1.42)));
    animateTo(viewRef.current.lon, viewRef.current.lat, nextZoom, 240);
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: active ? 2 : 0,
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none',
        transition: 'opacity 0.25s ease',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'grab',
          touchAction: 'none'
        }}
      />

      {/* Subtle status / HD WebGL switcher badge when running Fast 3D Canvas Engine */}
      {active && (statusBadgeLabel || onTryHdWebgl) && (
        <div
          style={{
            position: 'absolute',
            top: isCompact ? '58px' : '12px',
            left: isCompact ? '10px' : '12px',
            zIndex: 18,
            background: 'var(--sov-panel-bg)',
            border: '1px solid var(--sov-border)',
            borderRadius: '7px',
            padding: '5px 10px',
            fontSize: '9px',
            fontFamily: 'var(--font-jetbrains-fallback)',
            color: 'var(--sov-text)',
            boxShadow: 'var(--sov-shadow)',
            backdropFilter: 'blur(10px)',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--sov-muted)' }}>
            🌐 {statusBadgeLabel || (isWarmingHd ? '3D GLOBE · LOADING HD TILES…' : '3D GLOBE · FAST ECO ENGINE')}
          </span>
          {onTryHdWebgl && !isWarmingHd && (
            <button
              type="button"
              onClick={onTryHdWebgl}
              style={{
                background: 'var(--sov-accent-soft)',
                border: '1px solid var(--sov-accent)',
                borderRadius: '4px',
                color: 'var(--sov-accent)',
                padding: '2px 7px',
                fontSize: '8.5px',
                fontFamily: 'var(--font-jetbrains-fallback)',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Try switching to Hardware WebGL HD Satellite Globe"
            >
              TRY HD WEBGL
            </button>
          )}
        </div>
      )}

      {/* Right-docked responsive 3D Globe zoom controls (clear of left Live Feed & mobile bottom dock) */}
      {active && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: isCompact ? '112px' : '54px',
            right: isCompact ? '10px' : '16px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: isCompact ? '5px' : '6px',
            background: 'var(--sov-panel-bg)',
            border: '1px solid var(--sov-border)',
            borderRadius: '9px',
            padding: isCompact ? '5px 7px' : '5px 9px',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontSize: '9.5px',
            color: 'var(--sov-muted)',
            boxShadow: 'var(--sov-shadow)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <span style={{ fontWeight: 800, letterSpacing: '0.06em', color: 'var(--sov-accent)' }}>
            {isCompact
              ? zoomLabel
              : `${isVectorMode ? `✦ ${(VECTOR_THEMES[vectorTheme]?.label || 'OBSIDIAN')}` : '3D VECTOR'} · ${zoomLabel}`}
          </span>
          {!isCompact && showSatellites && satellites.length > 0 && (
            <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#00f0ff', padding: '1px 5px', borderRadius: '4px', background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.3)' }}>
              🛰️ {satellites.length}
            </span>
          )}
          {!isCompact && weatherEnabled && (
            <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#38bdf8', padding: '1px 5px', borderRadius: '4px', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)' }}>
              🌧️ {radarTimeLabel || 'WX'}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleStepZoom(1)}
            style={{
              width: isCompact ? '28px' : '22px',
              height: isCompact ? '28px' : '22px',
              borderRadius: '5px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-text)',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: isCompact ? '14px' : '12px',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Zoom in 3D globe"
            title="Zoom in (+)"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleStepZoom(-1)}
            style={{
              width: isCompact ? '28px' : '22px',
              height: isCompact ? '28px' : '22px',
              borderRadius: '5px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-text)',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: isCompact ? '14px' : '12px',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Zoom out 3D globe"
            title="Zoom out (−)"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => animateTo(14.0, 20.0, 1.0, 420)}
            style={{
              padding: isCompact ? '0 8px' : '0 7px',
              height: isCompact ? '28px' : '22px',
              borderRadius: '5px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-accent)',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '8.5px'
            }}
            title="Reset 3D globe view"
          >
            RESET
          </button>
        </div>
      )}
    </div>
  );
}
