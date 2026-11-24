'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Exact Equal Earth pseudocylindrical equal-area projection
 * Reference: Bojan Šavrič, Tom Patterson & Bernhard Jenny (2018),
 * "The Equal Earth map projection", International Journal of Geographical Information Science.
 */
const EE_A1 = 1.340264;
const EE_A2 = -0.081106;
const EE_A3 = 0.000893;
const EE_A4 = 0.003796;
const EE_M = Math.sqrt(3) / 2; // cos(30°) = 0.8660254037844386
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function projectEqualEarth(lonDeg, latDeg) {
  const lam = Math.max(-Math.PI, Math.min(Math.PI, lonDeg * DEG2RAD));
  const phi = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, latDeg * DEG2RAD));
  const sinTheta = Math.max(-1, Math.min(1, EE_M * Math.sin(phi)));
  const theta = Math.asin(sinTheta);
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;

  const x =
    (lam * Math.cos(theta)) /
    (EE_M * (EE_A1 + 3 * EE_A2 * t2 + t6 * (7 * EE_A3 + 9 * EE_A4 * t2)));
  const y = theta * (EE_A1 + EE_A2 * t2 + t6 * (EE_A3 + EE_A4 * t2));
  return [x, y];
}

const [, EE_MAX_Y] = projectEqualEarth(0, 90);
const [EE_MAX_X] = projectEqualEarth(180, 0);

export function invertEqualEarth(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (Math.abs(y) > EE_MAX_Y + 1e-6) return null;

  let theta = y / EE_A1;
  for (let i = 0; i < 7; i++) {
    const t2 = theta * theta;
    const t6 = t2 * t2 * t2;
    const fy = theta * (EE_A1 + EE_A2 * t2 + t6 * (EE_A3 + EE_A4 * t2)) - y;
    const dfy = EE_A1 + 3 * EE_A2 * t2 + t6 * (7 * EE_A3 + 9 * EE_A4 * t2);
    const delta = fy / dfy;
    theta -= delta;
    if (Math.abs(delta) < 1e-11) break;
  }

  const sinPhi = Math.sin(theta) / EE_M;
  if (Math.abs(sinPhi) > 1 + 1e-6) return null;
  const phi = Math.asin(Math.max(-1, Math.min(1, sinPhi)));

  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  const cosTheta = Math.cos(theta);
  if (Math.abs(cosTheta) < 1e-9) return { lon: 0, lat: phi * RAD2DEG };

  const lam =
    (x * EE_M * (EE_A1 + 3 * EE_A2 * t2 + t6 * (7 * EE_A3 + 9 * EE_A4 * t2))) /
    cosTheta;
  if (Math.abs(lam) > Math.PI + 1e-4) return null;

  return {
    lon: Math.max(-180, Math.min(180, lam * RAD2DEG)),
    lat: Math.max(-90, Math.min(90, phi * RAD2DEG))
  };
}

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

// Precomputed Equal Earth outer silhouette + graticules (computed once per module load)
let STATIC_GRID_CACHE = null;
function getStaticEqualEarthGrid() {
  if (STATIC_GRID_CACHE) return STATIC_GRID_CACHE;

  const boundary = [];
  for (let lat = -90; lat <= 90; lat += 1.5) boundary.push(projectEqualEarth(180, lat));
  for (let lat = 90; lat >= -90; lat -= 1.5) boundary.push(projectEqualEarth(-180, lat));

  const parallels = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 4) pts.push(projectEqualEarth(lon, lat));
    parallels.push({ lat, isEquator: lat === 0, pts });
  }

  const meridians = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const pts = [];
    for (let lat = -88; lat <= 88; lat += 2.5) pts.push(projectEqualEarth(lon, lat));
    meridians.push({ lon, isPrime: lon === 0, pts });
  }

  STATIC_GRID_CACHE = { boundary, parallels, meridians };
  return STATIC_GRID_CACHE;
}

// Pre-projected country geometry cache
let PREPARED_COUNTRIES_CACHE = null;

function splitAntimeridianRing(coords) {
  if (!Array.isArray(coords) || coords.length < 3) return [];
  const rings = [];
  let current = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const cur = coords[i];
    if (Math.abs(cur[0] - prev[0]) > 180) {
      if (current.length >= 3) rings.push(current);
      current = [cur];
    } else {
      current.push(cur);
    }
  }
  if (current.length >= 3) rings.push(current);
  return rings;
}

function prepareCountries(geoJson) {
  if (PREPARED_COUNTRIES_CACHE) return PREPARED_COUNTRIES_CACHE;
  if (!geoJson?.features) return [];

  const prepared = geoJson.features.map((feature) => {
    const name = feature.properties?.name || 'Unknown';
    const rawPolys =
      feature.geometry?.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry?.type === 'MultiPolygon'
          ? feature.geometry.coordinates
          : [];

    const projectedRings = [];
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

      const subRings = splitAntimeridianRing(exterior);
      for (const ring of subRings) {
        let sumLon = 0;
        let sumLat = 0;
        let rMinLon = 180;
        let rMaxLon = -180;
        let rMinLat = 90;
        let rMaxLat = -90;
        const projPts = new Array(ring.length);

        for (let i = 0; i < ring.length; i++) {
          const lon = ring[i][0];
          const lat = ring[i][1];
          projPts[i] = projectEqualEarth(lon, lat);
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

        const approxArea =
          Math.max(0.01, rMaxLon - rMinLon) *
          Math.max(0.01, rMaxLat - rMinLat) *
          Math.max(0.15, Math.cos(((sumLat / ring.length) * Math.PI) / 180));
        totalArea += approxArea;

        if (approxArea > bestRingArea) {
          bestRingArea = approxArea;
          labelLon = sumLon / ring.length;
          labelLat = sumLat / ring.length;
        }
        projectedRings.push(projPts);
      }
    }

    const [labelX, labelY] = projectEqualEarth(labelLon, labelLat);
    return {
      feature,
      name,
      nameUpper: name === 'United States of America' ? 'UNITED STATES' : name === 'United Republic of Tanzania' ? 'TANZANIA' : name === 'Democratic Republic of the Congo' ? 'DR CONGO' : name.toUpperCase(),
      projectedRings,
      totalArea,
      labelX,
      labelY,
      bbox: { minLat, maxLat, minLon, maxLon }
    };
  });

  // Sort label priority largest-first
  prepared.sort((a, b) => b.totalArea - a.totalArea);
  PREPARED_COUNTRIES_CACHE = prepared;
  return prepared;
}

function pointInRingLonLat(lat, lon, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]; // lon
    const yi = ring[i][1]; // lat
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
  if (geom.type === 'Polygon') {
    return pointInRingLonLat(lat, lon, geom.coordinates[0]);
  }
  if (geom.type === 'MultiPolygon') {
    for (let k = 0; k < geom.coordinates.length; k++) {
      if (pointInRingLonLat(lat, lon, geom.coordinates[k][0])) return true;
    }
  }
  return false;
}

function distToSegmentSq(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy);
}

