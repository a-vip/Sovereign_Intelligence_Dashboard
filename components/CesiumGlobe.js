'use client';
import { useEffect, useRef, useState, useMemo } from 'react';

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function CesiumGlobe({ displayedMarkers = [], onPointClick = null, mapMode = '2d', mapStyle = 'satellite' }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const tilesetRef = useRef(null);
  
  const [mapError, setMapError] = useState(false);
  const [tilesetLoaded, setTilesetLoaded] = useState(false);
  const [tilesetLoadingStatus, setTilesetLoadingStatus] = useState('idle'); // 'idle', 'loading', 'loaded', 'error'

  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  // Stabilize callback references using a ref to prevent Cesium viewer unmount/recreation loops
  const onPointClickRef = useRef(onPointClick);
  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

  // Pre-calculate repelled coordinates to prevent overlapping clusters on both maps!
  const repelledMarkers = useMemo(() => {
    if (!displayedMarkers || displayedMarkers.length === 0) return [];
    
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
  }, [displayedMarkers]);

  // 1. Initialize Leaflet ONLY as a graceful robust fallback if WebGL/Cesium fails
  useEffect(() => {
    if (!mapError || !leafletContainerRef.current) return;
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
  }, [mapError]);

  // 2. Update threat markers on Leaflet fallback map
  useEffect(() => {
    if (!mapError || !leafletMapRef.current) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) {
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
  }, [mapError, repelledMarkers]);

  // 3. Initialize Cesium Globe cleanly on mount with Google satellite base layer (safe for 2D/3D modes)
  useEffect(() => {
    if (mapError || typeof window === 'undefined' || !containerRef.current || viewerRef.current) return;

    const Cesium = window.Cesium;
    if (!Cesium) {
      console.warn("CesiumJS not available in window. Falling back to Leaflet.");
      setMapError(true);
      return;
    }

    let viewer;
    try {
      // Premium imagery provider url based on user style selection (Google Hybrid or Tactical Dark)
      const mapUrl = mapStyle === 'dark'
        ? 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

      const satelliteProvider = new Cesium.UrlTemplateImageryProvider({
        url: mapUrl,
        credit: mapStyle === 'dark' ? 'CartoDB Dark Matter' : 'Google Maps'
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

      // Screen space event handler for selection and navigation
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      // Hover pick handler to show labels & pointer cursor
      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.endPosition);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.label) {
          document.body.style.cursor = 'pointer';
          viewer.entities.values.forEach(entity => {
            if (entity.label) entity.label.show = false;
          });
          pickedObject.id.label.show = true;
        } else {
          document.body.style.cursor = 'default';
          viewer.entities.values.forEach(entity => {
            if (entity.label) entity.label.show = false;
          });
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // Left-click pick handler to select threat event details
      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
          const metadata = pickedObject.id.properties.getValue(Cesium.JulianDate.now());
          if (onPointClickRef.current && metadata) {
            onPointClickRef.current(metadata);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;

      // Clean up on unmount
      return () => {
        handler.destroy();
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
        tilesetRef.current = null;
      };
    } catch (e) {
      console.error("Cesium globe initialization failed. Switching to 2D Fallback:", e);
      setMapError(true);
    }
  }, [mapError]);

  // 4. Handle Google 3D Tileset loading and visibility based on Map Mode
  useEffect(() => {
    if (mapError || !viewerRef.current) return;
    
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    if (mapMode === '3d') {
      // Toggle 3D buildings overlay on
      if (tilesetRef.current) {
        tilesetRef.current.show = true;
      } else if (tilesetLoadingStatus === 'idle') {
        setTilesetLoadingStatus('loading');
        setTilesetLoaded(false);
        console.log("Zoomed/Toggled in! Dynamically loading Google Photorealistic 3D Tileset overlay...");

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
      // Toggle 3D buildings overlay off (keep the beautiful satellite globe visible)
      if (tilesetRef.current) {
        tilesetRef.current.show = false;
      }
    }
  }, [mapMode, tilesetLoadingStatus, mapError]);

  // 5. Update threat markers on Cesium Globe
  useEffect(() => {
    if (mapError || !viewerRef.current) return;

    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    if (!Cesium) return;

    // Clear previously rendered entities
    viewer.entities.removeAll();

    repelledMarkers.forEach(m => {
      if (m.repelledLat === undefined || m.repelledLon === undefined) return;

      const sevColorStr = SEV_COLORS[m.severity] || '#ff2d55';

      // Threat circle billboard marker (perfectly clamped to terrain and 3D building rooftops!)
      viewer.entities.add({
        id: m.id || m.title,
        name: m.title || m.name,
        position: Cesium.Cartesian3.fromDegrees(m.repelledLon, m.repelledLat, 0),
        point: {
          pixelSize: Math.min(10 + (m.severity || 1) * 3, 24),
          color: Cesium.Color.fromCssColorString(sevColorStr), // Colored strictly by severity!
          outlineColor: Cesium.Color.WHITE, // BEAUTIFUL OUTLINE WHITE BORDER!
          outlineWidth: 2.5, // Crisp faint white border
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Clamp exactly on top of buildings/terrain!
          disableDepthTestDistance: 100000.0, // Only disable depth test when zoomed in closer than 100km to bypass 3D buildings clipping, keeping standard occlusion active at global scale!
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
          disableDepthTestDistance: 100000.0, // Match point occlusion culling
          show: false,
        },
        properties: m,
      });

      // Expandable rippling radar waves (strictly pulse at severity 5, conforming beautifully to terrain!)
      if (m.severity >= 5) {
        let currentRadius = 15000.0;
        viewer.entities.add({
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
    });
  }, [repelledMarkers, mapError]);

  // 6. Handle Base Map Style changes dynamically in real time (Satellite vs Tactical Dark)
  useEffect(() => {
    if (mapError || !viewerRef.current) return;
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!Cesium) return;

    try {
      const mapUrl = mapStyle === 'dark'
        ? 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

      const provider = new Cesium.UrlTemplateImageryProvider({
        url: mapUrl,
        credit: mapStyle === 'dark' ? 'CartoDB Dark Matter' : 'Google Maps'
      });

      // Remove the base layer at index 0 and add the new styled layer at index 0!
      if (viewer.imageryLayers.length > 0) {
        viewer.imageryLayers.remove(viewer.imageryLayers.get(0));
      }
      viewer.imageryLayers.addImageryProvider(provider, 0);
      console.log(`Cesium base map style swapped dynamically to: ${mapStyle}`);
    } catch (e) {
      console.error("Failed to swap Cesium base map style dynamically:", e);
    }
  }, [mapStyle, mapError]);

  // 7. Update Leaflet base map layer on mapStyle changes
  useEffect(() => {
    if (!mapError || !leafletMapRef.current) return;
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

      const tileUrl = mapStyle === 'dark' 
        ? 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: mapStyle === 'dark' ? 'CartoDB' : 'Google'
      }).addTo(map);
      console.log(`Leaflet fallback base map style swapped to: ${mapStyle}`);
    } catch (e) {
      console.error("Failed to swap Leaflet base map style:", e);
    }
  }, [mapError, mapStyle]);

  // 8. Capture and normalize wheel zoom for perfect laptop trackpad and mouse scroll zoom!
  useEffect(() => {
    if (mapError || !viewerRef.current) return;
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

      // 1. TILT/ANGLE ACTION: If Ctrl or Shift is held down while scrolling
      if (e.ctrlKey || e.shiftKey || e.altKey) {
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
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [mapError]);

  const is2DActive = mapError;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#020617' }}>
      
      {/* 2D Leaflet Map Container (Active strictly as a robust fallback only) */}
      <div 
        ref={leafletContainerRef} 
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
