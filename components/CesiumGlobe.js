'use client';
import { useEffect, useRef, useState, useMemo } from 'react';

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const createEmojiCanvas = (emoji, size = 32) => {
  if (typeof document === 'undefined') return null;
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
  return canvas;
};

const createCircleCanvas = (color, size = 16, outlineColor = '#ffffff', outlineWidth = 1.5) => {
  if (typeof document === 'undefined') return null;
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
  
  return canvas;
};

const createDropletCanvas = (color, size = 32) => {
  if (typeof document === 'undefined') return null;
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
  return canvas;
};

const createPowerCanvas = (color, size = 32) => {
  if (typeof document === 'undefined') return null;
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
  return canvas;
};

export default function CesiumGlobe({ 
  displayedMarkers = [], 
  onPointClick = null, 
  mapMode = '2d', 
  mapStyle = 'satellite', 
  onMapModeChange = null,
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
  globe3dEnabled = true
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const tilesetRef = useRef(null);
  const petroleumLayerRef = useRef(null);
  const powerLayerRef = useRef(null);
  const cableEntitiesRef = useRef([]);
  const oilGasEntitiesRef = useRef([]);

  const [hoverTooltip, setHoverTooltip] = useState({ show: false, x: 0, y: 0, content: '' });
  const setHoverTooltipRef = useRef(setHoverTooltip);
  useEffect(() => {
    setHoverTooltipRef.current = setHoverTooltip;
  }, [setHoverTooltip]);

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
  
  const [mapError, setMapError] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

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

  // 4. Buttery smooth auto rotation of the globe until user interacts with the camera!
  useEffect(() => {
    if (!scriptsLoaded || !viewerRef.current || !autoRotate || mapError || !viewerReady) return;

    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    let lastTime = performance.now();
    let listener;

    const rotateCamera = (scene, time) => {
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000.0;
      lastTime = currentTime;

      // Slow, relaxing drift around the Earth (e.g. 0.035 radians per second)
      const rotationSpeed = 0.035; 
      viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, rotationSpeed * delta);
    };

    listener = viewer.scene.postRender.addEventListener(rotateCamera);

    return () => {
      if (listener && viewer && viewer.scene && !viewer.isDestroyed()) {
        viewer.scene.postRender.removeEventListener(rotateCamera);
      }
    };
  }, [autoRotate, mapError, viewerReady, scriptsLoaded]);

  const handleUserInteraction = () => {
    if (autoRotate && onInteraction) {
      onInteraction();
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

  // 1. Initialize Leaflet ONLY as a graceful robust fallback if WebGL/Cesium fails
  useEffect(() => {
    if (!scriptsLoaded || !mapError || !leafletContainerRef.current) return;
    if (leafletMapRef.current) return;

    const L = window.L;
    if (!L) return;

    try {
      const map = L.map(leafletContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true
      }).setView([20.0, 12.0], 2);

      leafletMapRef.current = map;

      // Premium dark satellite layer
      L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 19,
        attribution: 'Google'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      console.log("Leaflet 2D satellite fallback map initialized.");
    } catch (e) {
      console.error("Leaflet initialization failed:", e);
    }
  }, [mapError, scriptsLoaded]);

  // 2. Update threat markers on Leaflet fallback map
  useEffect(() => {
    if (!scriptsLoaded || !mapError || !leafletMapRef.current) return;

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
        <div style="font-family: monospace; font-size: 11px; padding: 6px 10px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 6px; color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); max-width: 250px; white-space: normal; word-break: break-word;">
          <strong style="display: block; margin-bottom: 4px; color: #ffffff;">${m.title || m.name}</strong>
          <span style="color: ${sevColorStr}; font-weight: bold;">Severity ${m.severity}</span> • 
          <span style="color: #94a3b8; font-weight: 500;">${m.category}</span>
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
          <div style="font-family: monospace; font-size: 11px; padding: 6px 10px; background: rgba(11, 17, 32, 0.95); border: 1px solid rgba(0, 255, 255, 0.3); border-radius: 6px; color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); max-width: 250px; white-space: normal; word-break: break-word;">
            <strong style="color: #00ffff; display: block; margin-bottom: 2px;">📡 ${sat.name}</strong>
            <span>NORAD: ${sat.code}</span><br/>
            <span>Alt: ${sat.altitude} km</span><br/>
            <span>V: ${sat.velocity} km/s</span>
          </div>
        `, {
          direction: 'top',
          className: 'leaflet-tooltip-custom',
          permanent: true,
          sticky: false,
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
  }, [mapError, repelledMarkers, scriptsLoaded, showSatellites, satellites, selectedSatellite]);

  // Handle Map and View Reset trigger upon clicking the Refresh icon in LiveMap
  useEffect(() => {
    if (resetKey > 0) {
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

      // 2. Reset 2D Leaflet Fallback map position
      if (mapError && leafletMapRef.current) {
        leafletMapRef.current.setView([20.0, 12.0], 2);
      }
    }
  }, [resetKey, mapError]);

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
        requestRenderMode: false,
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

      // Screen space event handler for selection and navigation
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      // Hover pick handler to show threat labels, toggle cursor pointer, and maintain satellite labels safely
      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.endPosition);
        
        let hoveredEntity = null;
        if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
          hoveredEntity = pickedObject.id;
        }

        if (hoveredEntity) {
          const props = hoveredEntity.properties;
          const isCable = props && props.isCable ? props.isCable.getValue() : false;
          const isLandingStation = props && props.isLandingStation ? props.isLandingStation.getValue() : false;
          const isOilGas = props && props.isOilGas ? props.isOilGas.getValue() : false;
          const title = props && props.title ? props.title.getValue() : (hoveredEntity.name || '');

          if (isCable || isLandingStation || isOilGas) {
            document.body.style.cursor = 'pointer';
            if (typeof setHoverTooltipRef.current === 'function') {
              setHoverTooltipRef.current({
                show: true,
                x: movement.endPosition.x,
                y: movement.endPosition.y,
                content: title
              });
            }
            return;
          }

          // Clear cables tooltip for other entities
          if (typeof setHoverTooltipRef.current === 'function') {
            setHoverTooltipRef.current({ show: false, x: 0, y: 0, content: '' });
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
            // Hovered over a threat event point: show pointer cursor and show *only* this point's label
            document.body.style.cursor = 'pointer';
            
            viewer.entities.values.forEach(entity => {
              if (entity.label) {
                const entIsSat = getIsSatellite(entity);
                if (!entIsSat) {
                  entity.label.show = (entity === hoveredEntity);
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
            setHoverTooltipRef.current({ show: false, x: 0, y: 0, content: '' });
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

      // Left-click pick handler to select threat event details or satellites
      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
          const metadata = pickedObject.id.properties.getValue(Cesium.JulianDate.now());
          if (metadata && metadata.isSatellite) {
            if (onSatelliteClickRef.current) {
              onSatelliteClickRef.current(metadata);
            }
          } else if (onPointClickRef.current && metadata) {
            onPointClickRef.current(metadata);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;
      setViewerReady(true);

      // Clean up on unmount
      return () => {
        handler.destroy();
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
        setViewerReady(false);
        tilesetRef.current = null;
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

    const shouldShow3d = mapMode === '3d' || mapStyle === 'buildings';

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
    const viewer = viewerRef.current;
    if (!Cesium) return;

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
      const newPos = Cesium.Cartesian3.fromDegrees(m.repelledLon, m.repelledLat, 0);

      const existing = viewer.entities.getById(threatId);
      if (existing) {
        // Surgically update properties on the existing persistent entity
        const currentPos = existing.position.getValue(Cesium.JulianDate.now());
        if (!Cesium.Cartesian3.equals(currentPos, newPos)) {
          existing.position = newPos;
        }
        if (existing.label) {
          existing.label.text = `${m.title || m.name}\n[Severity ${m.severity} • ${m.category}]`;
        }
        existing.properties = m;
      } else {
        // Threat circle billboard marker (perfectly clamped to terrain and 3D building rooftops!)
        viewer.entities.add({
          id: threatId,
          name: m.title || m.name,
          position: newPos,
          billboard: {
            image: createCircleCanvas(sevColorStr, 6 + (m.severity || 1) * 1.5, '#ffffff', 1.5),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Clamp exactly on top of buildings/terrain!
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: 100000.0, // Disable depth testing when zoomed in closer than 100km to bypass 3D buildings, but keep depth testing enabled at global scale so back-side points are hidden!
          },
          label: {
            text: `${m.title || m.name}\n[Severity ${m.severity} • ${m.category}]`,
            font: 'bold 9pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.85), // PREMIUM GLASSMORPHIC DARK SLATE BOX BACKGROUND!
            backgroundPadding: new Cesium.Cartesian2(10, 6), // Crisp padding
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20), // Lift slightly higher above point
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Align label elevation with clamped point
            disableDepthTestDistance: 100000.0, // Match billboard occlusion culling
            show: false,
          },
          properties: m,
        });
      }

      // Expandable rippling radar waves (strictly pulse at severity 5, conforming beautifully to terrain!)
      if (m.severity >= 5) {
        const pulseId = `threat-pulse-${m.id || m.title}`;
        if (!viewer.entities.getById(pulseId)) {
          let currentRadius = 15000.0;
          viewer.entities.add({
            id: pulseId,
            position: Cesium.Cartesian3.fromDegrees(m.repelledLon, m.repelledLat, 0),
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
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Conform to the actual terrain/buildings!
            }
          });
        }
      }
    });
  }, [repelledMarkers, mapError, scriptsLoaded]);

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
              ? `${sat.name}\nAlt: ${sat.altitude}km • Inc: ${sat.inclination}° • V: ${sat.velocity}km/s`
              : sat.name;
            existingSat.label.font = isSelected ? 'bold 8pt monospace' : '7pt monospace';
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
                ? `${sat.name}\nAlt: ${sat.altitude}km • Inc: ${sat.inclination}° • V: ${sat.velocity}km/s`
                : sat.name,
              font: isSelected ? 'bold 8pt monospace' : '7pt monospace',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#0b1120').withAlpha(0.85),
              backgroundPadding: new Cesium.Cartesian2(6, 4),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              heightReference: Cesium.HeightReference.NONE,
              show: true,
              disableDepthTestDistance: 100000.0
            },
            properties: { ...sat, isSatellite: true }
          });
        }
      });
    }

    // Always clear old selected satellite trajectory trails first to re-plot them correctly
    ['sat-orbit-predicted', 'sat-orbit-history', 'sat-nadir-beam', 'sat-nadir-footprint'].forEach(id => {
      const ent = viewer.entities.getById(id);
      if (ent) viewer.entities.remove(ent);
    });

    // Render clicked Satellite flight path orbit ring, scanning laser beam & ground footprint footprint!
    if (showSatellites && selectedSatellite) {
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

      // Find the index of the orbit point closest to the satellite's current coordinates to establish motion direction
      let closestIdx = 0;
      let minDistance = Infinity;
      const satPos = Cesium.Cartesian3.fromDegrees(selectedSatellite.longitude, selectedSatellite.latitude, selectedSatellite.altitude * 1000);
      
      points.forEach((pt, idx) => {
        const dist = Cesium.Cartesian3.distance(pt, satPos);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      // Split into History Trail (180 degrees behind) and Projected Path (180 degrees ahead)
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
          width: 5.0, // Thicker to highlight the direction arrow clearly
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

      // 3. Vertical Tactical Nadir Scan Beam (Laser connecting satellite to ground point)
      viewer.entities.add({
        id: 'sat-nadir-beam',
        polyline: {
          positions: [
            Cesium.Cartesian3.fromDegrees(selectedSatellite.longitude, selectedSatellite.latitude, selectedSatellite.altitude * 1000),
            Cesium.Cartesian3.fromDegrees(selectedSatellite.longitude, selectedSatellite.latitude, 0)
          ],
          width: 2.0,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.35,
            color: Cesium.Color.fromCssColorString('#00ffff').withAlpha(0.6)
          })
        }
      });

      // 4. Ground-Conforming Expanding Footprint Radar Footprint (pulsing loop)
      let scanningRadius = 300000.0;
      viewer.entities.add({
        id: 'sat-nadir-footprint',
        position: Cesium.Cartesian3.fromDegrees(selectedSatellite.longitude, selectedSatellite.latitude, 0),
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

  // D. IEM Weather Radar Tiles & Rain Post-Processing Particle Effects
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    let weatherLayer = null;
    let rainStage = null;

    if (weatherEnabled) {
      // 1. Add IEM NEXRAD Weather Radar Tiles
      const weatherProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
        credit: 'IEM Weather Radar',
        alpha: 0.65
      });
      
      try {
        weatherLayer = viewer.imageryLayers.addImageryProvider(weatherProvider);
      } catch (err) {
        console.warn("Weather radar tiles failed to add:", err);
      }

      // 2. Add screen space rain post-process storm overlay
      try {
        rainStage = Cesium.PostProcessStageLibrary.createRainStage();
        viewer.scene.postProcessStages.add(rainStage);
      } catch (err) {
        console.warn("Cesium rain stage post-process failed:", err);
      }
    }

    return () => {
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
                position: Cesium.Cartesian3.fromDegrees(point.coordinate[0], point.coordinate[1]),
                billboard: {
                  image: createTeardropCanvas(point.color),
                  width: 4, // Even smaller and cleaner
                  height: 6,
                  color: new Cesium.Color(1.0, 1.0, 1.0, 0.45), // Gorgeous translucent appearance (45% opacity)
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM
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
  }, [oilGasEnabled, scriptsLoaded, mapError, viewerReady]);

  // F. Undersea Internet Fiber Optic Cables (TeleGeography Submarine Cable API)
  useEffect(() => {
    if (!viewerRef.current || !scriptsLoaded || mapError || !viewerReady) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

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
                  material: color.withAlpha(0.3) // Faint and elegant translucent style
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
                position: Cesium.Cartesian3.fromDegrees(geometry.coordinates[0], geometry.coordinates[1]),
                point: {
                  pixelSize: 2.0, // Very small and cute circles
                  color: Cesium.Color.fromCssColorString('#a855f7').withAlpha(0.4), // Faint purple/violet circle
                  outlineColor: Cesium.Color.WHITE.withAlpha(0.4), // Faint outline
                  outlineWidth: 0.4
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
  }, [internetCablesEnabled, scriptsLoaded, mapError, viewerReady]);

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

  const is2DActive = mapError;

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
                if (onMapModeChange) {
                  onMapModeChange(mapMode === '3d' ? '2d' : '3d');
                }
              }}
              style={{
                width: '36px', height: '36px',
                background: mapMode === '3d' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(8, 12, 24, 0.85)',
                border: mapMode === '3d' ? '1px solid #00f0ff' : '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px',
                color: mapMode === '3d' ? '#00f0ff' : '#38bdf8',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: mapMode === '3d' ? '0 0 12px rgba(0, 240, 255, 0.35)' : '0 4px 12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              title={mapMode === '3d' ? "Switch to 2D Map" : "Enable 3D Photorealistic Buildings Mode"}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f0ff';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = mapMode === '3d' ? '#00f0ff' : 'rgba(56, 189, 248, 0.3)';
                e.currentTarget.style.color = mapMode === '3d' ? '#00f0ff' : '#38bdf8';
                e.currentTarget.style.boxShadow = mapMode === '3d' ? '0 0 12px rgba(0, 240, 255, 0.35)' : '0 4px 12px rgba(0,0,0,0.5)';
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
      {mapMode === '3d' && !tilesetLoaded && !mapError && (
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
          left: `${hoverTooltip.x + 12}px`,
          top: `${hoverTooltip.y - 12}px`,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.6)',
          borderRadius: '4px',
          padding: '5px 9px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '11px',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)'
        }}>
          {hoverTooltip.content}
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
        }
        .leaflet-tooltip-dark:before {
          border-top-color: rgba(15, 23, 42, 0.95) !important;
        }
      `}</style>
    </div>
  );
}
