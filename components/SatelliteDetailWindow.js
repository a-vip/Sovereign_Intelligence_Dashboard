'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// Hubble deep-space astronomical images (Unsplash public captures, fast & reliable CDN)
const HUBBLE_IMAGES = [
  { name: 'Pillars of Creation (HST Re-imaging)', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80' },
  { name: 'Whirlpool Galaxy (M51 Spiral)', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&auto=format&fit=crop&q=80' },
  { name: 'Carina Nebula Cosmic Cliffs', url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=600&auto=format&fit=crop&q=80' },
  { name: 'Andromeda Galaxy (M31 Helix)', url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=600&auto=format&fit=crop&q=80' }
];

export default function SatelliteDetailWindow({ satellite, onClose, isTracked, onTrackToggle }) {
  // Collapsible compact state
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Active Tab state: 'telemetry' or 'cam'
  const [activeTab, setActiveTab] = useState('telemetry');

  // Position starts relative to viewport size
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const containerRef = useRef(null);

  // Initialize position centered nicely above bottom toolbar
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const initialX = window.innerWidth - (isMobile ? 300 : 600);
    const initialY = window.innerHeight - (isMobile ? 540 : 540);
    setPos({ x: initialX, y: initialY });
  }, []);

  // Desktop Mouse Drag handlers
  const handleDragStart = (e) => {
    if (e.button !== 0) return; // Left click only
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
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    const newX = Math.max(10, Math.min(window.innerWidth - 295, dragRef.current.startPosX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - (isCollapsed ? 120 : 320), dragRef.current.startPosY + dy));
    
    setPos({ x: newX, y: newY });
  }, [isDragging, isCollapsed]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  // Mobile Touch Drag handlers (Advanced Touch Support!)
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    
    const newX = Math.max(10, Math.min(window.innerWidth - 295, dragRef.current.startPosX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - (isCollapsed ? 120 : 320), dragRef.current.startPosY + dy));
    
    setPos({ x: newX, y: newY });
    // Prevent screen bouncing when dragging on mobile
    if (e.cancelable) e.preventDefault();
  }, [isDragging, isCollapsed]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd, handleTouchMove, handleTouchEnd]);

  // Dynamic Telemetry updates
  const [liveLatency, setLiveLatency] = useState(124);
  const [liveSignal, setLiveSignal] = useState(98);
  const [downlinkRate, setDownlinkRate] = useState(4.8);
  const [hubbleIdx, setHubbleIdx] = useState(0);
  const [issSource, setIssSource] = useState('youtube'); // 'youtube' | 'timelapse' | 'matrix'
  const [hubbleFilter, setHubbleFilter] = useState('vis'); // 'vis' | 'ir' | 'uv'

  // Get CSS filter styling for Hubble multi-spectral camera
  const getHubbleFilterStyle = () => {
    switch (hubbleFilter) {
      case 'ir':
        // Simulated Infrared (Infrared typically shifts to red/pink, warm glow, high contrast)
        return {
          filter: 'hue-rotate(140deg) saturate(1.8) contrast(1.3) brightness(0.9)',
          transition: 'filter 0.5s ease-in-out'
        };
      case 'uv':
        // Simulated Ultraviolet (High energy cosmic radiation, bluish-purple neon tint, inverted glow)
        return {
          filter: 'hue-rotate(240deg) invert(0.2) saturate(2.5) contrast(1.5)',
          transition: 'filter 0.5s ease-in-out'
        };
      case 'vis':
      default:
        return {
          filter: 'none',
          transition: 'filter 0.5s ease-in-out'
        };
    }
  };

  // General Scrolling SIGINT Telemetry Intercept Logs
  const [sigintLogs, setSigintLogs] = useState([
    'SYSTEM PROTOCOL INITIALIZED',
    'SAR APERTURE RADAR SWEEP ACTIVE',
    'SIGINT FREQUENCY TARGET LOCKED'
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLatency(prev => Math.max(112, Math.min(138, prev + Math.floor(Math.random() * 7) - 3)));
      setLiveSignal(prev => Math.max(94, Math.min(100, prev + Math.floor(Math.random() * 3) - 1)));
      setDownlinkRate(prev => Math.max(4.4, Math.min(5.2, parseFloat((prev + (Math.random() * 0.4 - 0.2)).toFixed(1)))));
      
      // Rotate simulated Hubble images
      setHubbleIdx(prev => (prev + 1) % HUBBLE_IMAGES.length);

      // Add dynamic sci-fi logs
      const logTemplates = [
        `REFLECTANCE COEFF: 0.${Math.floor(Math.random() * 800) + 100} ALBEDO`,
        `TARGET ALIGNMENT: CENTERED [${(Math.random() * 0.05).toFixed(4)} OFFSET]`,
        `DOWNLINK SIGNAL: ${Math.random() > 0.5 ? 'NOMINAL' : 'ENCRYPTED Carrier'}`,
        `IONOSPHERE BEACON STABILITY: 99.${Math.floor(Math.random() * 9)}%`,
        `SIGINT INTERCEPT RATIO: ${Math.floor(Math.random() * 40) + 20} carriers/sec`
      ];
      setSigintLogs(prev => [logTemplates[Math.floor(Math.random() * logTemplates.length)], prev[0], prev[1]]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isISS = satellite.code === '25544' || satellite.name.includes('ISS');
  const isHubble = satellite.code === '20580' || satellite.name.includes('HUBBLE');

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        width: '290px',
        background: 'rgba(8, 12, 24, 0.94)',
        border: '1px solid rgba(0, 240, 255, 0.7)',
        borderRadius: '12px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(0, 240, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '12px',
        zIndex: 9999,
        fontFamily: 'Courier New, monospace',
        color: '#ffffff',
        transition: 'height 0.2s ease, transform 0.05s linear',
        userSelect: 'none'
      }}
    >
      {/* HUD Header (Draggable Handle) */}
      <div 
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchStart}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid rgba(0, 240, 255, 0.25)', 
          paddingBottom: '8px', 
          marginBottom: '8px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            animation: 'pulse 1.2s infinite', 
            width: '6px', 
            height: '6px', 
            background: isTracked ? '#facc15' : '#00f0ff', 
            borderRadius: '50%' 
          }} />
          <strong style={{ color: isTracked ? '#facc15' : '#00f0ff', fontSize: '9px', letterSpacing: '0.1em' }}>
            {isTracked ? 'TRACKING LOCKED' : 'SPACE TELEMETRY'}
          </strong>
        </div>
        
        {/* Header Controls (Minimize & Close) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 'bold',
              lineHeight: 1,
              outline: 'none',
              padding: '2px 4px'
            }}
            title={isCollapsed ? "Expand HUD" : "Minimize HUD"}
          >
            {isCollapsed ? '+' : '−'}
          </button>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'rgba(255, 255, 255, 0.5)', 
              cursor: 'pointer', 
              fontSize: '15px', 
              lineHeight: 1,
              outline: 'none',
              padding: '2px 4px'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* 1. COLLAPSED VIEW LAYOUT (Super compact card for tracking overlays!) */}
      {isCollapsed ? (
        <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>NAME:</span>
            <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>{satellite.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>ALT / VELOCITY:</span>
            <span>{satellite.altitude}km @ {satellite.velocity}km/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>COORDINATES:</span>
            <span style={{ color: '#facc15' }}>{parseFloat(satellite.latitude).toFixed(2)}°, {parseFloat(satellite.longitude).toFixed(2)}°</span>
          </div>
          <button 
            onClick={onTrackToggle}
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: '4px',
              fontSize: '8.5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'Courier New, monospace',
              border: isTracked ? '1px solid #facc15' : '1px solid #00f0ff',
              background: isTracked ? 'rgba(250, 204, 21, 0.15)' : 'rgba(0, 240, 255, 0.1)',
              color: isTracked ? '#facc15' : '#00f0ff',
              outline: 'none',
              marginTop: '4px'
            }}
          >
            {isTracked ? 'RELEASE TRACKING' : 'LOCK CAMERA & TRACK'}
          </button>
        </div>
      ) : (
        /* 2. EXPANDED VIEW LAYOUT (Multi-tabbed interactive space sensor feeds!) */
        <>
          {/* Tab Selector Bar */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
            <button
              onClick={() => setActiveTab('telemetry')}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '8px',
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: activeTab === 'telemetry' ? 'rgba(0, 240, 255, 0.15)' : 'none',
                border: activeTab === 'telemetry' ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid transparent',
                borderRadius: '4px',
                color: activeTab === 'telemetry' ? '#00f0ff' : '#94a3b8',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
            >
              📊 TELEMETRY
            </button>
            <button
              onClick={() => setActiveTab('cam')}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '8px',
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: activeTab === 'cam' ? 'rgba(0, 240, 255, 0.15)' : 'none',
                border: activeTab === 'cam' ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid transparent',
                borderRadius: '4px',
                color: activeTab === 'cam' ? '#00f0ff' : '#94a3b8',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
            >
              🎥 {isISS ? 'LIVE FEED' : isHubble ? 'OPTICAL CAM' : 'SENSOR SCAN'}
            </button>
          </div>

          {/* TAB CONTENT: 1. TELEMETRY STATS */}
          {activeTab === 'telemetry' && (
            <>
              {/* Sci-Fi Radar SVG */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px', position: 'relative' }}>
                <svg width="70" height="70" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1" strokeDasharray="3, 3" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="0.5" />
                  <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="0.5" />
                  <line x1="50" y1="50" x2="50" y2="5" stroke="#00f0ff" strokeWidth="1.5">
                    <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="4s" repeatCount="indefinite" />
                  </line>
                  <circle cx="50" cy="18" r="3" fill="#00f0ff">
                    <animate attributeName="opacity" values="0.3; 1; 0.3" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <div style={{ position: 'absolute', fontSize: '8px', color: 'rgba(0, 240, 255, 0.5)', fontWeight: 'bold' }}>
                  #{satellite.code}
                </div>
              </div>

              {/* Signal Quality Mini Dashboard */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '4px', 
                background: 'rgba(0, 240, 255, 0.04)', 
                border: '1px solid rgba(0, 240, 255, 0.15)', 
                borderRadius: '6px', 
                padding: '4px 6px', 
                marginBottom: '8px', 
                fontSize: '8px', 
                textAlign: 'center' 
              }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1px' }}>SIGNAL</div>
                  <div style={{ color: '#22c55e', fontWeight: 'bold' }}>{liveSignal}%</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1px' }}>PING</div>
                  <div style={{ color: '#00f0ff', fontWeight: 'bold' }}>{liveLatency}ms</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1px' }}>DOWNLINK</div>
                  <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>{downlinkRate}G</div>
                </div>
              </div>

              {/* Stats Readout Grid */}
              <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>NAME:</span>
                  <span style={{ color: '#00f0ff', fontWeight: 'bold', maxWidth: '185px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {satellite.name}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>ALTITUDE:</span>
                  <span style={{ color: '#facc15', fontWeight: 'bold' }}>{satellite.altitude} km</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>VELOCITY:</span>
                  <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{satellite.velocity} km/s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>LATITUDE:</span>
                  <span>{parseFloat(satellite.latitude).toFixed(4)}°</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>LONGITUDE:</span>
                  <span>{parseFloat(satellite.longitude).toFixed(4)}°</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>INCLINATION:</span>
                  <span>{satellite.inclination}°</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>OPERATOR:</span>
                  <span style={{ maxWidth: '175px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{satellite.country}</span>
                </div>
              </div>
            </>
          )}

          {/* TAB CONTENT: 2. LIVE SAT-CAM / simulated FEED */}
          {activeTab === 'cam' && (
            <div style={{ marginBottom: '8px' }}>
              {/* A. ISS Live Viewport (Interactive Multi-Source System) */}
              {isISS ? (
                <div style={{ position: 'relative', width: '100%', height: '140px', background: '#000000', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                  {issSource === 'youtube' && (
                    <iframe 
                      src="https://www.youtube.com/embed/xQ04gONnVwA?autoplay=1&mute=1&loop=1&playlist=xQ04gONnVwA" 
                      style={{ width: '100%', height: '100%', border: 'none' }} 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                    />
                  )}
                  {issSource === 'timelapse' && (
                    <video
                      src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Jeff%27s_Earth_-_4K.webm"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  )}
                  {issSource === 'matrix' && (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      background: '#040814', 
                      padding: '6px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '4px',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ fontSize: '6.5px', color: '#22c55e', textTransform: 'uppercase', display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                        <div style={{ color: '#00f0ff', borderBottom: '1px solid rgba(0,240,255,0.15)', paddingBottom: '3px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                          📡 SIGINT INTERCEPT WAVEFORM
                        </div>
                        {sigintLogs.slice(0, 3).map((log, index) => (
                          <div key={index} style={{ opacity: index === 0 ? 1 : index === 1 ? 0.7 : 0.4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            &gt; {log}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '40px', gap: '2.5px', borderTop: '1px solid rgba(0,240,255,0.1)', paddingTop: '4px', overflow: 'hidden' }}>
                        {Array.from({ length: 28 }).map((_, i) => {
                          const h = Math.floor(Math.sin((i + Date.now()/600) * 0.8) * 18) + 22;
                          return (
                            <div 
                              key={i} 
                              style={{ 
                                flex: 1, 
                                height: `${Math.max(10, Math.min(100, h))}%`, 
                                background: `linear-gradient(to top, rgba(0,240,255,0.15), ${i % 4 === 0 ? '#ff007f' : '#00f0ff'})`, 
                                borderRadius: '1px' 
                              }} 
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Overlay labels */}
                  <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0, 240, 255, 0.25)', color: '#00f0ff', fontSize: '6.5px', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.4)', pointerEvents: 'none', letterSpacing: '0.05em', zIndex: 10 }}>
                    🔴 ISS LIVE FEED [{issSource.toUpperCase()}]
                  </div>

                  {/* Source Switcher Panel */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '6px', 
                    right: '6px', 
                    display: 'flex', 
                    gap: '2px', 
                    background: 'rgba(0,0,0,0.8)', 
                    padding: '2px', 
                    borderRadius: '4px', 
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    zIndex: 20
                  }}>
                    {[
                      { id: 'youtube', label: 'YT-LIVE' },
                      { id: 'timelapse', label: 'ORBIT' },
                      { id: 'matrix', label: 'SIGINT' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={(e) => { e.stopPropagation(); setIssSource(s.id); }}
                        style={{
                          fontSize: '6.5px',
                          fontWeight: 'bold',
                          fontFamily: 'Courier New, monospace',
                          padding: '2px 4px',
                          background: issSource === s.id ? 'rgba(0, 240, 255, 0.25)' : 'none',
                          border: 'none',
                          borderRadius: '2px',
                          color: issSource === s.id ? '#00f0ff' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          outline: 'none',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : /* B. SIMULATED HUBBLE DEEP SPACE OBSERVATIONAL VIEWER */
              isHubble ? (
                <div style={{ position: 'relative', width: '100%', height: '140px', background: '#020617', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={HUBBLE_IMAGES[hubbleIdx].url} 
                    alt="Space capture"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      transition: 'all 0.8s ease',
                      ...getHubbleFilterStyle()
                    }}
                  />
                  {/* Green Sci-fi Scanner target Grid */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '1px dashed rgba(34, 197, 94, 0.3)', pointerEvents: 'none', boxSizing: 'border-box' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(34, 197, 94, 0.5)', width: '40px', height: '40px', borderRadius: '50%', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '1px', background: 'rgba(34, 197, 94, 0.7)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', height: '10px', width: '1px', background: 'rgba(34, 197, 94, 0.7)', pointerEvents: 'none' }} />
                  
                  {/* Overlay labels */}
                  <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(34, 197, 94, 0.25)', color: '#22c55e', fontSize: '6.5px', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid rgba(34, 197, 94, 0.4)', pointerEvents: 'none', letterSpacing: '0.05em', zIndex: 10 }}>
                    🔭 DEEP-SPACE VIEWPORT
                  </div>
                  
                  {/* Spectral Filter Switcher */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '6px', 
                    right: '6px', 
                    display: 'flex', 
                    gap: '2px', 
                    background: 'rgba(0,0,0,0.8)', 
                    padding: '2px', 
                    borderRadius: '4px', 
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    zIndex: 20
                  }}>
                    {['vis', 'ir', 'uv'].map(f => (
                      <button
                        key={f}
                        onClick={(e) => { e.stopPropagation(); setHubbleFilter(f); }}
                        style={{
                          fontSize: '6.5px',
                          fontWeight: 'bold',
                          fontFamily: 'Courier New, monospace',
                          padding: '2px 4px',
                          background: hubbleFilter === f ? 'rgba(34, 197, 94, 0.25)' : 'none',
                          border: 'none',
                          borderRadius: '2px',
                          color: hubbleFilter === f ? '#22c55e' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          outline: 'none',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#ffffff', fontSize: '6px', padding: '3px 4px', borderRadius: '3px', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', zIndex: 10 }}>
                    TARGET: {HUBBLE_IMAGES[hubbleIdx].name}
                  </div>
                </div>
              ) : /* C. HIGH-TECH SCATTER SIGNAL RADAR SIMULATION FEED (For all Starlink / Sentinels) */
              (
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: '140px', 
                  background: '#090d16', 
                  borderRadius: '6px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(0, 240, 255, 0.25)', 
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {/* Rotating green matrix waterfall logs */}
                  <div style={{ fontSize: '6.5px', color: '#22c55e', textTransform: 'uppercase', display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                    <div style={{ color: '#00f0ff', borderBottom: '1px solid rgba(0,240,255,0.15)', paddingBottom: '3px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                      📡 COGNITIVE SIGNAL SENSOR INTERCEPT
                    </div>
                    {sigintLogs.map((log, index) => (
                      <div key={index} style={{ opacity: index === 0 ? 1 : index === 1 ? 0.7 : 0.4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        &gt; {log}
                      </div>
                    ))}
                  </div>

                  {/* Intercept waveform radar visualization */}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', height: '40px', gap: '2px', borderTop: '1px solid rgba(0,240,255,0.1)', paddingTop: '4px', overflow: 'hidden' }}>
                    {Array.from({ length: 28 }).map((_, i) => {
                      const h = Math.floor(Math.sin((i + Date.now()/1000) * 0.5) * 15) + 20;
                      return (
                        <div 
                          key={i} 
                          style={{ 
                            flex: 1, 
                            height: `${h}%`, 
                            background: `linear-gradient(to top, rgba(0,240,255,0.15), ${i % 3 === 0 ? '#ff007f' : '#00f0ff'})`, 
                            borderRadius: '1px' 
                          }} 
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description Footer */}
          <div style={{ 
            borderTop: '1px solid rgba(0, 240, 255, 0.15)', 
            paddingTop: '5px', 
            fontSize: '7.5px', 
            color: 'rgba(0, 240, 255, 0.5)', 
            textAlign: 'center', 
            lineHeight: '1.2',
            marginBottom: '8px'
          }}>
            {satellite.desc || 'ACTIVE INTELLIGENCE SCANNING PLATFORM'}
          </div>

          {/* Locked Camera tracking actions */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={onTrackToggle}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '9px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'Courier New, monospace',
                border: isTracked ? '1px solid #facc15' : '1px solid #00f0ff',
                background: isTracked ? 'rgba(250, 204, 21, 0.12)' : 'rgba(0, 240, 255, 0.1)',
                color: isTracked ? '#facc15' : '#00f0ff',
                boxShadow: isTracked ? '0 0 12px rgba(250, 204, 21, 0.18)' : 'none',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isTracked ? 'rgba(250, 204, 21, 0.22)' : 'rgba(0, 240, 255, 0.2)';
                e.currentTarget.style.boxShadow = isTracked ? '0 0 15px rgba(250, 204, 21, 0.3)' : '0 0 12px rgba(0, 240, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isTracked ? 'rgba(250, 204, 21, 0.12)' : 'rgba(0, 240, 255, 0.1)';
                e.currentTarget.style.boxShadow = isTracked ? '0 0 10px rgba(250, 204, 21, 0.15)' : 'none';
              }}
            >
              <span>👁️‍🗨️</span> {isTracked ? 'RELEASE TRACKING' : 'LOCK CAMERA & TRACK'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