function getPalette(uiTheme, mapStyle) {
  const isLight = mapStyle === 'light' || (uiTheme === 'light' && mapStyle !== 'tactical' && mapStyle !== 'minimal' && mapStyle !== 'lights' && mapStyle !== 'satellite');
  if (isLight) {
    return {
      isLight: true,
      spaceBg: '#e2e8f0',
      oceanInner: '#dbeafe',
      oceanOuter: '#bfdbfe',
      limbStroke: '#93c5fd',
      graticule: 'rgba(51, 65, 85, 0.13)',
      equator: 'rgba(14, 116, 144, 0.26)',
      landFill: '#f8fafc',
      landHover: '#f1f5f9',
      landStroke: '#cbd5e1',
      selectedFill: 'rgba(2, 132, 199, 0.18)',
      selectedStroke: '#0284c7',
      labelColor: 'rgba(51, 65, 85, 0.72)',
      labelHalo: 'rgba(255, 255, 255, 0.88)',
      nodeStroke: '#0f172a',
      accent: '#0284c7'
    };
  }
  if (mapStyle === 'lights') {
    return {
      isLight: false,
      spaceBg: '#02040a',
      oceanInner: '#050b18',
      oceanOuter: '#020611',
      limbStroke: 'rgba(245, 158, 11, 0.35)',
      graticule: 'rgba(148, 163, 184, 0.09)',
      equator: 'rgba(245, 158, 11, 0.22)',
      landFill: '#0b1120',
      landHover: '#152038',
      landStroke: 'rgba(245, 158, 11, 0.28)',
      selectedFill: 'rgba(0, 240, 255, 0.20)',
      selectedStroke: '#00f0ff',
      labelColor: 'rgba(226, 232, 240, 0.65)',
      labelHalo: 'rgba(2, 6, 23, 0.9)',
      nodeStroke: '#ffffff',
      accent: '#00f0ff'
    };
  }
  if (uiTheme === 'emerald') {
    return {
      isLight: false,
      spaceBg: '#020a08',
      oceanInner: '#061a15',
      oceanOuter: '#03110e',
      limbStroke: 'rgba(16, 185, 129, 0.36)',
      graticule: 'rgba(52, 211, 153, 0.10)',
      equator: 'rgba(16, 185, 129, 0.26)',
      landFill: '#0c261f',
      landHover: '#12382e',
      landStroke: 'rgba(52, 211, 153, 0.26)',
      selectedFill: 'rgba(16, 185, 129, 0.24)',
      selectedStroke: '#34d399',
      labelColor: 'rgba(209, 250, 229, 0.62)',
      labelHalo: 'rgba(2, 10, 8, 0.9)',
      nodeStroke: '#ffffff',
      accent: '#34d399'
    };
  }
  if (uiTheme === 'cambridge') {
    return {
      isLight: false,
      spaceBg: '#060c18',
      oceanInner: '#0b192e',
      oceanOuter: '#071120',
      limbStroke: 'rgba(56, 189, 248, 0.36)',
      graticule: 'rgba(148, 163, 184, 0.11)',
      equator: 'rgba(56, 189, 248, 0.26)',
      landFill: '#15253f',
      landHover: '#1e3354',
      landStroke: 'rgba(148, 163, 184, 0.28)',
      selectedFill: 'rgba(56, 189, 248, 0.22)',
      selectedStroke: '#38bdf8',
      labelColor: 'rgba(226, 232, 240, 0.66)',
      labelHalo: 'rgba(6, 12, 24, 0.9)',
      nodeStroke: '#ffffff',
      accent: '#38bdf8'
    };
  }
  if (mapStyle === 'satellite') {
    return {
      isLight: false,
      spaceBg: '#020617',
      oceanInner: '#08203e',
      oceanOuter: '#041226',
      limbStroke: 'rgba(56, 189, 248, 0.42)',
      graticule: 'rgba(148, 163, 184, 0.11)',
      equator: 'rgba(56, 189, 248, 0.28)',
      landFill: '#162d29',
      landHover: '#1f3f39',
      landStroke: 'rgba(148, 163, 184, 0.28)',
      selectedFill: 'rgba(0, 240, 255, 0.22)',
      selectedStroke: '#00f0ff',
      labelColor: 'rgba(241, 245, 249, 0.72)',
      labelHalo: 'rgba(2, 6, 23, 0.9)',
      nodeStroke: '#ffffff',
      accent: '#00f0ff'
    };
  }
  // Default Tactical Dark / Minimal / Obsidian
  return {
    isLight: false,
    spaceBg: '#020617',
    oceanInner: '#071326',
    oceanOuter: '#030917',
    limbStroke: 'rgba(56, 189, 248, 0.34)',
    graticule: 'rgba(56, 189, 248, 0.09)',
    equator: 'rgba(0, 240, 255, 0.22)',
    landFill: mapStyle === 'minimal' ? '#0f172a' : '#111e33',
    landHover: '#192b47',
    landStroke: mapStyle === 'minimal' ? 'rgba(148, 163, 184, 0.16)' : 'rgba(56, 189, 248, 0.24)',
    selectedFill: 'rgba(0, 240, 255, 0.22)',
    selectedStroke: '#00f0ff',
    labelColor: mapStyle === 'minimal' ? 'rgba(148, 163, 184, 0.38)' : 'rgba(203, 213, 225, 0.64)',
    labelHalo: 'rgba(2, 6, 23, 0.92)',
    nodeStroke: '#ffffff',
    accent: '#00f0ff'
  };
}

