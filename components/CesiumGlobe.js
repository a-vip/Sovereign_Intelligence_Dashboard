'use client';
import { useEffect, useRef, useState } from 'react';

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };
const CAT_COLORS = {
  Conflict: '#ff2d55',
  Surveillance: '#00f0ff',
  Political: '#a855f7',
  Humanitarian: '#22c55e',
  Economic: '#facc15',
  Disaster: '#ff6b35',
};

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyD4DuTPeIASgReG0AAlR8ZSZOlHw8alqME';

export default function CesiumGlobe({ displayedMarkers = [], onPointClick = null, mapMode = '3d' }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const tilesetRef = useRef(null);
  const imageryLayerRef = useRef(null);
  
  const [cesiumLoaded, setCesiumLoaded] = useState(false);
  const [tilesetLoaded, setTilesetLoaded] = useState(false);

  // Stabilize callback references using a ref to prevent Cesium viewer unmount/recreation loops
  const onPointClickRef = useRef(onPointClick);
  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

  // 1. Dynamic CDN script and style injection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('cesium-css')) {
      const link = document.createElement('link');
      link.id = 'cesium-css';
      link.rel = 'stylesheet';
      link.href = 'https://ajax.googleapis.com/ajax/libs/cesiumjs/1.105/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);
    }

    if (!window.Cesium) {
      // Set the base URL for Cesium background workers BEFORE script injection
      window.CESIUM_BASE_URL = 'https://ajax.googleapis.com/ajax/libs/cesiumjs/1.105/Build/Cesium/';
      
      const script = document.createElement('script');
      script.src = 'https://ajax.googleapis.com/ajax/libs/cesiumjs/1.105/Build/Cesium/Cesium.js';
      script.async = true;
      script.onload = () => setCesiumLoaded(true);
      document.head.appendChild(script);
    } else {
      setCesiumLoaded(true);
    }
  }, []);

  // 2. Initialize Cesium.Viewer and load Google 3D Tiles
  useEffect(() => {
    if (!cesiumLoaded || !containerRef.current || viewerRef.current) return;

    const Cesium = window.Cesium;
    if (!Cesium) return;

    // Initialize clean viewer optimized for dark cyber dashboard
    const viewer = new Cesium.Viewer(containerRef.current, {
      imageryProvider: false, // Loaded dynamically to prevent flickering
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
      requestRenderMode: false, // Prevent flashing/disappearing points by rendering continuously
      fullscreenButton: false,
      vrButton: false,
    });

    viewerRef.current = viewer;

    // A. Initialize Google hybrid satellite imagery layer
    const googleSatelliteProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' // Google hybrid satellite tiles
    });
    const imageryLayer = viewer.imageryLayers.addImageryProvider(googleSatelliteProvider);
    imageryLayerRef.current = imageryLayer;
    imageryLayer.show = mapMode === '2d';

    // B. Load Google Photorealistic 3D Tileset using correct fromUrl async constructor
    Cesium.Cesium3DTileset.fromUrl(
      `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_API_KEY}`,
      { showCreditsOnScreen: true }
    ).then(tileset => {
      viewer.scene.primitives.add(tileset);
      tilesetRef.current = tileset;
      tileset.show = mapMode === '3d';
      setTilesetLoaded(true);
    }).catch(err => {
      console.error("Error loading Google 3D Tiles:", err);
      setTilesetLoaded(true);
    });

    // C. Sync initial globe visibility
    viewer.scene.globe.show = mapMode === '2d';
    
    // Set premium initial viewpoint (zoomed out showing the full globe mesh)
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(12.0, 20.0, 15000000.0),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0
      }
    });

    // 3. Dynamic Interactive Pick Handlers (Click & Hover)
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    // Hover pick handler to show labels & cursors
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

    // Left-click pick handler to select event details and animate a premium 3D tilted flyTo zoom
    handler.setInputAction((movement) => {
      const pickedObject = viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        const metadata = pickedObject.id.properties.getValue(Cesium.JulianDate.now());
        if (onPointClickRef.current && metadata) {
          onPointClickRef.current(metadata);
        }

        // Smoothly fly and tilt to the clicked geolocated threat
        const position = pickedObject.id.position.getValue(Cesium.JulianDate.now());
        if (position) {
          viewer.camera.flyTo({
            destination: position,
            duration: 1.8,
            offset: new Cesium.HeadingPitchRange(
              Cesium.Math.toRadians(0.0),
              Cesium.Math.toRadians(-40.0), // Perfect 3D building architectural perspective angle
              18000.0 // Elevate to 18km high zoom
            )
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Clean up pick handlers and viewer on unmount
    return () => {
      handler.destroy();
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [cesiumLoaded]);

  // 4. Dynamically toggle Map Mode layers without destroying the viewer
  useEffect(() => {
    if (!cesiumLoaded || !viewerRef.current) return;
    
    const viewer = viewerRef.current;
    
    if (mapMode === '3d') {
      viewer.scene.globe.show = false; // Hide flat terrain to enable photorealistic 3D mesh
      if (tilesetRef.current) tilesetRef.current.show = true;
      if (imageryLayerRef.current) imageryLayerRef.current.show = false;
    } else {
      viewer.scene.globe.show = true; // Show base satellite globe
      if (tilesetRef.current) tilesetRef.current.show = false;
      if (imageryLayerRef.current) imageryLayerRef.current.show = true;
    }
  }, [cesiumLoaded, mapMode]);

  // 5. Update threat circle entities on displayedMarkers changes
  useEffect(() => {
    if (!cesiumLoaded || !viewerRef.current) return;

    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    
    // Clear previously rendered entities
    viewer.entities.removeAll();

    // Group markers to calculate symmetrical spreading offsets
    const coordGroups = {};
    displayedMarkers.forEach(m => {
      if (m.lat === undefined || m.lon === undefined || m.lat === null || m.lon === null) return;
      const key = `${m.lat.toFixed(3)}_${m.lon.toFixed(3)}`;
      if (!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(m);
    });

    displayedMarkers.forEach(m => {
      if (m.lat === undefined || m.lon === undefined || m.lat === null || m.lon === null) return;
      
      let finalLat = m.lat;
      let finalLon = m.lon;
      
      const key = `${m.lat.toFixed(3)}_${m.lon.toFixed(3)}`;
      const group = coordGroups[key];
      if (group && group.length > 1) {
        const index = group.indexOf(m);
        // Clean spread offset in degrees for 3D navigation
        const radius = 0.08; 
        const angle = (index * 2 * Math.PI) / group.length;
        finalLat += radius * Math.sin(angle);
        finalLon += radius * Math.cos(angle);
      }

      const colorStr = CAT_COLORS[m.category] || '#94a3b8';
      const sevColorStr = SEV_COLORS[m.severity] || '#ff2d55';

      // Threat circle billboard marker
      viewer.entities.add({
        id: m.id || m.title,
        name: m.title || m.name,
        position: Cesium.Cartesian3.fromDegrees(finalLon, finalLat, 150), // Elevated on top of 3D terrain
        point: {
          pixelSize: Math.min(10 + (m.severity || 1) * 3, 24),
          color: Cesium.Color.fromCssColorString(colorStr),
          outlineColor: Cesium.Color.fromCssColorString(sevColorStr),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY, // Ensure circles remain on top of buildings
        },
        label: {
          text: `${m.title || m.name}\n[S${m.severity} • ${m.category}]`,
          font: 'bold 9pt monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: false,
        },
        properties: m,
      });

      // Expandable rippling radar waves for critical items
      if (m.severity >= 4) {
        let currentRadius = 15000.0;
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(finalLon, finalLat, 100),
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
            height: 100,
          }
        });
      }
    });
  }, [cesiumLoaded, displayedMarkers]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#020617' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!tilesetLoaded && (
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
    </div>
  );
}
