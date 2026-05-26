'use client';
import { useEffect, useRef, useState, useMemo } from 'react';

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
  const cacheKey = `circle-${color}-${size}-${outlineColor}-${outlineWidth}`;
  if (canvasCache[cacheKey]) return canvasCache[cacheKey];

  const canvas = document.createElement('canvas');
  // Add padding for outline border and shadow
  const totalSize = size + outlineWidth * 2 + 4;
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext('2d');
  
  const center = totalSize / 2;
  const radius = size / 2;
  
  // Shadow/glow styling
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  
  // Outline
  ctx.shadowColor = 'transparent'; // Turn off shadow for outline
  ctx.shadowBlur = 0;
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outlineColor;
  ctx.stroke();
  
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

const getLeafletTileUrl = (style) => {
  if (style === 'tactical' || style === 'dark') {
    return {
      url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
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

export default function CesiumGlobe({ 
  displayedMarkers = [], 
  onPointClick = null, 
  mapMode = '2d', 
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
  selectedCountry = null,
  onCountrySelect = null
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const tilesetRef = useRef(null);
  const petroleumLayerRef = useRef(null);
  const powerLayerRef = useRef(null);
  const cableEntitiesRef = useRef([]);
  const oilGasEntitiesRef = useRef([]);
  const gpsJammingEntitiesRef = useRef([]);
  const dataCenterEntitiesRef = useRef([]);
  const aiRegulationsEntitiesRef = useRef([]);
  const lastPickedFeatureRef = useRef(null);
  const selectionEntityRef = useRef(null);
  const lastRepelledMarkersJsonRef = useRef('');
  const lastSelectedSatJsonRef = useRef('');

  // Interactive Country Border Highlights Refs (In-Memory PIP Optimized)
  const countriesGeoJsonRef = useRef(null);
  const selectedCountryEntitiesRef = useRef([]);
  const leafletSelectedLayerRef = useRef(null);

  // Pre-fetch world borders GeoJSON into memory ref on startup (under 1ms, 0MB WebGL overhead!)
  useEffect(() => {
    fetch('/data/countries.geo.json')
      .then(res => res.json())
      .then(data => {
        countriesGeoJsonRef.current = data;
        console.log("Sovereign country borders loaded into memory ref successfully.");
      })
      .catch(err => {
        console.warn("Failed to pre-fetch countries GeoJSON:", err);
      });
  }, []);

  const [mapError, setMapError] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const is2DActive = mapError;

  const [hoverTooltip, setHoverTooltip] = useState({ show: false, x: 0, y: 0, content: '', type: 'generic', title: '', details: null });
  const setHoverTooltipRef = useRef(setHoverTooltip);
  useEffect(() => {
    setHoverTooltipRef.current = setHoverTooltip;
  }, [setHoverTooltip]);

  const [leafletAiRegulations, setLeafletAiRegulations] = useState([]);
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

  // Fetch AI regulations for Leaflet fallback when 3D is error/disabled
  useEffect(() => {
    if (!mapError || !aiRegulationsEnabled || !scriptsLoaded) {
      setLeafletAiRegulations([]);
      return;
    }
    fetch('/api/ai-regulations')
      .then(res => {
        if (!res.ok) throw new Error("AI Regulations data request failed");
        return res.json();
      })
      .then(data => {
        if (data && data.aiRegulations) {
          setLeafletAiRegulations(data.aiRegulations);
        }
      })
      .catch(err => {
        console.warn("Failed to load Leaflet AI regulations:", err);
      });
  }, [aiRegulationsEnabled, mapError, scriptsLoaded, regulationsUpdateTrigger]);

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
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Direct check if both scripts are already initialized globally
    if (window.Cesium && window.L) {
      setScriptsLoaded(true);
      return;
    }

    let isMounted = true;

    const loadStyles = () => {
      const styles = [
        { id: 'leaflet-css-pkg', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' },
        { id: 'cesium-css-pkg', href: 'https://cdn.jsdelivr.net/npm/cesium@1.115.0/Build/Cesium/Widgets/widgets.css' }
      ];
      styles.forEach(s => {
        if (!document.getElementById(s.id)) {
          const link = document.createElement('link');
          link.id = s.id;
          link.rel = 'stylesheet';
          link.href = s.href;
          link.crossOrigin = '';
          document.head.appendChild(link);
        }
      });
    };

    const loadScripts = async () => {
      loadStyles();

      const loadScript = (src, id) => {
        return new Promise((resolve, reject) => {
          if (document.getElementById(id)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.id = id;
          script.src = src;
          script.async = true;
          script.crossOrigin = '';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Script load failed: ${src}`));
          document.head.appendChild(script);
        });
      };

      try {
        // Load Leaflet first (sequential to prevent overlaps)
        await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'leaflet-js-pkg');
        // Load Cesium next
        await loadScript('https://cdn.jsdelivr.net/npm/cesium@1.115.0/Build/Cesium/Cesium.js', 'cesium-js-pkg');

        if (isMounted) {
          setScriptsLoaded(true);
        }
      } catch (err) {
        console.error("External mapping assets failed to load:", err);
        if (isMounted) {
          setMapError(true);
        }
      }
    };

    loadScripts();

    return () => {
      isMounted = false;
    };
  }, []);

  const [viewerReady, setViewerReady] = useState(false);
  const [tilesetLoaded, setTilesetLoaded] = useState(false);
  const [tilesetLoadingStatus, setTilesetLoadingStatus] = useState('idle'); // 'idle', 'loading', 'loaded', 'error'
  const [showLegend, setShowLegend] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedSkyscraper, setSelectedSkyscraper] = useState(null);
  const selectedSkyscraperRef = useRef(null);
  useEffect(() => {
    selectedSkyscraperRef.current = selectedSkyscraper;
  }, [selectedSkyscraper]);

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

  // 4. Buttery smooth auto rotation of the globe / cinematic skyscraper orbit
  useEffect(() => {
    if (!scriptsLoaded || !viewerRef.current || mapError || !viewerReady) return;

    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    let lastTime = performance.now();
    let listener;
    let wasOrbiting = false;

    const postRenderHandler = (scene, time) => {
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000.0;
      lastTime = currentTime;

      if (isOrbitingRef.current && selectedSkyscraperRef.current) {
        wasOrbiting = true;
        const landmark = selectedSkyscraperRef.current;
        const centerPosition = Cesium.Cartesian3.fromDegrees(landmark.lon, landmark.lat, landmark.height / 2);
        
        orbitAngleRef.current += 0.25 * delta;
        const range = Math.max(landmark.height * 1.6, 350);
        const heading = orbitAngleRef.current;
        const pitch = Cesium.Math.toRadians(-28.0);
        
        const hpr = new Cesium.HeadingPitchRange(heading, pitch, range);
        viewer.camera.lookAt(centerPosition, hpr);
      } else {
        if (wasOrbiting) {
          try {
            viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          } catch (e) {}
          wasOrbiting = false;
        }
        if (autoRotate) {
          const rotationSpeed = 0.035; 
          viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, rotationSpeed * delta);
        }
      }
    };

    listener = viewer.scene.postRender.addEventListener(postRenderHandler);

    return () => {
      if (listener && viewer && viewer.scene && !viewer.isDestroyed()) {
        try {
          viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          viewer.scene.postRender.removeEventListener(postRenderHandler);
        } catch (e) {}
      }
    };
  }, [autoRotate, mapError, viewerReady, scriptsLoaded]);

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

  // 4c. Proximity scanner: detects when camera is looking close to a famous landmark in screen-space
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current || !viewerReady) {
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
    const interval = setInterval(checkProximity, 1000);

    return () => {
      active = false;
      if (removeListener) removeListener();
      clearInterval(interval);
    };
  }, [viewerReady, scriptsLoaded, mapError]);

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
    
    // Create mutable copy of displayed markers with lat/lon coordinates
    const points = displayedMarkers.map((m, idx) => ({
      original: m,
      lat: m.lat !== undefined && m.lat !== null ? m.lat : 0.0,
      lon: m.lon !== undefined && m.lon !== null ? m.lon : 0.0,
      index: idx
    }));

    const gravity = 0.08; // Gravity pulls markers back to their real origins (softer to let them spread!)
    const repelForce = 0.38; // Repulsion pushes close markers apart (stronger push!)
    const thresholdDegrees = 0.95; // Spacing threshold in degrees (perfectly spaced out!)
    const iterations = 12; // Force resolution passes

    for (let step = 0; step < iterations; step++) {
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        let forceLat = 0;
        let forceLon = 0;

        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          const p2 = points[j];
          
          const dLat = p1.lat - p2.lat;
          const dLon = p1.lon - p2.lon;
          const dist = Math.sqrt(dLat * dLat + dLon * dLon) || 0.001;

          if (dist < thresholdDegrees) {
            const overlap = thresholdDegrees - dist;
            const dirLat = dLat / dist;
            const dirLon = dLon / dist;
            
            forceLat += dirLat * overlap * repelForce;
            forceLon += dirLon * overlap * repelForce;
          }
        }

        // Attraction to real geographic origin
        const origLatDiff = p1.original.lat - p1.lat;
        const origLonDiff = p1.original.lon - p1.lon;
        forceLat += origLatDiff * gravity;
        forceLon += origLonDiff * gravity;

        p1.lat += forceLat;
        p1.lon += forceLon;
      }
    }

    return points.map(p => ({
      ...p.original,
      repelledLat: p.lat,
      repelledLon: p.lon
    }));
  }, [displayedMarkers, eventsEnabled]);

  // 1. Initialize Leaflet when 2D is explicitly active or as robust fallback
  useEffect(() => {
    if (!scriptsLoaded || !is2DActive || !leafletContainerRef.current) return;
    if (leafletMapRef.current) return;

    const L = window.L;
    if (!L) return;

    try {
      const map = L.map(leafletContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        renderer: L.canvas({ padding: 0.5 }) // Highly optimized canvas vector rendering to prevent SVG clipping & minimize DOM nodes memory!
      }).setView([20.0, 12.0], 2);

      leafletMapRef.current = map;

      // Premium theme-aligned imagery layer
      const tileUrl = getLeafletTileUrl(mapStyle);
      const tileLayer = L.tileLayer(tileUrl.url, {
        maxZoom: 19,
        attribution: tileUrl.credit
      }).addTo(map);
      leafletTileLayerRef.current = tileLayer;

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      console.log("Leaflet 2D tactical map initialized.");

      // Clean, memory-resident map-level country click picker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (countriesGeoJsonRef.current) {
          const matchedFeature = countriesGeoJsonRef.current.features.find(feature => {
            return isPointInCountry(lat, lng, feature);
          });
          if (matchedFeature) {
            const countryName = matchedFeature.properties.name || "Unknown Sector";
            if (onCountrySelect) {
              onCountrySelect(countryName);
            }
          }
        }
      });
    } catch (e) {
      console.error("Leaflet initialization failed:", e);
    }
  }, [is2DActive, scriptsLoaded]);

  // Synchronize country selection highlights reactively (In-Memory PIP Dynamic Render)
  useEffect(() => {
    // 1. Sync 3D Cesium highlights
    if (viewerReady && viewerRef.current) {
      const viewer = viewerRef.current;
      const Cesium = window.Cesium;
      if (Cesium) {
        // Revert previous selected country entities completely
        selectedCountryEntitiesRef.current.forEach(entity => {
          try { viewer.entities.remove(entity); } catch (e) {}
        });
        selectedCountryEntitiesRef.current = [];

        if (selectedCountry && countriesGeoJsonRef.current) {
          const normalizedSearch = selectedCountry.toLowerCase().trim();
          const matchedFeature = countriesGeoJsonRef.current.features.find(feature => {
            const name = (feature.properties?.name || '').toLowerCase().trim();
            return name === normalizedSearch;
          });

          if (matchedFeature && matchedFeature.geometry) {
            const geom = matchedFeature.geometry;
            const createPolygonEntity = (coords) => {
              const degrees = [];
              coords.forEach(coord => {
                degrees.push(coord[0]); // lon
                degrees.push(coord[1]); // lat
              });
              return viewer.entities.add({
                name: selectedCountry,
                polygon: {
                  hierarchy: Cesium.Cartesian3.fromDegreesArray(degrees),
                  material: Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.22)'),
                  outline: true,
                  outlineColor: Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.85)'),
                  outlineWidth: 2.0
                }
              });
            };

            try {
              if (geom.type === 'Polygon') {
                const exterior = geom.coordinates[0];
                const entity = createPolygonEntity(exterior);
                selectedCountryEntitiesRef.current.push(entity);
              } else if (geom.type === 'MultiPolygon') {
                geom.coordinates.forEach(poly => {
                  const exterior = poly[0];
                  const entity = createPolygonEntity(exterior);
                  selectedCountryEntitiesRef.current.push(entity);
                });
              }
            } catch (err) {
              console.warn("Failed to create dynamic country polygon entity:", err);
            }
          }
        }
      }
    }

    // 2. Sync 2D Leaflet highlights
    if (leafletMapRef.current && window.L) {
      const L = window.L;
      // Revert previous leaflet selection style/layer
      if (leafletSelectedLayerRef.current) {
        try {
          leafletMapRef.current.removeLayer(leafletSelectedLayerRef.current);
        } catch (e) {}
        leafletSelectedLayerRef.current = null;
      }

      if (selectedCountry && countriesGeoJsonRef.current) {
        const normalizedSearch = selectedCountry.toLowerCase().trim();
        const matchedFeature = countriesGeoJsonRef.current.features.find(feature => {
          const name = (feature.properties?.name || '').toLowerCase().trim();
          return name === normalizedSearch;
        });

        if (matchedFeature) {
          try {
            const layer = L.geoJSON(matchedFeature, {
              style: {
                color: 'rgba(0, 240, 255, 0.85)',
                weight: 2,
                fillColor: 'rgba(0, 240, 255, 0.22)',
                fillOpacity: 0.22
              }
            }).addTo(leafletMapRef.current);
            leafletSelectedLayerRef.current = layer;
          } catch (err) {
            console.warn("Failed to render Leaflet dynamic country overlay:", err);
          }
        }
      }
    }
  }, [selectedCountry, scriptsLoaded, viewerReady]);

  // 2. Update threat markers on Leaflet map
  useEffect(() => {
    if (!scriptsLoaded || !is2DActive || !leafletMapRef.current) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Clear existing markers and paths
    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    repelledMarkers.forEach(m => {
      if (m.repelledLat === undefined || m.repelledLon === undefined) return;

      const sevColorStr = SEV_COLORS[m.severity] || '#ff2d55';

      const marker = L.circleMarker([m.repelledLat, m.repelledLon], {
        radius: Math.min(6 + (m.severity || 1) * 2, 16),
        fillColor: sevColorStr, // Colored strictly by severity!
        color: '#ffffff',       // CRISP TACTICAL WHITE OUTLINE BORDER!
        weight: 2.5,            // Faint white outline like the reference image
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      marker.bindTooltip(`
        <div style="font-family: monospace; font-size: 11px; padding: 10px 14px; background: rgba(11, 19, 43, 0.98); border: 1px solid rgba(0, 240, 255, 0.8); border-radius: 8px; color: #ffffff; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.85), 0 0 10px rgba(0, 240, 255, 0.3); backdrop-filter: blur(8px); width: 240px; white-space: normal; word-break: break-word;">
          <div style="border-bottom: 1px solid rgba(0, 240, 255, 0.3); padding-bottom: 6px; margin-bottom: 6.5px; font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 6px;">
            <span>⚠️</span>
            <span style="white-space: normal; word-break: break-word;">${m.title || m.name}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #94a3b8; font-weight: 500; white-space: nowrap;">Severity:</span>
              <span style="color: ${sevColorStr}; font-weight: bold;">S${m.severity}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #94a3b8; font-weight: 500; white-space: nowrap;">Category:</span>
              <span style="color: #f8fafc; font-weight: bold; word-break: break-word;">${m.category}</span>
            </div>
          </div>
        </div>
      `, {
        direction: 'top',
        className: 'leaflet-tooltip-custom',
        permanent: false,
        sticky: true,
        opacity: 1
      });

      marker.on('click', () => {
        if (onPointClickRef.current) {
          onPointClickRef.current(m);
        }
      });
    });

    // Render 2D AI Regulations Fallback
    if (aiRegulationsEnabled && leafletAiRegulations && leafletAiRegulations.length > 0) {
      const REG_COLORS = {
        'In effect': '#22c55e',
        'Passed': '#38bdf8',
        'Proposed': '#facc15',
        'Policy': '#a855f7'
      };

      leafletAiRegulations.forEach(item => {
        if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return;
        const color = REG_COLORS[item.status] || '#a855f7';

        const marker = L.circleMarker([item.lat, item.lon], {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map);

        marker.bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 10px 14px; background: rgba(11, 19, 43, 0.98); border: 1px solid rgba(168, 85, 247, 0.8); border-radius: 8px; color: #ffffff; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.85), 0 0 10px rgba(168, 85, 247, 0.3); backdrop-filter: blur(8px); width: 260px; white-space: normal; word-break: break-word;">
            <div style="border-bottom: 1px solid rgba(168, 85, 247, 0.3); padding-bottom: 6px; margin-bottom: 6.5px; font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 6px;">
              <span>⚖️</span>
              <span style="white-space: normal; word-break: break-word;">${item.title}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span style="color: #94a3b8; font-weight: 500; white-space: nowrap; flex-shrink: 0;">Jurisdiction:</span>
                <span style="color: #f8fafc; font-weight: bold; text-align: right; word-break: break-word;">${item.jurisdiction}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span style="color: #94a3b8; font-weight: 500; white-space: nowrap; flex-shrink: 0;">Status:</span>
                <span style="color: ${color}; font-weight: bold;">${String(item.status || '').toUpperCase()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span style="color: #94a3b8; font-weight: 500; white-space: nowrap; flex-shrink: 0;">Area:</span>
                <span style="color: #f8fafc; font-weight: bold; text-align: right; word-break: break-word;">${item.area}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span style="color: #94a3b8; font-weight: 500; white-space: nowrap; flex-shrink: 0;">Date:</span>
                <span style="color: #f8fafc; font-weight: bold;">${item.date || 'Unknown'}</span>
              </div>
            </div>
          </div>
        `, {
          direction: 'top',
          className: 'leaflet-tooltip-custom',
          permanent: false,
          sticky: true,
          opacity: 1
        });

        marker.on('click', () => {
          if (onPointClickRef.current) {
            onPointClickRef.current({
              ...item,
              isAiRegulation: true
            });
          }
        });
      });
    }

    // Render 2D Satellites Fallback
    if (showSatellites && satellites) {
      satellites.forEach(sat => {
        const isSelected = selectedSatellite && selectedSatellite.code === sat.code;
        
        const satIcon = L.divIcon({
          html: `<div style="font-size: ${isSelected ? '24px' : '16px'}; line-height: 1; text-shadow: 0 0 8px rgba(0, 240, 255, 0.9); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">🛰️</div>`,
          className: 'leaflet-sat-emoji-icon',
          iconSize: isSelected ? [24, 24] : [16, 16],
          iconAnchor: isSelected ? [12, 12] : [8, 8]
        });

        const marker = L.marker([sat.latitude, sat.longitude], {
          icon: satIcon
        }).addTo(map);

        marker.bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 10px 14px; background: rgba(11, 19, 43, 0.98); border: 1px solid rgba(0, 240, 255, 0.8); border-radius: 8px; color: #ffffff; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.85), 0 0 10px rgba(0, 240, 255, 0.3); backdrop-filter: blur(8px); width: 220px; white-space: normal; word-break: break-word;">
            <div style="border-bottom: 1px solid rgba(0, 240, 255, 0.3); padding-bottom: 6px; margin-bottom: 6.5px; font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 6px;">
              <span>📡</span>
              <span style="white-space: normal; word-break: break-word;">${sat.name}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span style="color: #94a3b8; font-weight: 500; white-space: nowrap; flex-shrink: 0;">NORAD:</span>
                <span style="color: #f8fafc; font-weight: bold;">${sat.code}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span style="color: #94a3b8; font-weight: 500; white-space: nowrap; flex-shrink: 0;">Altitude:</span>
                <span style="color: #00ffff; font-weight: bold;">${sat.altitude} km</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span style="color: #94a3b8; font-weight: 500; white-space: nowrap; flex-shrink: 0;">Velocity:</span>
                <span style="color: #00ffff; font-weight: bold;">${sat.velocity} km/s</span>
              </div>
            </div>
          </div>
        `, {
          direction: 'top',
          className: 'leaflet-tooltip-custom',
          permanent: isSelected,
          sticky: !isSelected,
          opacity: 1
        });

        marker.on('click', () => {
          if (onSatelliteClickRef.current) {
            onSatelliteClickRef.current(sat);
          }
        });
      });
    }

    // Render 2D Orbit Ground-Track Path Fallback
    if (showSatellites && selectedSatellite) {
      const latlngs = [];
      const inclinationRad = (selectedSatellite.inclination * Math.PI) / 180;
      const nowMin = Date.now() / 1000 / 60;
      const EarthRotationSpeed = 360 / 1440;
      const earthRotationDrift = (nowMin * EarthRotationSpeed) % 360;

      for (let i = 0; i <= 360; i += 5) {
        const theta = (i * Math.PI) / 180;
        const sinLat = Math.sin(inclinationRad) * Math.sin(theta);
        const lat = (Math.asin(sinLat) * 180) / Math.PI;
        
        const yPrime = Math.cos(inclinationRad) * Math.sin(theta);
        const xPrime = Math.cos(theta);
        let lonOrbit = Math.atan2(yPrime, xPrime);
        
        let lon = (lonOrbit * 180) / Math.PI + (selectedSatellite.raan || 45.0) - earthRotationDrift;
        lon = ((lon + 180) % 360) - 180;
        if (lon < -180) lon += 360;

        latlngs.push([lat, lon]);
      }

      L.polyline(latlngs, {
        color: '#00ffff',
        dashArray: '5, 8',
        weight: 2,
        opacity: 0.75
      }).addTo(map);
    }
  }, [is2DActive, repelledMarkers, scriptsLoaded, showSatellites, satellites, selectedSatellite, aiRegulationsEnabled, leafletAiRegulations]);

  // Handle Map and View Reset trigger upon clicking the Refresh icon in LiveMap
  useEffect(() => {
    if (resetKey > 0) {
      clearSkyscraperSelection();
      
      // Reset memoization cache references
      lastRepelledMarkersJsonRef.current = '';
      lastSelectedSatJsonRef.current = '';

      // 1. Reset 3D Cesium Globe View
      if (viewerRef.current) {
        const viewer = viewerRef.current;
        const Cesium = window.Cesium;
        if (Cesium) {
          // Release any tracked entity locking camera focus
          viewer.trackedEntity = undefined;

          // Fly camera back to default viewpoint looking down from space nadir
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(12.0, 20.0, 15000000.0),
            orientation: {
              heading: Cesium.Math.toRadians(0.0),
              pitch: Cesium.Math.toRadians(-90.0),
              roll: 0.0
            },
            duration: 2.0
          });
        }
      }

      // 2. Reset 2D Leaflet map position
      if (is2DActive && leafletMapRef.current) {
        leafletMapRef.current.setView([20.0, 12.0], 2);
      }
    }
  }, [resetKey, is2DActive]);

  // Handle focusing camera on specific coordinates (e.g. when an admin changes location)
  useEffect(() => {
    if (focusCoordinate && focusCoordinate.lat !== undefined && focusCoordinate.lon !== undefined) {
      const { lat, lon } = focusCoordinate;
      
      // 1. Focus 3D Cesium camera
      if (viewerRef.current) {
        const viewer = viewerRef.current;
        const Cesium = window.Cesium;
        if (Cesium) {
          viewer.trackedEntity = undefined;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 150000.0), // 150km focus height
            orientation: {
              heading: viewer.camera.heading, // Maintain current heading/rotation
              pitch: Cesium.Math.toRadians(-45.0), // Tilt 45 degrees for premium depth look
              roll: 0.0
            },
            duration: 2.0
          });
        }
      }

      // 2. Focus 2D Leaflet map
      if (is2DActive && leafletMapRef.current) {
        leafletMapRef.current.setView([lat, lon], 8, { animate: true });
      }
    }
  }, [focusCoordinate, is2DActive]);

  // 2b. Sync Leaflet theme to mapStyle selection
  useEffect(() => {
    if (leafletMapRef.current && leafletTileLayerRef.current) {
      const tileUrl = getLeafletTileUrl(mapStyle);
      leafletTileLayerRef.current.setUrl(tileUrl.url);
    }
  }, [mapStyle]);

  // 2c. Force Leaflet to recalculate container dimensions when transition settles (prevents clipping)
  useEffect(() => {
    if (is2DActive && leafletMapRef.current) {
      const timer = setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [is2DActive]);

  // 2d. Listen to map container DOM element resizes (like when details window drawer slides open/closes)
  useEffect(() => {
    if (typeof window === 'undefined' || !('ResizeObserver' in window)) return;
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.resize();
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [scriptsLoaded]);

  // 3. Initialize Cesium Globe cleanly on mount with Google satellite base layer (safe for 2D/3D modes)
  useEffect(() => {
    if (!scriptsLoaded || mapError || typeof window === 'undefined' || !containerRef.current || viewerRef.current) return;

    const Cesium = window.Cesium;
    if (!Cesium) {
      console.warn("CesiumJS not available in window. Falling back to Leaflet.");
      setMapError(true);
      return;
    }

    let viewer;
    try {
      // Premium imagery provider url based on user style selection (Google Hybrid, Tactical Dark, or Earth at Night)
      let mapUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      let creditStr = 'Google Maps';

      if (mapStyle === 'tactical' || mapStyle === 'dark') {
        mapUrl = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
        creditStr = 'CartoDB Dark Matter';
      } else if (mapStyle === 'lights') {
        mapUrl = 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Earth_at_Night_2016/MapServer/tile/{z}/{y}/{x}';
        creditStr = 'Esri Earth at Night';
      }

      const satelliteProvider = new Cesium.UrlTemplateImageryProvider({
        url: mapUrl,
        credit: creditStr
      });

      const viewerOptions = {
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
        requestRenderMode: true, // GPU usage goes to 0% when globe is idle!
        maximumRenderTimeChange: 0.0, // Ensures smooth animations during clock updates
        fullscreenButton: false,
        vrButton: false,
        creditContainer: typeof document !== 'undefined' ? document.createElement('div') : undefined, // Off-screen credit container to avoid crawlable SEO warnings!
      };

      // Set premium satellite map as baseLayer in modern Cesium, or imageryProvider in older versions
      if (Cesium.ImageryLayer) {
        viewerOptions.baseLayer = new Cesium.ImageryLayer(satelliteProvider);
      } else {
        viewerOptions.imageryProvider = satelliteProvider;
      }

      // Initialize clean premium satellite globe
      viewer = new Cesium.Viewer(containerRef.current, viewerOptions);

      // Force Retina-quality crisp resolution scaling for maps, labels, and text, capping at 1.25 to protect GPU
      viewer.resolutionScale = Math.min(1.25, window.devicePixelRatio || 1.0);
      viewer.useBrowserRecommendedResolution = false;

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
        viewer.imageryLayers.addImageryProvider(satelliteProvider);
      }

      // Enable Google Maps API key globally in Cesium
      Cesium.GoogleMaps.defaultApiKey = GOOGLE_API_KEY;

      // Keep the globe visible to guarantee rendering stability
      viewer.scene.globe.show = true;
      // Start as false to prevent any curvature/terrain clipping visual bugs on initial tactical dark load!
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.tileCacheSize = 35; // Dramatically reduces memory usage by limiting cached terrain/imagery tiles!
      viewer.scene.globe.maximumScreenSpaceError = 4.5; // Optimized to reduce memory overhead and GPU footprint, saving up to ~250MB!

      // Set camera to premium global view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(12.0, 20.0, 15000000.0),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-90.0),
          roll: 0.0
        }
      });

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

      // Hover pick handler to show threat labels, toggle cursor pointer, and maintain satellite labels safely
      handler.setInputAction((movement) => {
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
          const props = hoveredEntity.properties;

          const isCable = getPropValue(props, 'isCable', false);
          const isLandingStation = getPropValue(props, 'isLandingStation', false);
          const isOilGas = getPropValue(props, 'isOilGas', false);
          const isGpsJamming = getPropValue(props, 'isGpsJamming', false);
          const isDataCenter = getPropValue(props, 'isDataCenter', false);
          const isAiRegulation = getPropValue(props, 'isAiRegulation', false);
          const title = getPropValue(props, 'title', hoveredEntity.name || '');

          if (isCable || isLandingStation || isOilGas || isGpsJamming || isDataCenter || isAiRegulation) {
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
              } else if (isOilGas) {
                const isPipeline = getPropValue(props, 'isPipeline', false);
                const isPlant = getPropValue(props, 'isPlant', false);
                if (isPipeline) {
                  type = 'energy';
                  titlePrefix = '🛢️ ';
                  tooltipContent = `🛢️ Pipeline Project\nName: ${title}`;
                  details = { 'Type': 'Pipeline Project' };
                } else if (isPlant) {
                  type = 'energy';
                  titlePrefix = '🏭 ';
                  tooltipContent = `🏭 Energy Refinery / Plant\nName: ${title}`;
                  details = { 'Type': 'Energy Refinery / Plant' };
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
            // Hovered over a satellite: show pointer cursor and ensure its label remains visible
            document.body.style.cursor = 'pointer';
            
            // Hide all threat event labels (hover reset) while keeping satellite labels visible
            viewer.entities.values.forEach(entity => {
              if (entity.label) {
                const entIsSat = getIsSatellite(entity);
                if (!entIsSat) {
                  entity.label.show = false;
                }
              }
            });
          } else if (hoveredEntity.label) {
            // Hovered over a threat feed event: show premium stacked React overlay tooltip
            document.body.style.cursor = 'pointer';

            const evtTitle    = getPropValue(props, 'title',     hoveredEntity.name || '');
            const evtSeverity = getPropValue(props, 'severity',  1);
            const evtCategory = getPropValue(props, 'category',  'Unknown');
            const evtLocation = getPropValue(props, 'location',  'Unknown');
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
                  'Severity': `S${evtSeverity}`,
                  'Category': String(evtCategory || 'Unknown'),
                  'Location': String(evtLocation || 'Unknown'),
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
        } else {
          // Hovered over background, oceans, space, or 3D buildings (Google Tiles feature)
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
          const isSat = getIsSatellite(entity);
          const isThreat = entity.id && entity.id.startsWith('threat-');
          const isLandmark = props && getPropValue(props, 'isLandmark', false);

          if (isThreat || isSat || isCable || isLandingStation || isOilGas || isGpsJamming || isDataCenter || isAiRegulation) {
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

        // 2. If it's a general click on 3D building mesh, terrain, or backdrop, process it
        if (!handled && is3DActive) {
          let cartesian = viewer.scene.pickPosition(movement.position);
          if (!Cesium.defined(cartesian)) {
            const ray = viewer.camera.getPickRay(movement.position);
            if (ray) {
              cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            }
          }

          if (Cesium.defined(cartesian)) {
            const pickedCartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const pickedLon = Cesium.Math.toDegrees(pickedCartographic.longitude);
            const pickedLat = Cesium.Math.toDegrees(pickedCartographic.latitude);
            const pickedHeight = pickedCartographic.height;

            let closestLandmark = null;
            let minDistance = Infinity;

            FAMOUS_LANDMARKS.forEach(landmark => {
              // Flat-earth horizontal degrees-to-meters approximation to bypass altitude variations
              const latDiff = (pickedLat - landmark.lat) * 111000;
              const lonDiff = (pickedLon - landmark.lon) * 111000 * Math.cos(Cesium.Math.toRadians(landmark.lat));
              const horizontalDist = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
              
              if (horizontalDist < minDistance) {
                minDistance = horizontalDist;
                closestLandmark = landmark;
              }
            });

            // Clean, memory-resident point-in-polygon country click picker
            let matchedCountryName = null;
            if (countriesGeoJsonRef.current) {
              const matchedFeature = countriesGeoJsonRef.current.features.find(feature => {
                return isPointInCountry(pickedLat, pickedLon, feature);
              });
              if (matchedFeature) {
                matchedCountryName = matchedFeature.properties?.name || "Unknown Sector";
              }
            }

            if (matchedCountryName) {
              if (onCountrySelect) {
                onCountrySelect(matchedCountryName);
              }
              handled = true;
            } else if (minDistance < 300.0 && closestLandmark) {
              selectSkyscraper(closestLandmark);
              handled = true;
            } else {
              const isBuildingFeature = pickedObject && (
                !(pickedObject.id instanceof Cesium.Entity) ||
                pickedObject instanceof Cesium.Cesium3DTileFeature ||
                (pickedObject.primitive && pickedObject.primitive instanceof Cesium.Cesium3DTileset) ||
                (typeof pickedObject.getProperty === 'function')
              );

              if (isBuildingFeature) {
                if (lastPickedFeatureRef.current && !lastPickedFeatureRef.current.isDestroyed?.()) {
                  try { lastPickedFeatureRef.current.color = Cesium.Color.WHITE; } catch (e) {}
                }
                try {
                  pickedObject.color = Cesium.Color.fromCssColorString('rgba(0, 240, 255, 0.85)');
                  lastPickedFeatureRef.current = pickedObject;
                } catch (e) {
                  lastPickedFeatureRef.current = null;
                }
              }

              let buildingName = "UNIDENTIFIED SKYSCRAPER";
              if (pickedObject && typeof pickedObject.getProperty === 'function') {
                try {
                  const name = pickedObject.getProperty('name') || pickedObject.getProperty('Label') || pickedObject.getProperty('title');
                  if (name) buildingName = name.toUpperCase();
                } catch (e) {}
              }

              const genericLandmark = {
                id: `generic-${pickedLat.toFixed(4)}-${pickedLon.toFixed(4)}`,
                name: buildingName,
                city: 'TACTICAL SECTOR',
                lat: pickedLat,
                lon: pickedLon,
                height: pickedHeight > 10 ? pickedHeight : 60,
                boxDimensions: { x: 50, y: 50, z: pickedHeight > 10 ? pickedHeight * 1.1 : 70 },
                description: 'Unidentified skyscraper detected on 3D photorealistic scanning telemetry.'
              };
              selectSkyscraper(genericLandmark);
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

      viewerRef.current = viewer;
      setViewerReady(true);
      
      // Reset JSON memoization references on new viewer creations
      lastRepelledMarkersJsonRef.current = '';
      lastSelectedSatJsonRef.current = '';

      // Clean up on unmount
      return () => {
        handler.destroy();
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
        setViewerReady(false);
        tilesetRef.current = null;
        lastPickedFeatureRef.current = null;
        selectionEntityRef.current = null;
      };
    } catch (e) {
      console.error("Cesium globe initialization failed. Switching to 2D Fallback:", e);
      setMapError(true);
    }
  }, [mapError, scriptsLoaded]);

  // 4. Handle Google 3D Tileset loading and visibility based on Map Mode or Viewport Style
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current) return;
    
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const shouldShow3d = mapMode === '3d' && mapStyle === 'buildings';

    if (shouldShow3d) {
      // Toggle 3D buildings overlay on
      if (tilesetRef.current) {
        tilesetRef.current.show = true;
      } else if (tilesetLoadingStatus === 'idle') {
        setTilesetLoadingStatus('loading');
        setTilesetLoaded(false);
        console.log("Dynamically loading Google Photorealistic 3D Tileset overlay...");

        const googleTilesUrl = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_API_KEY}`;
        Cesium.Cesium3DTileset.fromUrl(googleTilesUrl, {
          showCreditsOnScreen: true,
          maximumMemoryUsage: 128,
          skipLevelOfDetail: true,
          cullRequestsWithCheckIfSelected: true,
          cullWithSSEBox: true
        }).then(tileset => {
          if (!viewerRef.current || viewer.isDestroyed()) return;

          viewer.scene.primitives.add(tileset);
          tilesetRef.current = tileset;
          tileset.show = true;
          
          setTilesetLoaded(true);
          setTilesetLoadingStatus('loaded');
          console.log("Google 3D Tileset loaded successfully.");
        }).catch(err => {
          console.error("Google 3D Tileset load failed:", err);
          setTilesetLoadingStatus('error');
        });
      }
    } else {
      // Toggle 3D buildings overlay off
      if (tilesetRef.current) {
        tilesetRef.current.show = false;
      }
    }
  }, [mapMode, mapStyle, tilesetLoadingStatus, mapError, scriptsLoaded]);

  // 5. Update threat markers on Cesium Globe
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current) return;

    const Cesium = window.Cesium;
    if (!Cesium) return;

    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeight = is3DActive ? 0 : 50000;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 100000000.0;

    // Skip heavy entity updates if the incoming threat marker dataset and mode hasn't changed
    const repelledJson = JSON.stringify(repelledMarkers);
    const cacheKey = `${is3DActive}_${repelledJson}`;
    if (lastRepelledMarkersJsonRef.current === cacheKey) {
      return;
    }
    lastRepelledMarkersJsonRef.current = cacheKey;

    const viewer = viewerRef.current;

    // Create a Set of incoming threat IDs for quick lookup
    const incomingIds = new Set(repelledMarkers.map(m => `threat-${m.id || m.title}`));

    // Surgically remove only threat entities that are no longer in the repelledMarkers list
    const existingThreats = viewer.entities.values.filter(e => e.id && e.id.startsWith('threat-'));
    existingThreats.forEach(e => {
      if (e.id.startsWith('threat-pulse-')) {
        const parentId = e.id.replace('threat-pulse-', 'threat-');
        if (!incomingIds.has(parentId)) {
          viewer.entities.remove(e);
        }
      } else if (!incomingIds.has(e.id)) {
        viewer.entities.remove(e);
      }
    });

    // Surgically add new threat markers or update existing ones without recreating them!
    repelledMarkers.forEach(m => {
      if (m.repelledLat === undefined || m.repelledLon === undefined) return;

      const sevColorStr = SEV_COLORS[m.severity] || '#ff2d55';
      const threatId = `threat-${m.id || m.title}`;
      const newPos = Cesium.Cartesian3.fromDegrees(m.repelledLon, m.repelledLat, targetHeight);

      const existing = viewer.entities.getById(threatId);
      if (existing) {
        // Surgically update properties on the existing persistent entity
        existing.position = newPos;
        if (existing.billboard) {
          existing.billboard.heightReference = targetHeightRef;
          existing.billboard.disableDepthTestDistance = targetDisableDepthTest;
        }
        if (existing.label) {
          existing.label.text = `${m.title || m.name}\n[Severity ${m.severity} • ${m.category}]`;
          existing.label.heightReference = targetHeightRef;
          existing.label.disableDepthTestDistance = targetDisableDepthTest;
        }
        existing.properties = m;
      } else {
        // Threat circle billboard marker (perfectly clamped to terrain/3D rooftops in 3D, elevated in 2D!)
        viewer.entities.add({
          id: threatId,
          name: m.title || m.name,
          position: newPos,
          billboard: {
            image: createCircleCanvas(sevColorStr, 6 + (m.severity || 1) * 1.5, '#ffffff', 1.5),
            heightReference: targetHeightRef,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
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
      }

      // Expandable rippling radar waves (strictly pulse at severity 5, conforming beautifully to terrain/ellipsoid!)
      if (m.severity >= 5) {
        const pulseId = `threat-pulse-${m.id || m.title}`;
        const existingPulse = viewer.entities.getById(pulseId);
        if (existingPulse) {
          existingPulse.position = newPos;
          if (existingPulse.ellipse) {
            existingPulse.ellipse.heightReference = targetHeightRef;
          }
        } else {
          let currentRadius = 15000.0;
          viewer.entities.add({
            id: pulseId,
            position: newPos,
            ellipse: {
              semiMajorAxis: new Cesium.CallbackProperty(() => {
                currentRadius += 3000.0;
                if (currentRadius > 180000.0) currentRadius = 15000.0;
                return currentRadius;
              }, false),
              semiMinorAxis: new Cesium.CallbackProperty(() => {
                return currentRadius;
              }, false),
              material: Cesium.Color.fromCssColorString(sevColorStr).withAlpha(0.18),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString(sevColorStr),
              heightReference: targetHeightRef,
            }
          });
        }
      }
    });
  }, [repelledMarkers, mapError, scriptsLoaded, mapMode, mapStyle]);

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
    if (showSatellites && satellites && satellites.length > 0) {
      satellites.forEach(sat => {
        const altInMeters = sat.altitude * 1000;
        const isSelected = selectedSatellite && selectedSatellite.code === sat.code;
        const satId = `sat-${sat.code}`;
        const newPos = Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, altInMeters);

        const existingSat = viewer.entities.getById(satId);
        if (existingSat) {
          // Surgically update positions and billboard scales to prevent any flicker!
          existingSat.position = newPos;
          if (existingSat.label) {
            existingSat.label.text = isSelected 
              ? `${sat.name}\nAlt: ${sat.altitude} km  |  V: ${sat.velocity} km/s`
              : sat.name;
            existingSat.label.font = isSelected ? 'bold 9pt monospace' : '8pt monospace';
            existingSat.label.fillColor = Cesium.Color.fromCssColorString('#00f0ff');
            existingSat.label.backgroundColor = Cesium.Color.fromCssColorString('#020d1a').withAlpha(0.92);
          }
          if (existingSat.billboard) {
            existingSat.billboard.image = createEmojiCanvas('🛰️', isSelected ? 36 : 24);
          }
          existingSat.properties = { ...sat, isSatellite: true };
        } else {
          // Add new satellite marker if not present
          viewer.entities.add({
            id: satId,
            name: sat.name,
            position: newPos,
            billboard: {
              image: createEmojiCanvas('🛰️', isSelected ? 36 : 24),
              heightReference: Cesium.HeightReference.NONE, // Floating in space!
              disableDepthTestDistance: 100000.0,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER
            },
            label: {
              text: isSelected 
                ? `${sat.name}\nAlt: ${sat.altitude} km  |  V: ${sat.velocity} km/s`
                : sat.name,
              font: isSelected ? 'bold 9pt monospace' : '8pt monospace',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: Cesium.Color.fromCssColorString('#00f0ff'),
              outlineColor: Cesium.Color.fromCssColorString('#001830'),
              outlineWidth: 3,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#020d1a').withAlpha(0.92),
              backgroundPadding: new Cesium.Cartesian2(8, 5),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -22),
              heightReference: Cesium.HeightReference.NONE,
              show: true,
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

      // Update 4. Ground-Conforming Expanding Footprint Radar Footprint *in-place*
      const footprintEntity = viewer.entities.getById('sat-nadir-footprint');
      if (footprintEntity) {
        footprintEntity.position = groundPos;
      } else {
        let scanningRadius = 300000.0;
        viewer.entities.add({
          id: 'sat-nadir-footprint',
          position: groundPos,
          ellipse: {
            semiMajorAxis: new Cesium.CallbackProperty(() => {
              scanningRadius += 4000.0;
              if (scanningRadius > 600000.0) scanningRadius = 300000.0;
              return scanningRadius;
            }, false),
            semiMinorAxis: new Cesium.CallbackProperty(() => {
              return scanningRadius;
            }, false),
            material: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.08),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.55),
            outlineWidth: 1.5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
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
  }, [showSatellites, satellites, selectedSatellite, isTracked, scriptsLoaded, mapError]);



  // 7. Update Leaflet base map layer on mapStyle changes
  useEffect(() => {
    if (!scriptsLoaded || !mapError || !leafletMapRef.current) return;
    const L = window.L;
    const map = leafletMapRef.current;
    if (!L) return;

    try {
      // Find and remove existing tile layers
      map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      let tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      let attribStr = 'Google';

      if (mapStyle === 'tactical' || mapStyle === 'dark') {
        tileUrl = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
        attribStr = 'CartoDB';
      } else if (mapStyle === 'lights') {
        tileUrl = 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Earth_at_Night_2016/MapServer/tile/{z}/{y}/{x}';
        attribStr = 'Esri';
      }

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: attribStr
      }).addTo(map);
      console.log(`Leaflet fallback base map style swapped to: ${mapStyle}`);
    } catch (e) {
      console.error("Failed to swap Leaflet base map style:", e);
    }
  }, [mapError, mapStyle, scriptsLoaded]);

  // 8. Capture and normalize wheel zoom for perfect laptop trackpad and mouse scroll zoom!
  useEffect(() => {
    if (!scriptsLoaded || mapError || !viewerRef.current) return;
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
        return;
      }

      // 2. ZOOM ACTION: Normal scroll zoom
      const zoomRate = height * 0.16;
      const amount = (delta / 120.0) * zoomRate;

      // Adjust camera positioning along its forward direction vector
      camera.move(camera.direction, -amount);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
  }, [mapError, scriptsLoaded]);

  // A. Dynamic Map Style Switcher (Tactical Dark, Satellite, Earth at Night, Terrain, Street)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const layers = viewer.imageryLayers;
    
    // Choose correct tile URL based on chosen style
    let url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Satellite hybrid default
    let credit = 'Google Maps';

    if (mapStyle === 'tactical' || mapStyle === 'dark') {
      url = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
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

    const provider = new Cesium.UrlTemplateImageryProvider({ url, credit });
    
    try {
      const newLayer = new Cesium.ImageryLayer(provider);
      // Remove the very first layer (base) and insert this one instead
      if (layers.length > 0) {
        layers.remove(layers.get(0));
        layers.add(newLayer, 0);
      } else {
        layers.add(newLayer);
      }
      console.log(`Cesium base map style swapped dynamically to: ${mapStyle}`);
    } catch (err) {
      console.warn("Dynamic imagery layer swap failed:", err);
    }
  }, [mapStyle, scriptsLoaded, mapError, viewerReady]);

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
    
    if (dayNightEnabled) {
      viewer.clock.shouldAnimate = true;
      viewer.clock.multiplier = 1.0;
    }
  }, [dayNightEnabled, scriptsLoaded, mapError, viewerReady]);

  // D. RainViewer Weather Radar Tiles & Rain Post-Processing Particle Effects
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    let weatherLayer = null;
    let rainStage = null;
    let isActive = true;

    if (weatherEnabled) {
      // 1. Fetch RainViewer's latest global radar frame metadata
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => {
          if (!res.ok) throw new Error("RainViewer metadata request failed");
          return res.json();
        })
        .then(data => {
          if (!isActive || !viewerRef.current || viewer.isDestroyed()) return;

          const host = data.host || 'https://tilecache.rainviewer.com';
          const pastFrames = data.radar?.past;
          if (!pastFrames || pastFrames.length === 0) {
            console.warn("No RainViewer past radar frames found.");
            return;
          }

          // Use the latest available past frame path
          const latestFrame = pastFrames[pastFrames.length - 1];
          const path = latestFrame.path;

          // Universal Blue scheme (2) for high-aesthetic neon theme fit, with smoothing option (1)
          const tileUrl = `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;

          const weatherProvider = new Cesium.UrlTemplateImageryProvider({
            url: tileUrl,
            credit: 'RainViewer Real-time Global Radar',
            alpha: 0.65
          });

          try {
            weatherLayer = viewer.imageryLayers.addImageryProvider(weatherProvider);
            console.log("RainViewer global real-time weather radar loaded successfully.");
          } catch (err) {
            console.warn("RainViewer radar tiles failed to add:", err);
          }
        })
        .catch(err => {
          console.warn("Failed to retrieve RainViewer global radar metadata. Falling back to NEXRAD:", err);
          
          // Failover to local NEXRAD just in case
          const fallbackProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
            credit: 'IEM Weather Radar (Fallback)',
            alpha: 0.65
          });

          try {
            weatherLayer = viewer.imageryLayers.addImageryProvider(fallbackProvider);
          } catch (e) {}
        });

      // 2. Add screen space rain post-process storm overlay
      try {
        rainStage = Cesium.PostProcessStageLibrary.createRainStage();
        viewer.scene.postProcessStages.add(rainStage);
      } catch (err) {
        console.warn("Cesium rain stage post-process failed:", err);
      }
    }

    return () => {
      isActive = false;
      if (viewer && !viewer.isDestroyed()) {
        if (weatherLayer) {
          try {
            viewer.imageryLayers.remove(weatherLayer);
          } catch (e) {}
        }
        if (rainStage) {
          try {
            viewer.scene.postProcessStages.remove(rainStage);
          } catch (e) {}
        }
      }
    };
  }, [weatherEnabled, scriptsLoaded, mapError, viewerReady]);

  // E. Oil & Gas Pipelines (Global Energy Monitor Vector Ingestion)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeight = is3DActive ? 0 : 50000;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 100000000.0;

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
      }
    };

    if (!oilGasEnabled) {
      clearOilGas();
      return;
    }

    fetch('/api/oil-gas')
      .then(res => {
        if (!res.ok) throw new Error("Oil & Gas request failed");
        return res.json();
      })
      .then(data => {
        if (!data) return;
        clearOilGas();

        const newEntities = [];

        // 1. Draw Pipeline Vector Paths (Thin, gorgeous custom colored lines draped on ground)
        if (data.lines && data.lines.length > 0) {
          data.lines.forEach(line => {
            const degreesArray = [];
            line.coordinates.forEach(coord => {
              degreesArray.push(coord[0], coord[1]);
            });

            try {
              const entity = viewer.entities.add({
                name: line.project,
                polyline: {
                  positions: Cesium.Cartesian3.fromDegreesArray(degreesArray),
                  width: 0.8, // Elegant hairline
                  material: Cesium.Color.fromCssColorString(line.color).withAlpha(0.35), // Faint and translucent
                  clampToGround: true
                },
                properties: {
                  isOilGas: true,
                  isPipeline: true,
                  title: line.project
                }
              });
              newEntities.push(entity);
            } catch (err) {}
          });
        }

        // 2. Draw Plants, Refineries, and Terminals (Dynamic solid translucent micro-droplets color-coded correctly)
        if (data.points && data.points.length > 0) {
          data.points.forEach(point => {
            try {
              const entity = viewer.entities.add({
                name: point.name,
                position: Cesium.Cartesian3.fromDegrees(point.coordinate[0], point.coordinate[1], targetHeight),
                billboard: {
                  image: createTeardropCanvas(point.color),
                  width: 4, // Even smaller and cleaner
                  height: 6,
                  color: new Cesium.Color(1.0, 1.0, 1.0, 0.45), // Gorgeous translucent appearance (45% opacity)
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                  heightReference: targetHeightRef,
                  disableDepthTestDistance: targetDisableDepthTest, // Prevent horizon/curvature clipping
                },
                properties: {
                  isOilGas: true,
                  isPlant: true,
                  title: point.name
                }
              });
              newEntities.push(entity);
            } catch (err) {}
          });
        }

        oilGasEntitiesRef.current = newEntities;
      })
      .catch(err => {
        console.warn("Failed to load vector pipelines and refineries:", err);
      });

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
      }
    };

    if (!gpsJammingEnabled) {
      clearGpsJamming();
      return;
    }

    fetch('/api/gps-jamming')
      .then(res => {
        if (!res.ok) throw new Error("GPS Jamming data request failed");
        return res.json();
      })
      .then(data => {
        if (!data || !data.cells) return;
        clearGpsJamming();

        const newEntities = [];

        data.cells.forEach(cell => {
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
        console.log(`Rendered ${newEntities.length} active GPS jamming honeycomb cells.`);
      })
      .catch(err => {
        console.warn("Failed to load GPS jamming vector cells:", err);
      });

    return () => {
      clearGpsJamming();
    };
  }, [gpsJammingEnabled, scriptsLoaded, mapError, viewerReady]);

  // E3. Global Data Centers Map Layer Ingestion & Point Plotting (ATLAS OSINT Dataset)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    const is3DActive = mapMode === '3d' && mapStyle === 'buildings';
    const targetHeight = is3DActive ? 0 : 50000;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 100000000.0;

    const clearDataCenters = () => {
      if (dataCenterEntitiesRef.current && dataCenterEntitiesRef.current.length > 0) {
        dataCenterEntitiesRef.current.forEach(entity => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.entities.remove(entity);
          }
        });
        dataCenterEntitiesRef.current = [];
      }
    };

    if (!dataCentersEnabled) {
      clearDataCenters();
      return;
    }

    fetch('/api/datacenters')
      .then(res => {
        if (!res.ok) throw new Error("Data Centers data request failed");
        return res.json();
      })
      .then(data => {
        if (!data || !data.dataCenters) return;
        clearDataCenters();

        const newEntities = [];
        data.dataCenters.forEach(dc => {
          if (typeof dc.lat !== 'number' || typeof dc.lon !== 'number') return;

          // Color representation: glowing orange for planned/proposed, neon cyan for active (with organic translucency)
          const nodeColor = dc.status === 'planned' 
            ? Cesium.Color.fromCssColorString('#f97316').withAlpha(0.65) 
            : Cesium.Color.fromCssColorString('#00f0ff').withAlpha(0.65);

          try {
            const entity = viewer.entities.add({
              name: dc.name,
              position: Cesium.Cartesian3.fromDegrees(dc.lon, dc.lat, targetHeight),
              billboard: {
                image: createCircleCanvas(nodeColor.toCssColorString(), 7, '#ffffff', 1.2),
                heightReference: targetHeightRef,
                disableDepthTestDistance: targetDisableDepthTest, // Prevent horizon/curvature clipping
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
              },
              properties: {
                isDataCenter: true,
                title: dc.name,
                operator: dc.operator || 'Independent',
                location: `${dc.city}, ${dc.country}`,
                status: dc.status || 'active'
              }
            });
            newEntities.push(entity);
          } catch (err) {
            console.error("Failed to render data center node:", err);
          }
        });

        dataCenterEntitiesRef.current = newEntities;
        console.log(`Rendered ${newEntities.length} global data center server nodes.`);
      })
      .catch(err => {
        console.warn("Failed to load global data centers vector points:", err);
      });

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
    const targetHeight = is3DActive ? 0 : 50000;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 100000000.0;

    const clearAiRegulations = () => {
      if (aiRegulationsEntitiesRef.current && aiRegulationsEntitiesRef.current.length > 0) {
        aiRegulationsEntitiesRef.current.forEach(entity => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.entities.remove(entity);
          }
        });
        aiRegulationsEntitiesRef.current = [];
      }
    };

    if (!aiRegulationsEnabled) {
      clearAiRegulations();
      return;
    }

    const REG_COLORS = {
      'In effect': '#22c55e',
      'Passed': '#38bdf8',
      'Proposed': '#facc15',
      'Policy': '#a855f7'
    };

    fetch('/api/ai-regulations')
      .then(res => {
        if (!res.ok) throw new Error("AI Regulations data request failed");
        return res.json();
      })
      .then(data => {
        if (!data || !data.aiRegulations) return;
        clearAiRegulations();

        const newEntities = [];
        data.aiRegulations.forEach(item => {
          if (typeof item.lon !== 'number' || typeof item.lat !== 'number') return;

          const statusColor = REG_COLORS[item.status] || '#a855f7';

          try {
            const entity = viewer.entities.add({
              id: 'reg-' + item.id,
              name: item.title,
              position: Cesium.Cartesian3.fromDegrees(item.lon, item.lat, targetHeight),
              billboard: {
                image: createCircleCanvas(statusColor, 12, '#ffffff', 1.5),
                heightReference: targetHeightRef,
                disableDepthTestDistance: targetDisableDepthTest, // Prevent horizon/curvature clipping
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
              },
              properties: {
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
        console.log(`Rendered ${newEntities.length} global AI regulation pins.`);
      })
      .catch(err => {
        console.warn("Failed to load global AI regulations vector points:", err);
      });

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
    const targetHeight = is3DActive ? 0 : 50000;
    const targetHeightRef = is3DActive 
      ? (Cesium.HeightReference.CLAMP_TO_3D_TILE || Cesium.HeightReference.CLAMP_TO_GROUND)
      : Cesium.HeightReference.NONE;
    const targetDisableDepthTest = is3DActive ? 0.0 : 100000000.0;

    const clearCables = () => {
      if (cableEntitiesRef.current && cableEntitiesRef.current.length > 0) {
        cableEntitiesRef.current.forEach(entity => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.entities.remove(entity);
          }
        });
        cableEntitiesRef.current = [];
      }
    };

    if (!internetCablesEnabled) {
      clearCables();
      return;
    }

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
                  width: 0.6, // Ultra-thin, delicate, elegant hairline lines
                  material: color.withAlpha(0.3), // Faint and elegant translucent style
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
                  image: createCircleCanvas('rgba(168, 85, 247, 0.4)', 4, 'rgba(255, 255, 255, 0.4)', 0.5),
                  heightReference: targetHeightRef,
                  disableDepthTestDistance: targetDisableDepthTest, // Prevent horizon/curvature clipping
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM
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
      })
      .catch(err => {
        console.warn("Failed to dynamically draw global subsea cables or landing points:", err);
      });

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#020617' }}>
      
      {/* 2D Leaflet Map Container (Active strictly as a robust fallback only) */}
      <div 
        ref={leafletContainerRef} 
        onMouseDown={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        onWheel={handleUserInteraction}
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          zIndex: is2DActive ? 2 : 1,
          opacity: is2DActive ? 1 : 0,
          pointerEvents: is2DActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }} 
      />

      {/* 3D Cesium Map Container (Primary Map - renders beautiful satellite globe by default!) */}
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
          zIndex: !is2DActive ? 2 : 1,
          opacity: !is2DActive ? 1 : 0,
          pointerEvents: !is2DActive ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }} 
      />

      {/* 2D Fallback Mode Badge */}
      {mapError && (
        <div style={{
          position: 'absolute', top: '12px', left: '12px', zIndex: 10,
          background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '4px', padding: '8px 12px', fontSize: '9px', fontFamily: 'monospace', color: '#38bdf8',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em'
        }}>
          🛰️ TACTICAL MAP: 2D SAT-COM ACTIVE (FALLBACK MODE)
        </div>
      )}

      {/* Visual Navigation controls HUD overlay */}
      {!mapError && (
        <>
          {/* Tactical Control Toolbar */}
          <div style={{
            position: 'absolute',
            bottom: '100px',
            right: '20px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button 
              onClick={() => {
                if (onMapStyleChange) {
                  onMapStyleChange(mapStyle === 'buildings' ? 'tactical' : 'buildings');
                }
              }}
              style={{
                width: '36px', height: '36px',
                background: mapStyle === 'buildings' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(8, 12, 24, 0.85)',
                border: mapStyle === 'buildings' ? '1px solid #00f0ff' : '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px',
                color: mapStyle === 'buildings' ? '#00f0ff' : '#38bdf8',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: mapStyle === 'buildings' ? '0 0 12px rgba(0, 240, 255, 0.35)' : '0 4px 12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              title={mapStyle === 'buildings' ? "Disable Premium 3D Buildings & Mesh" : "Enable Premium 3D Buildings & Mesh"}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f0ff';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = mapStyle === 'buildings' ? '#00f0ff' : 'rgba(56, 189, 248, 0.3)';
                e.currentTarget.style.color = mapStyle === 'buildings' ? '#00f0ff' : '#38bdf8';
                e.currentTarget.style.boxShadow = mapStyle === 'buildings' ? '0 0 12px rgba(0, 240, 255, 0.35)' : '0 4px 12px rgba(0,0,0,0.5)';
              }}
            >
              3D
            </button>
            <button 
              onClick={handleResetNorth}
              style={{
                width: '36px', height: '36px',
                background: 'rgba(8, 12, 24, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px',
                color: '#38bdf8',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              title="Reset North Orientation"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f0ff';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                e.currentTarget.style.color = '#38bdf8';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
              }}
            >
              🧭
            </button>
          </div>

          {/* Tactical Controls Legend Overlay (Bottom Left) */}
          {showLegend && !isMobile && (
            <div style={{
              position: 'absolute',
              bottom: '48px',
              left: '20px',
              zIndex: 10,
              background: 'rgba(8, 12, 24, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontFamily: 'Courier New, monospace',
              fontSize: '10px',
              color: '#e2e8f0',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'auto',
              letterSpacing: '0.02em',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                fontWeight: '800', 
                color: '#00f0ff', 
                marginBottom: '2px', 
                borderBottom: '1px solid rgba(56, 189, 248, 0.25)', 
                paddingBottom: '2px',
                gap: '24px'
              }}>
                <span>📡 MAP NAVIGATION HUD</span>
                <span 
                  onClick={() => setShowLegend(false)}
                  style={{
                    cursor: 'pointer',
                    color: 'rgba(56, 189, 248, 0.6)',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    padding: '0 4px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff2d55'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(56, 189, 248, 0.6)'}
                  title="Close Controls HUD"
                >
                  ×
                </span>
              </div>
              <div style={{ pointerEvents: 'none' }}>🖱️ <span style={{ color: '#38bdf8' }}>Drag:</span> Pan / Orbit</div>
              <div style={{ pointerEvents: 'none' }}>⌨️ <span style={{ color: '#38bdf8' }}>Shift + Drag:</span> Rotate & Tilt</div>
              <div style={{ pointerEvents: 'none' }}>🔄 <span style={{ color: '#38bdf8' }}>Scroll:</span> Zoom <span style={{ color: 'rgba(56, 189, 248, 0.6)' }}>[Shift+Scroll to Tilt]</span></div>
            </div>
          )}
        </>
      )}

      {/* 3D Loading Overlay */}
      {mapMode === '3d' && mapStyle === 'buildings' && !tilesetLoaded && !mapError && (
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
        <div style={{
          position: 'absolute',
          left: `${tooltipLeft}px`,
          top: `${tooltipTop}px`,
          background: 'rgba(11, 19, 43, 0.98)',
          border: hoverTooltip.type === 'regulation'
            ? '1px solid rgba(168, 85, 247, 0.8)'
            : hoverTooltip.type === 'event'
            ? '1px solid rgba(251, 146, 60, 0.8)'
            : '1px solid rgba(0, 240, 255, 0.8)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.5',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: hoverTooltip.type === 'regulation'
            ? '0 6px 20px rgba(0, 0, 0, 0.85), 0 0 10px rgba(168, 85, 247, 0.3)'
            : hoverTooltip.type === 'event'
            ? '0 6px 20px rgba(0, 0, 0, 0.85), 0 0 10px rgba(251, 146, 60, 0.3)'
            : '0 6px 20px rgba(0, 0, 0, 0.85), 0 0 10px rgba(0, 240, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          maxWidth: `${tooltipWidth}px`,
          width: `${tooltipWidth}px`,
          wordBreak: 'break-word',
          whiteSpace: 'normal'
        }}>
          {parsed.details && Object.keys(parsed.details).length > 0 ? (
            <div>
              {/* Header */}
              <div style={{ 
                borderBottom: hoverTooltip.type === 'regulation'
                  ? '1px solid rgba(168, 85, 247, 0.3)'
                  : hoverTooltip.type === 'event'
                  ? '1px solid rgba(251, 146, 60, 0.3)'
                  : '1px solid rgba(0, 240, 255, 0.3)',
                paddingBottom: '6px',
                marginBottom: '6.5px', 
                fontWeight: 'bold', 
                color: '#ffffff',
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
                      <span style={{ color: '#94a3b8', fontWeight: '500' }}>{label}:</span>
                      <span style={{ 
                        color: upperVal === 'IN EFFECT' || upperVal === 'ACTIVE' || upperVal === 'TRUE' ? '#22c55e' : 
                               upperVal === 'PROPOSED' || upperVal === 'PENDING' ? '#facc15' :
                               upperVal === 'HIGH' || upperVal === 'CRITICAL' ? '#ef4444' : 
                               /^S[1-5]$/.test(upperVal) ? (SEV_COLORS[parseInt(upperVal[1])] || '#ff2d55') :
                               '#f8fafc',
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
          background: 'rgba(5, 11, 28, 0.85)',
          border: '1px solid #00f0ff',
          borderRadius: '10px',
          padding: '16px',
          fontFamily: 'Courier New, monospace',
          color: '#ffffff',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 240, 255, 0.25)',
          backdropFilter: 'blur(16px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'auto',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>

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