export default function EqualEarthMap2D({
  active = false,
  layerCache = {},
  ensureCountriesGeoJson,
  repelledMarkers = [],
  eventsEnabled = true,
  showSatellites = false,
  satellites = [],
  selectedSatellite = null,
  onSatelliteClick = null,
  onPointClick = null,
  onCountrySelect = null,
  selectedCountry = null,
  onHoverTooltip = null,
  onInteraction = null,
  resetKey = 0,
  focusCoordinate = null,
  uiTheme = 'obsidian',
  mapStyle = 'tactical',
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
  regulationsUpdateTrigger = 0
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const viewRef = useRef({ zoom: 1.0, panX: 0, panY: 0 });
  const animFrameRef = useRef(null);
  const drawReqRef = useRef(null);
  const focusRingRef = useRef(null);
  const hoveredCountryRef = useRef(null);
  const interactivePointsRef = useRef([]);
  const interactiveSegmentsRef = useRef([]);

  const [countriesReady, setCountriesReady] = useState(0);
  const [overlayTick, setOverlayTick] = useState(0);
  const [storms, setStorms] = useState([]);
  const [zoomLabel, setZoomLabel] = useState('1.0x');

  const requestDraw = useCallback(() => {
    if (drawReqRef.current != null) return;
    drawReqRef.current = requestAnimationFrame(() => {
      drawReqRef.current = null;
      renderCanvas();
    });
  }, []);

  // Load countries GeoJSON once when 2D becomes active
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
        prepareCountries(geo);
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
      fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=25&category=severeStorms')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && Array.isArray(d?.events)) {
            setStorms(d.events);
          }
        })
        .catch(() => {});
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

  const animateToView = useCallback(
    (targetZoom, targetPanX, targetPanY, durationMs = 480) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const startZoom = viewRef.current.zoom;
      const startPanX = viewRef.current.panX;
      const startPanY = viewRef.current.panY;
      const t0 = performance.now();

      const step = (now) => {
        const p = Math.min(1, (now - t0) / durationMs);
        const ease = 1 - Math.pow(1 - p, 3);
        viewRef.current.zoom = startZoom + (targetZoom - startZoom) * ease;
        viewRef.current.panX = startPanX + (targetPanX - startPanX) * ease;
        viewRef.current.panY = startPanY + (targetPanY - startPanY) * ease;
        setZoomLabel(`${viewRef.current.zoom.toFixed(1)}x`);
        renderCanvas();
        if (p < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          animFrameRef.current = null;
        }
      };
      animFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Reset view on resetKey
  useEffect(() => {
    if (!active || resetKey <= 0) return;
    focusRingRef.current = null;
    animateToView(1.0, 0, 0, 420);
  }, [resetKey, active, animateToView]);

  // Smooth focus on Locate / coordinate selection
  useEffect(() => {
    if (!active || !focusCoordinate || focusCoordinate.lat == null || focusCoordinate.lon == null) return;
    const lat = Number(focusCoordinate.lat);
    const lon = Number(focusCoordinate.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const el = wrapperRef.current;
    if (!el) return;
    const w = el.clientWidth || 960;
    const h = el.clientHeight || 600;
    const baseScale = Math.min((w * 0.92) / (2 * EE_MAX_X), (h * 0.88) / (2 * EE_MAX_Y));
    const targetZoom = Math.max(viewRef.current.zoom, 4.6);
    const [px, py] = projectEqualEarth(lon, lat);
    const targetPanX = -px * baseScale * targetZoom;
    const targetPanY = py * baseScale * targetZoom;

    focusRingRef.current = { lat, lon, expiresAt: Date.now() + 6000 };
    animateToView(targetZoom, targetPanX, targetPanY, 560);

    const clearTimer = setTimeout(() => {
      focusRingRef.current = null;
      requestDraw();
    }, 6100);
    return () => clearTimeout(clearTimer);
  }, [focusCoordinate, active, animateToView, requestDraw]);

  // Core Canvas Renderer
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

    const palette = getPalette(uiTheme, mapStyle);
    ctx.fillStyle = palette.spaceBg;
    ctx.fillRect(0, 0, width, height);

    const baseScale = Math.min((width * 0.92) / (2 * EE_MAX_X), (height * 0.88) / (2 * EE_MAX_Y));
    const { zoom, panX, panY } = viewRef.current;
    const scale = baseScale * zoom;
    const cx = width * 0.5 + panX;
    const cy = height * 0.5 + panY;

    const toScreen = (ex, ey) => [cx + ex * scale, cy - ey * scale];
    const lonLatToScreen = (lon, lat) => {
      const [ex, ey] = projectEqualEarth(lon, lat);
      return [cx + ex * scale, cy - ey * scale];
    };

    const grid = getStaticEqualEarthGrid();

    // 1. Equal Earth Ocean Silhouette + Clip
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < grid.boundary.length; i++) {
      const [sx, sy] = toScreen(grid.boundary[i][0], grid.boundary[i][1]);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();

    const oceanGrad = ctx.createRadialGradient(
      cx,
      cy - EE_MAX_Y * scale * 0.12,
      scale * 0.15,
      cx,
      cy,
      EE_MAX_X * scale * 1.08
    );
    oceanGrad.addColorStop(0, palette.oceanInner);
    oceanGrad.addColorStop(1, palette.oceanOuter);
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    // Clip interior map artwork neatly inside Equal Earth limb
    ctx.clip();

    // 2. Equal Earth Graticules (Parallels & Meridians)
    for (const par of grid.parallels) {
      ctx.beginPath();
      for (let i = 0; i < par.pts.length; i++) {
        const [sx, sy] = toScreen(par.pts[i][0], par.pts[i][1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = par.isEquator ? palette.equator : palette.graticule;
      ctx.lineWidth = par.isEquator ? 1.1 : 0.75;
      ctx.stroke();
    }

    for (const mer of grid.meridians) {
      ctx.beginPath();
      for (let i = 0; i < mer.pts.length; i++) {
        const [sx, sy] = toScreen(mer.pts[i][0], mer.pts[i][1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = mer.isPrime ? palette.equator : palette.graticule;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }

    // 3. Country Polygons
    const countries = PREPARED_COUNTRIES_CACHE || [];
    const normSelected = (selectedCountry || '').trim().toLowerCase();
    const normHovered = (hoveredCountryRef.current || '').trim().toLowerCase();
    let selectedCountryItem = null;

    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(0.55, Math.min(1.25, 0.65 * Math.sqrt(zoom)));

    for (let c = 0; c < countries.length; c++) {
      const item = countries[c];
      const nameLower = item.name.toLowerCase();
      const isSel = normSelected && nameLower === normSelected;
      if (isSel) selectedCountryItem = item;
      const isHov = !isSel && normHovered && nameLower === normHovered;

      ctx.beginPath();
      for (let r = 0; r < item.projectedRings.length; r++) {
        const ring = item.projectedRings[r];
        for (let i = 0; i < ring.length; i++) {
          const [sx, sy] = toScreen(ring[i][0], ring[i][1]);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      }
      ctx.fillStyle = isHov ? palette.landHover : palette.landFill;
      ctx.fill();
      ctx.strokeStyle = palette.landStroke;
      ctx.stroke();
    }

    // Selected country crisp glow highlight on top of neighbor borders
    if (selectedCountryItem) {
      ctx.save();
      ctx.beginPath();
      for (let r = 0; r < selectedCountryItem.projectedRings.length; r++) {
        const ring = selectedCountryItem.projectedRings[r];
        for (let i = 0; i < ring.length; i++) {
          const [sx, sy] = toScreen(ring[i][0], ring[i][1]);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      }
      ctx.fillStyle = palette.selectedFill;
      ctx.fill();
      ctx.strokeStyle = palette.selectedStroke;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = palette.selectedStroke;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Optional Day / Night Solar Terminator Shading
    if (dayNightEnabled) {
      const now = new Date();
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
      const dayOfYear = (now - startOfYear) / 86400000;
      const subsolarLat = -23.44 * Math.cos(((2 * Math.PI) / 365.24) * (dayOfYear + 10));
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      const subsolarLon = ((12 - utcHours) * 15 + 540) % 360 - 180;
      const decRad = subsolarLat * DEG2RAD;
      const tanDec = Math.abs(Math.tan(decRad)) < 1e-4 ? 1e-4 : Math.tan(decRad);

      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 3) {
        const dLon = (lon - subsolarLon) * DEG2RAD;
        const termLat = Math.atan(-Math.cos(dLon) / tanDec) * RAD2DEG;
        const [sx, sy] = lonLatToScreen(lon, termLat);
        if (lon === -180) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      const nightPoleLat = subsolarLat >= 0 ? -90 : 90;
      for (let lon = 180; lon >= -180; lon -= 6) {
        const [sx, sy] = lonLatToScreen(lon, nightPoleLat);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = palette.isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(2, 6, 23, 0.42)';
      ctx.fill();
    }

    // 5. Country Labels (zoom-adaptive, non-overlapping)
    if (countries.length > 0 && mapStyle !== 'minimal') {
      const placedBoxes = [];
      const areaThreshold = zoom >= 5 ? 0.5 : zoom >= 2.8 ? 8 : zoom >= 1.7 ? 38 : 115;
      const fontSize = Math.round(Math.max(8.5, Math.min(11.5, 8.5 + Math.log2(Math.max(1, zoom)) * 0.9)));
      ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < countries.length; i++) {
        const c = countries[i];
        if (c.totalArea < areaThreshold && c !== selectedCountryItem) continue;
        if (c.name === 'Antarctica') continue;
        const [lx, ly] = toScreen(c.labelX, c.labelY);
        if (lx < 24 || lx > width - 24 || ly < 20 || ly > height - 20) continue;

        const wLabel = c.nameUpper.length * (fontSize * 0.62) + 10;
        const hLabel = fontSize + 6;
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

        ctx.lineWidth = 2.6;
        ctx.strokeStyle = palette.labelHalo;
        ctx.strokeText(c.nameUpper, lx, ly);
        ctx.fillStyle = c === selectedCountryItem ? palette.selectedStroke : palette.labelColor;
        ctx.fillText(c.nameUpper, lx, ly);
      }
    }

    // Reset hit-test registries for current frame
    const hitPoints = [];
    const hitSegments = [];

    const drawSegmentedLine = (coordsLonLat, color, lineW, alpha = 0.72, dashed = false, hitMeta = null) => {
      if (!Array.isArray(coordsLonLat) || coordsLonLat.length < 2) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineW;
      if (dashed) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      let prevLon = null;
      let prevSx = 0;
      let prevSy = 0;
      for (let i = 0; i < coordsLonLat.length; i++) {
        const lon = Number(coordsLonLat[i][0]);
        const lat = Number(coordsLonLat[i][1]);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        const [sx, sy] = lonLatToScreen(lon, lat);
        if (prevLon === null || Math.abs(lon - prevLon) > 150) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
          if (hitMeta) {
            hitSegments.push({ x1: prevSx, y1: prevSy, x2: sx, y2: sy, meta: hitMeta });
          }
        }
        prevLon = lon;
        prevSx = sx;
        prevSy = sy;
      }
      ctx.stroke();
      ctx.restore();
    };

    // 6A. Submarine Internet Cables & Landing Stations
    if (internetCablesEnabled) {
      const cablesGeo = layerCache.cables;
      (cablesGeo?.features || []).forEach((f) => {
        const g = f.geometry;
        const color = f.properties?.color || '#ec4899';
        const name = f.properties?.name || 'Undersea Fiber Optic Cable';
        const hitMeta = {
          kind: 'cable',
          tooltipType: 'cable',
          title: `⚓ ${name}`,
          details: { Type: 'Undersea Fiber Optic Cable' },
          payload: { id: f.properties?.id || name, title: name, isCable: true, category: 'Economic', severity: 2 }
        };
        if (g?.type === 'LineString') drawSegmentedLine(g.coordinates, color, 1.35, 0.62, false, hitMeta);
        else if (g?.type === 'MultiLineString') g.coordinates.forEach((c) => drawSegmentedLine(c, color, 1.35, 0.62, false, hitMeta));
      });

      const landingGeo = layerCache.landingStations;
      (landingGeo?.features || []).forEach((f) => {
        const c = f.geometry?.coordinates;
        if (!Array.isArray(c) || c.length < 2) return;
        const [sx, sy] = lonLatToScreen(c[0], c[1]);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        const name = f.properties?.name || 'Cable Landing Station';
        hitPoints.push({
          x: sx,
          y: sy,
          r: 6,
          priority: 2,
          tooltipType: 'landing_station',
          title: `🔌 ${name}`,
          details: { Type: 'Cable Landing Station' },
          payload: { id: name, title: name, lon: c[0], lat: c[1], isLandingStation: true, category: 'Economic', severity: 2 }
        });
      });
    }

    // 6B. Oil & Gas Pipelines + LNG/Refinery Plants
    if (oilGasEnabled && layerCache.oilGas) {
      const og = layerCache.oilGas;
      (og.lines || []).forEach((line) => {
        const title = line.project || 'Energy Pipeline';
        const hitMeta = {
          kind: 'oilgas',
          tooltipType: 'energy',
          title: `🛢️ ${title}`,
          details: {
            Type: String(line.type || 'Pipeline').replace(/_/g, ' '),
            Capacity: line.capacity || 'N/A',
            Countries: line.countries || 'Transnational'
          },
          payload: { id: title, title, isOilGas: true, category: 'Economic', severity: 2 }
        };
        drawSegmentedLine(line.coordinates, line.color || '#f97316', 1.6, 0.72, false, hitMeta);
      });

      (og.points || []).forEach((pt) => {
        if (!Array.isArray(pt.coordinate) || pt.coordinate.length < 2) return;
        const isLng = pt.facilityType === 'lng_terminal';
        const [sx, sy] = lonLatToScreen(pt.coordinate[0], pt.coordinate[1]);
        const r = isLng ? 4.2 : 4.8;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = pt.color || (isLng ? '#38bdf8' : '#f59e0b');
        ctx.fill();
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();

        hitPoints.push({
          x: sx,
          y: sy,
          r: r + 4,
          priority: 3,
          tooltipType: 'energy',
          title: `${isLng ? '⚓ ' : '🏭 '}${pt.name || 'Energy Facility'}`,
          details: {
            Facility: isLng ? 'LNG Terminal' : 'Oil Refinery',
            Operator: pt.operator || 'Operator',
            Capacity: pt.capacity || 'N/A',
            Country: pt.country || 'Global'
          },
          payload: {
            ...pt,
            title: pt.name || 'Energy Facility',
            lat: pt.coordinate[1],
            lon: pt.coordinate[0],
            location: pt.country || 'Global',
            isOilGas: true,
            category: 'Economic',
            severity: 2
          }
        });
      });
    }

    // 6C. GPS Jamming Corridors
    if (gpsJammingEnabled && layerCache.gpsJamming?.cells) {
      layerCache.gpsJamming.cells
        .filter((cell) => cell.category && cell.category !== 'none' && cell.intensity > 0)
        .forEach((cell) => {
          const kmPerDeg = 111.32;
          const dLat = (cell.radiusKm || 140) / kmPerDeg;
          const dLon = (cell.radiusKm || 140) / (kmPerDeg * Math.max(0.25, Math.cos(cell.lat * DEG2RAD)));
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = i * 60 * DEG2RAD;
            const [hx, hy] = lonLatToScreen(cell.lon + dLon * Math.cos(a), cell.lat + dLat * Math.sin(a));
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          const col = cell.color || '#ef4444';
          ctx.fillStyle = cell.category === 'high' ? 'rgba(239, 68, 68, 0.42)' : cell.category === 'medium' ? 'rgba(249, 115, 22, 0.30)' : 'rgba(250, 204, 21, 0.22)';
          ctx.fill();
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.1;
          ctx.stroke();

          const [cxCell, cyCell] = lonLatToScreen(cell.lon, cell.lat);
          hitPoints.push({
            x: cxCell,
            y: cyCell,
            r: Math.max(8, 12 * Math.sqrt(zoom)),
            priority: 3,
            tooltipType: 'gps',
            title: '📡 GPS Interference Corridor',
            details: {
              Region: cell.region || `${cell.lat.toFixed(1)}°, ${cell.lon.toFixed(1)}°`,
              Severity: String(cell.category).toUpperCase(),
              Degradation: `${Math.round((cell.intensity || 0) * 100)}%`
            },
            payload: {
              ...cell,
              title: cell.region || 'GPS Interference Corridor',
              location: cell.region || 'Contested Airspace',
              isGpsJamming: true,
              category: 'Conflict',
              severity: cell.category === 'high' ? 4 : 3
            }
          });
        });
    }

    // 6D. Weather Severe Storms (NASA EONET)
    if (weatherEnabled && storms.length > 0) {
      storms.forEach((ev) => {
        const latestGeo = Array.isArray(ev.geometry) ? ev.geometry[ev.geometry.length - 1] : null;
        const coords = latestGeo?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return;
        const [sx, sy] = lonLatToScreen(coords[0], coords[1]);
        ctx.beginPath();
        ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        hitPoints.push({
          x: sx,
          y: sy,
          r: 10,
          priority: 4,
          tooltipType: 'generic',
          title: `🌀 ${ev.title}`,
          details: {
            Source: 'NASA EONET Satellite Telemetry',
            Observed: String(latestGeo.date || 'Active').slice(0, 10)
          },
          payload: {
            id: ev.id || ev.title,
            title: ev.title,
            lat: coords[1],
            lon: coords[0],
            location: 'Active Storm Track',
            category: 'Disaster',
            severity: 3,
            url: ev.sources?.[0]?.url || 'https://eonet.gsfc.nasa.gov/'
          }
        });
      });
    }

    // 6E. Data Centers & Frontier AI Compute Clusters
    if (dataCentersEnabled && layerCache.dataCenters?.dataCenters) {
      const gridCounts = {};
      const selected = [];
      for (const dc of layerCache.dataCenters.dataCenters) {
        if (typeof dc.lat !== 'number' || typeof dc.lon !== 'number') continue;
        if (dc.isFrontierCluster) {
          selected.push(dc);
          continue;
        }
        const gk = `${Math.round(dc.lat / 0.65)},${Math.round(dc.lon / 0.65)}`;
        if ((gridCounts[gk] || 0) < 2 && selected.length < 750) {
          gridCounts[gk] = (gridCounts[gk] || 0) + 1;
          selected.push(dc);
        }
      }

      selected.forEach((dc) => {
        const isFrontier = Boolean(dc.isFrontierCluster || dc.status === 'planned');
        const [sx, sy] = lonLatToScreen(dc.lon, dc.lat);
        const r = isFrontier ? 6.0 : 3.8;
        ctx.beginPath();
        if (isFrontier) {
          ctx.moveTo(sx, sy - r - 1);
          ctx.lineTo(sx + r + 1, sy);
          ctx.lineTo(sx, sy + r + 1);
          ctx.lineTo(sx - r - 1, sy);
          ctx.closePath();
        } else {
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
        }
        ctx.fillStyle = isFrontier ? '#f59e0b' : '#0ea5e9';
        ctx.fill();
        ctx.lineWidth = isFrontier ? 1.5 : 1.0;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();

        const cleanLoc = [dc.city && !/^unknown$/i.test(dc.city) ? dc.city : '', dc.country || ''].filter(Boolean).join(', ');
        hitPoints.push({
          x: sx,
          y: sy,
          r: r + 4,
          priority: isFrontier ? 6 : 4,
          tooltipType: 'datacenter',
          title: `🏢 ${dc.name}`,
          details: {
            Operator: dc.operator || 'Independent',
            Location: cleanLoc || dc.country || 'Global',
            Status: String(dc.status || 'active').toUpperCase()
          },
          payload: {
            ...dc,
            isDataCenter: true,
            title: dc.name,
            location: cleanLoc || dc.country || 'Global'
          }
        });
      });
    }

    // 6F. Global AI Regulations
    if (aiRegulationsEnabled && layerCache.aiRegulations?.aiRegulations) {
      const regBuckets = {};
      layerCache.aiRegulations.aiRegulations.forEach((item) => {
        if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return;
        const bk = `${item.lat.toFixed(1)},${item.lon.toFixed(1)}`;
        const idx = regBuckets[bk] || 0;
        regBuckets[bk] = idx + 1;
        const angle = idx * 2.39996323;
        const rad = idx === 0 ? 0 : Math.min(0.32, 0.12 * Math.sqrt(idx));
        const pLat = item.lat + rad * Math.cos(angle);
        const pLon = item.lon + (rad * Math.sin(angle)) / Math.max(0.3, Math.cos(item.lat * DEG2RAD));
        const [sx, sy] = lonLatToScreen(pLon, pLat);
        const color = REG_COLORS[item.status] || '#8b5cf6';

        ctx.beginPath();
        ctx.arc(sx, sy, 5.2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();

        hitPoints.push({
          x: sx,
          y: sy,
          r: 9,
          priority: 5,
          tooltipType: 'regulation',
          title: `⚖️ ${item.title}`,
          details: {
            Jurisdiction: item.jurisdiction || 'Global',
            Status: String(item.status || 'Policy').toUpperCase(),
            Area: item.area || 'General',
            'Proposed/Effective': item.date || 'Active'
          },
          payload: { ...item, isAiRegulation: true }
        });
      });
    }

    // 6G. Five AI Ethics & Society Overlays
    if (censorshipEnabled && layerCache.censorship?.items) {
      layerCache.censorship.items.forEach((item) => {
        if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return;
        const [sx, sy] = lonLatToScreen(item.lon, item.lat);
        const r = 4.8 + Math.min(3.5, (item.severity || 2) * 0.7);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = item.color || '#f43f5e';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();

        hitPoints.push({
          x: sx,
          y: sy,
          r: r + 4,
          priority: 6,
          tooltipType: 'regulation',
          title: `🔒 ${item.title || item.country}`,
          details: {
            Country: item.country || 'Global',
            'Confirmed Blocks': Number(item.confirmedBlocks || 0).toLocaleString(),
            'Disruption Rate': `${item.blockRatePct || 0}%`
          },
          payload: { ...item, isEthicsOverlay: true, ethicsKind: item.ethicsKind || 'censorship' }
        });
      });
    }

    const ethicsList = [
      { on: envJusticeEnabled, key: 'environmental', kind: 'environmental', icon: '💧', cat: 'Disaster' },
      { on: supplyChainEnabled, key: 'supplyChain', kind: 'supply_chain', icon: '🪨', cat: 'Economic' },
      { on: biometricWelfareEnabled, key: 'biometricWelfare', kind: 'biometric_welfare', icon: '👁️', cat: 'Humanitarian' },
      { on: aiLaborEnabled, key: 'aiLabor', kind: 'ai_labor', icon: '⚖️', cat: 'Humanitarian' }
    ];

    ethicsList.forEach(({ on, key, kind, icon, cat }) => {
      if (!on || !layerCache[key]) return;
      const data = layerCache[key];
      (data.arcs || []).forEach((arc) => {
        if (Array.isArray(arc.from) && Array.isArray(arc.to)) {
          // arc.from / arc.to are [lat, lon]
          const seg = [];
          const steps = 24;
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const lat = arc.from[0] + (arc.to[0] - arc.from[0]) * t;
            const lon = arc.from[1] + (arc.to[1] - arc.from[1]) * t;
            seg.push([lon, lat]);
          }
          drawSegmentedLine(seg, arc.color || '#f59e0b', 1.5, 0.65, true, {
            kind: 'supply_arc',
            tooltipType: 'regulation',
            title: `🪨 ${arc.name || 'AI Supply Chain Corridor'}`,
            details: { Flow: arc.stage || 'Semiconductor Chokepoint' },
            payload: null
          });
        }
      });

      (data.items || []).forEach((pt) => {
        if (typeof pt.lat !== 'number' || typeof pt.lon !== 'number') return;
        const [sx, sy] = lonLatToScreen(pt.lon, pt.lat);
        ctx.beginPath();
        ctx.arc(sx, sy, 5.8, 0, Math.PI * 2);
        ctx.fillStyle = pt.color || '#a855f7';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();

        hitPoints.push({
          x: sx,
          y: sy,
          r: 9.5,
          priority: 6,
          tooltipType: 'regulation',
          title: `${icon} ${pt.name}`,
          details: {
            Country: pt.country || 'Global',
            ...(pt.metricLabel ? { [pt.metricLabel]: pt.metricValue || 'Verified' } : {}),
            Source: pt.source || 'Observatory'
          },
          payload: {
            ...pt,
            title: pt.name,
            location: pt.country || 'Global',
            category: cat,
            ethicsKind: pt.ethicsKind || kind,
            isEthicsOverlay: true
          }
        });
      });
    });

    // 6H. Temporal Replay Milestones (2020-2026)
    if (temporalReplayActive && Array.isArray(temporalMilestones)) {
      temporalMilestones.forEach((m) => {
        if (typeof m.lat !== 'number' || typeof m.lon !== 'number') return;
        const [sx, sy] = lonLatToScreen(m.lon, m.lat);
        const tColor = m.track === 'law' ? '#10b981' : m.track === 'institute' ? '#a855f7' : '#f59e0b';
        const r = m.powerMw ? Math.min(10, 5 + Math.sqrt(m.powerMw) * 0.16) : 6.0;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = tColor;
        ctx.fill();
        ctx.lineWidth = m.isPostBaseline ? 2.2 : 1.4;
        ctx.strokeStyle = m.isPostBaseline ? '#00f0ff' : '#0f172a';
        ctx.stroke();

        hitPoints.push({
          x: sx,
          y: sy,
          r: r + 4,
          priority: 7,
          tooltipType: 'regulation',
          title: `[${m.date}] ${m.title}`,
          details: {
            'Milestone Date': m.date,
            Track: String(m.track || 'law').toUpperCase(),
            Location: m.location || 'Global',
            ...(m.powerMw ? { 'Compute Load': `${m.powerMw} MW` } : {})
          },
          payload: { ...m, isTemporalMilestone: true }
        });
      });
    }

    // 7. Primary Spaced Policy & Threat Event Nodes (repelledMarkers)
    if (eventsEnabled && Array.isArray(repelledMarkers)) {
      for (let i = 0; i < repelledMarkers.length; i++) {
        const m = repelledMarkers[i];
        const lat = m.repelledLat ?? m.lat;
        const lon = m.repelledLon ?? m.lon;
        if (lat == null || lon == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) continue;

        const [sx, sy] = lonLatToScreen(Number(lon), Number(lat));
        const sev = Number(m.severity) || 2;
        const sevColor = SEV_COLORS[sev] || '#ff2d55';
        const r = Math.min(4.2 + sev * 0.88, 8.8);
        const isManual = String(m.id || '').startsWith('evt-');

        // Critical S5 outer halo ring
        if (sev >= 5) {
          ctx.beginPath();
          ctx.arc(sx, sy, r + 5.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 45, 85, 0.16)';
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(255, 45, 85, 0.78)';
          ctx.stroke();
        }

        // Grounding shadow ring
        ctx.beginPath();
        ctx.arc(sx, sy, r + 1.8, 0, Math.PI * 2);
        ctx.fillStyle = palette.isLight ? 'rgba(15, 23, 42, 0.28)' : 'rgba(2, 6, 23, 0.55)';
        ctx.fill();

        // Main node circle
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = sevColor;
        ctx.fill();
        ctx.lineWidth = isManual ? 2.2 : 1.5;
        ctx.strokeStyle = isManual ? '#00f0ff' : palette.isLight ? '#0f172a' : '#ffffff';
        ctx.stroke();

        hitPoints.push({
          x: sx,
          y: sy,
          r: Math.max(9, r + 4),
          priority: 8,
          tooltipType: 'event',
          title: m.title || m.name || 'Policy Signal',
          details: {
            Location: String(m.location || 'Global'),
            Domain: String(m.details?.domainPillar || m.category || 'Tech Policy'),
            Severity: `S${sev}`,
            ...(m.source ? { Source: String(m.source) } : {})
          },
          payload: m
        });
      }
    }

    // 8. Live Orbiting Satellites + Selected Ground Track
    if (showSatellites && Array.isArray(satellites) && satellites.length > 0) {
      if (selectedSatellite) {
        const incRad = ((selectedSatellite.inclination || 53) * Math.PI) / 180;
        const satLatRad = ((selectedSatellite.latitude || 0) * Math.PI) / 180;
        const sinThetaSat = Math.max(-1, Math.min(1, Math.sin(satLatRad) / (Math.sin(incRad) || 0.001)));
        const thetaSat = Math.asin(sinThetaSat);
        const lonOrbitSat = Math.atan2(Math.cos(incRad) * Math.sin(thetaSat), Math.cos(thetaSat));
        const raanEff = (selectedSatellite.longitude || 0) - (lonOrbitSat * 180) / Math.PI;

        const trackCoords = [];
        for (let deg = 0; deg <= 360; deg += 3) {
          const th = (deg * Math.PI) / 180;
          const lat = (Math.asin(Math.sin(incRad) * Math.sin(th)) * 180) / Math.PI;
          let lon = (Math.atan2(Math.cos(incRad) * Math.sin(th), Math.cos(th)) * 180) / Math.PI + raanEff;
          lon = ((lon + 540) % 360) - 180;
          trackCoords.push([lon, lat]);
        }
        drawSegmentedLine(trackCoords, '#00f0ff', 1.8, 0.78, true, null);
      }

      satellites.forEach((sat) => {
        if (!Number.isFinite(Number(sat.latitude)) || !Number.isFinite(Number(sat.longitude))) return;
        const [sx, sy] = lonLatToScreen(Number(sat.longitude), Number(sat.latitude));
        const isSel = selectedSatellite && selectedSatellite.code === sat.code;
        const satColor = MISSION_COLORS[sat.missionType] || '#38bdf8';

        // Soft category backlight (no opaque circle or border ring)
        const glowR = isSel ? 18 : 13;
        const grad = ctx.createRadialGradient(sx, sy, 1, sx, sy, glowR);
        grad.addColorStop(0, `${satColor}aa`);
        grad.addColorStop(0.5, `${satColor}38`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `${isSel ? 19 : 15}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛰️', sx, sy + 0.5);

        if (isSel) {
          ctx.font = '700 10px monospace';
          const tw = ctx.measureText(sat.name).width + 12;
          ctx.fillStyle = 'rgba(11, 19, 43, 0.88)';
          ctx.fillRect(sx - tw / 2, sy - 25, tw, 15);
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(sat.name, sx, sy - 17.5);
        }

        hitPoints.push({
          x: sx,
          y: sy,
          r: isSel ? 16 : 12,
          priority: 10,
          isSatellite: true,
          tooltipType: 'generic',
          title: `🛰️ ${sat.name}`,
          details: {
            Operator: sat.operator || sat.country || 'Space Agency',
            'Orbit / NORAD': `${sat.orbitRegime || 'LEO'} · #${sat.code}`,
            Altitude: `${sat.altitude} km`,
            Velocity: `${sat.velocity} km/s`
          },
          payload: sat
        });
      });
    }

    // 9. Focus Coordinate Target Reticle
    if (focusRingRef.current && focusRingRef.current.expiresAt > Date.now()) {
      const [fx, fy] = lonLatToScreen(focusRingRef.current.lon, focusRingRef.current.lat);
      ctx.save();
      ctx.beginPath();
      ctx.arc(fx, fy, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = palette.accent;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fx - 24, fy);
      ctx.lineTo(fx - 12, fy);
      ctx.moveTo(fx + 12, fy);
      ctx.lineTo(fx + 24, fy);
      ctx.moveTo(fx, fy - 24);
      ctx.lineTo(fx, fy - 12);
      ctx.moveTo(fx, fy + 12);
      ctx.lineTo(fx, fy + 24);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end clip

    // 10. Crisp Equal Earth Outer Limb Outline
    ctx.beginPath();
    for (let i = 0; i < grid.boundary.length; i++) {
      const [sx, sy] = toScreen(grid.boundary[i][0], grid.boundary[i][1]);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.strokeStyle = palette.limbStroke;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.restore();

    interactivePointsRef.current = hitPoints;
    interactiveSegmentsRef.current = hitSegments;
  }

  // Re-render whenever relevant state/props change
  useEffect(() => {
    if (!active) return;
    renderCanvas();
  }, [
    active,
    countriesReady,
    overlayTick,
    storms,
    repelledMarkers,
    eventsEnabled,
    showSatellites,
    satellites,
    selectedSatellite,
    selectedCountry,
    uiTheme,
    mapStyle,
    dayNightEnabled,
    weatherEnabled,
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
    temporalMilestones
  ]);

  // ResizeObserver for crisp layout transitions (e.g. feed or AI drawer opening)
  useEffect(() => {
    if (!active || typeof window === 'undefined' || !wrapperRef.current) return;
    const ro = new ResizeObserver(() => requestDraw());
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [active, requestDraw]);

  const screenToLonLat = useCallback((sx, sy) => {
    const el = wrapperRef.current;
    if (!el) return null;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    const baseScale = Math.min((w * 0.92) / (2 * EE_MAX_X), (h * 0.88) / (2 * EE_MAX_Y));
    const scale = baseScale * viewRef.current.zoom;
    const cx = w * 0.5 + viewRef.current.panX;
    const cy = h * 0.5 + viewRef.current.panY;
    const ex = (sx - cx) / scale;
    const ey = (cy - sy) / scale;
    return invertEqualEarth(ex, ey);
  }, []);

  const findHitAt = useCallback((sx, sy) => {
    const pts = interactivePointsRef.current;
    let bestPt = null;
    let bestScore = Infinity;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const dx = sx - p.x;
      const dy = sy - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= p.r * p.r) {
        const score = Math.sqrt(d2) - p.priority * 100;
        if (score < bestScore) {
          bestScore = score;
          bestPt = p;
        }
      }
    }
    if (bestPt) return { type: 'point', item: bestPt };

    const segs = interactiveSegmentsRef.current;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (distToSegmentSq(sx, sy, s.x1, s.y1, s.x2, s.y2) <= 36) {
        return { type: 'segment', item: s.meta };
      }
    }
    return null;
  }, []);

  // Mouse & Touch Pan/Zoom/Hover/Click Interaction
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    let dragging = false;
    let movedPx = 0;
    let lastX = 0;
    let lastY = 0;
    let pinchDist = null;
    let lastHoverMove = 0;

    const clampPan = () => {
      const w = wrapper.clientWidth || 800;
      const h = wrapper.clientHeight || 600;
      const maxX = w * 0.46 * viewRef.current.zoom;
      const maxY = h * 0.44 * viewRef.current.zoom;
      viewRef.current.panX = Math.max(-maxX, Math.min(maxX, viewRef.current.panX));
      viewRef.current.panY = Math.max(-maxY, Math.min(maxY, viewRef.current.panY));
    };

    const zoomAround = (factor, anchorX, anchorY) => {
      const w = wrapper.clientWidth || 800;
      const h = wrapper.clientHeight || 600;
      const prevZoom = viewRef.current.zoom;
      const nextZoom = Math.max(0.92, Math.min(22.0, prevZoom * factor));
      if (Math.abs(nextZoom - prevZoom) < 1e-4) return;

      const ratio = nextZoom / prevZoom;
      const dx = anchorX - (w * 0.5 + viewRef.current.panX);
      const dy = anchorY - (h * 0.5 + viewRef.current.panY);
      viewRef.current.panX -= dx * (ratio - 1);
      viewRef.current.panY -= dy * (ratio - 1);
      viewRef.current.zoom = nextZoom;
      clampPan();
      setZoomLabel(`${nextZoom.toFixed(1)}x`);
      requestDraw();
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (onInteraction) onInteraction();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = Math.max(-180, Math.min(180, e.deltaY));
      const factor = Math.exp(-delta * 0.0022);
      zoomAround(factor, mx, my);
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      dragging = true;
      movedPx = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      if (onInteraction) onInteraction();
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        movedPx += Math.abs(dx) + Math.abs(dy);
        viewRef.current.panX += dx;
        viewRef.current.panY += dy;
        clampPan();
        canvas.style.cursor = 'grabbing';
        if (onHoverTooltip) {
          onHoverTooltip({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
        }
        requestDraw();
        return;
      }

      const now = performance.now();
      if (now - lastHoverMove < 32) return;
      lastHoverMove = now;

      const hit = findHitAt(sx, sy);
      if (hit) {
        canvas.style.cursor = 'pointer';
        if (hoveredCountryRef.current) {
          hoveredCountryRef.current = null;
          requestDraw();
        }
        if (onHoverTooltip) {
          const item = hit.item;
          onHoverTooltip({
            show: true,
            x: sx,
            y: sy,
            content: item.title,
            type: item.tooltipType || 'generic',
            title: item.title,
            details: item.details || null
          });
        }
        return;
      }

      if (onHoverTooltip) {
        onHoverTooltip({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
      }

      const geoPt = screenToLonLat(sx, sy);
      let nextHoveredCountry = null;
      if (geoPt && PREPARED_COUNTRIES_CACHE) {
        for (let i = 0; i < PREPARED_COUNTRIES_CACHE.length; i++) {
          if (isPointInFeature(geoPt.lat, geoPt.lon, PREPARED_COUNTRIES_CACHE[i])) {
            nextHoveredCountry = PREPARED_COUNTRIES_CACHE[i].name;
            break;
          }
        }
      }
      canvas.style.cursor = nextHoveredCountry ? 'pointer' : geoPt ? 'grab' : 'default';
      if (hoveredCountryRef.current !== nextHoveredCountry) {
        hoveredCountryRef.current = nextHoveredCountry;
        requestDraw();
      }
    };

    const onMouseUp = (e) => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = 'grab';
      if (movedPx > 6) return;

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const hit = findHitAt(sx, sy);
      if (hit) {
        if (hit.type === 'point') {
          if (hit.item.isSatellite && onSatelliteClick) {
            onSatelliteClick(hit.item.payload);
          } else if (hit.item.payload && onPointClick) {
            onPointClick(hit.item.payload);
          }
        } else if (hit.type === 'segment' && hit.item.payload && onPointClick) {
          onPointClick(hit.item.payload);
        }
        return;
      }

      const geoPt = screenToLonLat(sx, sy);
      if (geoPt && PREPARED_COUNTRIES_CACHE && onCountrySelect) {
        for (let i = 0; i < PREPARED_COUNTRIES_CACHE.length; i++) {
          if (isPointInFeature(geoPt.lat, geoPt.lon, PREPARED_COUNTRIES_CACHE[i])) {
            onCountrySelect(PREPARED_COUNTRIES_CACHE[i].name);
            return;
          }
        }
      }
    };

    const onDblClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      zoomAround(1.75, e.clientX - rect.left, e.clientY - rect.top);
    };

    const onMouseLeave = () => {
      dragging = false;
      if (hoveredCountryRef.current) {
        hoveredCountryRef.current = null;
        requestDraw();
      }
      if (onHoverTooltip) {
        onHoverTooltip({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
      }
    };

    const onTouchStart = (e) => {
      if (onInteraction) onInteraction();
      if (e.touches.length === 1) {
        dragging = true;
        movedPx = 0;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        pinchDist = null;
      } else if (e.touches.length === 2) {
        dragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDist = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1 && dragging) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        movedPx += Math.abs(dx) + Math.abs(dy);
        viewRef.current.panX += dx;
        viewRef.current.panY += dy;
        clampPan();
        requestDraw();
      } else if (e.touches.length === 2 && pinchDist) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const nextDist = Math.hypot(dx, dy);
        if (nextDist > 8) {
          const rect = canvas.getBoundingClientRect();
          const cxMid = (e.touches[0].clientX + e.touches[1].clientX) * 0.5 - rect.left;
          const cyMid = (e.touches[0].clientY + e.touches[1].clientY) * 0.5 - rect.top;
          zoomAround(nextDist / pinchDist, cxMid, cyMid);
          pinchDist = nextDist;
        }
      }
    };

    const onTouchEnd = (e) => {
      if (dragging && movedPx <= 8 && e.changedTouches?.length === 1) {
        const rect = canvas.getBoundingClientRect();
        const sx = e.changedTouches[0].clientX - rect.left;
        const sy = e.changedTouches[0].clientY - rect.top;
        const hit = findHitAt(sx, sy);
        if (hit?.type === 'point') {
          if (hit.item.isSatellite && onSatelliteClick) onSatelliteClick(hit.item.payload);
          else if (hit.item.payload && onPointClick) onPointClick(hit.item.payload);
        } else {
          const geoPt = screenToLonLat(sx, sy);
          if (geoPt && PREPARED_COUNTRIES_CACHE && onCountrySelect) {
            for (let i = 0; i < PREPARED_COUNTRIES_CACHE.length; i++) {
              if (isPointInFeature(geoPt.lat, geoPt.lon, PREPARED_COUNTRIES_CACHE[i])) {
                onCountrySelect(PREPARED_COUNTRIES_CACHE[i].name);
                break;
              }
            }
          }
        }
      }
      dragging = false;
      pinchDist = null;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [active, findHitAt, onCountrySelect, onHoverTooltip, onInteraction, onPointClick, onSatelliteClick, requestDraw, screenToLonLat]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        zIndex: active ? 2 : 1,
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none',
        transition: 'opacity 0.22s ease',
        userSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label="Equal Earth 2D Global Map"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          touchAction: 'none'
        }}
      />

      {active && (
        <div
          style={{
            position: 'absolute',
            bottom: '54px',
            left: '16px',
            zIndex: 6,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--sov-panel-bg)',
            border: '1px solid var(--sov-border)',
            borderRadius: '7px',
            padding: '4px 8px',
            boxShadow: 'var(--sov-shadow)',
            backdropFilter: 'blur(8px)',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontSize: '9.5px',
            color: 'var(--sov-muted)'
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--sov-accent)', letterSpacing: '0.04em' }}>EQUAL EARTH</span>
          <span>·</span>
          <span>{zoomLabel}</span>
          <button
            type="button"
            onClick={() => {
              const nextZ = Math.min(22, viewRef.current.zoom * 1.45);
              animateToView(nextZ, viewRef.current.panX * (nextZ / viewRef.current.zoom), viewRef.current.panY * (nextZ / viewRef.current.zoom), 220);
            }}
            title="Zoom in"
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              color: 'var(--sov-text)',
              borderRadius: '4px',
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '12px',
              lineHeight: 1
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              const nextZ = Math.max(0.95, viewRef.current.zoom / 1.45);
              animateToView(nextZ, viewRef.current.panX * (nextZ / viewRef.current.zoom), viewRef.current.panY * (nextZ / viewRef.current.zoom), 220);
            }}
            title="Zoom out"
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              color: 'var(--sov-text)',
              borderRadius: '4px',
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '12px',
              lineHeight: 1
            }}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => animateToView(1.0, 0, 0, 320)}
            title="Reset Equal Earth view"
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              color: 'var(--sov-accent)',
              borderRadius: '4px',
              padding: '0 6px',
              height: '20px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '9px'
            }}
          >
            RESET
          </button>
        </div>
      )}
    </div>
  );
}
