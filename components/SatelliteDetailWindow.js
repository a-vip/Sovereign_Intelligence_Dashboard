'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// Hubble deep-space astronomical images (12 premium Unsplash public captures, fast & reliable CDN)
const HUBBLE_IMAGES = [
  { name: 'Pillars of Creation (M16 Eagle Nebula)', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80' },
  { name: 'Whirlpool Galaxy (M51 Spiral)', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&auto=format&fit=crop&q=80' },
  { name: 'Carina Nebula Cosmic Cliffs (NGC 3324)', url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=600&auto=format&fit=crop&q=80' },
  { name: 'Andromeda Galaxy (M31 Spiral)', url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=600&auto=format&fit=crop&q=80' },
  { name: 'Orion Nebula (M42 Cosmic Cradle)', url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=600&auto=format&fit=crop&q=80' },
  { name: 'Sombrero Galaxy (M104 Spiral)', url: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=600&auto=format&fit=crop&q=80' },
  { name: 'Supernova Remnant (Crab Nebula M1)', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80' },
  { name: 'Hubble Deep Field (HDF-S)', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80' },
  { name: 'Ring Nebula (M57 Planetary Nebula)', url: 'https://images.unsplash.com/photo-1570288685280-7802a8f8c4fc?w=600&auto=format&fit=crop&q=80' },
  { name: 'Helix Nebula (NGC 7293 Eye of God)', url: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=600&auto=format&fit=crop&q=80' },
  { name: 'Pleione Star Cluster (M45 Seven Sisters)', url: 'https://images.unsplash.com/photo-1504333631130-c8787f17864c?w=600&auto=format&fit=crop&q=80' },
  { name: 'Horsehead Nebula (Barnard 33 Dark Nebula)', url: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=600&auto=format&fit=crop&q=80' }
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
  const [issSource, setIssSource] = useState('timelapse'); // Default to robust 'timelapse' for Electron 100% reliability
  const [issStreamType, setIssStreamType] = useState('nasa_johnson'); // 'nasa_johnson' | 'nasa_main' | 'custom'
  const [customVideoId, setCustomVideoId] = useState('jPTD2gnpFUg'); // Fallback Video ID
  const [hubbleFilter, setHubbleFilter] = useState('vis'); // 'vis' | 'ir' | 'uv' | 'xray' | 'grav'
  const [hubbleMode, setHubbleMode] = useState('gallery'); // 'gallery' | 'live'
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  const canvasRef = useRef(null);
  const maxCanvasRef = useRef(null);
  const particlesRef = useRef([]);

  const handlePrevHubble = () => {
    setHubbleIdx(prev => (prev - 1 + HUBBLE_IMAGES.length) % HUBBLE_IMAGES.length);
  };
  const handleNextHubble = () => {
    setHubbleIdx(prev => (prev + 1) % HUBBLE_IMAGES.length);
  };

  // Get CSS filter styling for Hubble multi-spectral camera
  const getHubbleFilterStyle = (filterVal = hubbleFilter) => {
    switch (filterVal) {
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
      case 'xray':
        // Simulated X-Ray (High energy stellar core, monochromatic inverse structure)
        return {
          filter: 'grayscale(1) invert(1) contrast(3.5) brightness(0.9)',
          transition: 'filter 0.5s ease-in-out'
        };
      case 'grav':
        // Simulated Gravitational Lensing (Dark matter lensing density cyan filter)
        return {
          filter: 'hue-rotate(60deg) saturate(3) invert(0.15) contrast(1.6)',
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
      
      // Rotate simulated Hubble images if autoplay is active
      setHubbleIdx(prev => {
        if (isAutoplay && hubbleMode === 'gallery') {
          return (prev + 1) % HUBBLE_IMAGES.length;
        }
        return prev;
      });

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
  }, [isAutoplay, hubbleMode]);

  // HTML5 Canvas Multi-Spectral Space Simulator for Hubble
  useEffect(() => {
    if (hubbleMode !== 'live') return;

    let animFrameId;
    const canvas = isMaximized ? maxCanvasRef.current : canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Fit canvas to its parent container to ensure crisp resolution
    const resizeCanvas = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width || 260;
      canvas.height = rect.height || 140;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles if empty
    if (particlesRef.current.length === 0) {
      const temp = [];
      for (let i = 0; i < 50; i++) {
        temp.push({
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 2.5 + 0.5,
          color: Math.random() > 0.5 ? '#00f0ff' : '#ffffff',
          pulse: Math.random() * Math.PI
        });
      }
      particlesRef.current = temp;
    }

    let t = 0;
    const draw = () => {
      t += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      
      // 1. Clear background & draw space depth
      ctx.fillStyle = '#010510';
      ctx.fillRect(0, 0, w, h);

      // 2. Draw active wavelength nebulous effects
      if (hubbleFilter === 'ir') {
        // Infrared: warm glowing gaseous structures (blobs of reddish orange)
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const cx = w/2 + Math.sin(t * 0.5 + i) * (w/4);
          const cy = h/2 + Math.cos(t * 0.4 + i) * (h/4);
          const r = Math.min(w, h) * (0.2 + Math.sin(t + i) * 0.05);
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.15)'); // deep red
          grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.05)'); // orange
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (hubbleFilter === 'uv') {
        // Ultraviolet: wavy electromagnetic violet currents
        ctx.save();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)'; // neon purple
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x < w; x += 10) {
          const y = h/2 + Math.sin(x * 0.015 + t) * (h/6) + Math.cos(x * 0.005 - t) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      } else if (hubbleFilter === 'xray') {
        // X-Ray: stellar core grid & pulsar beam line
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Drawing circular scanner rings in center
        for (let r = 50; r < Math.max(w, h); r += 80) {
          ctx.arc(w/2, h/2, r, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
      } else if (hubbleFilter === 'grav') {
        // Gravitational Lensing: Draw distorted concentric circles representing space-time warp
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)'; // cyan grid lines
        ctx.lineWidth = 1;
        const centerX = w / 2;
        const centerY = h / 2;
        for (let r = 20; r < Math.max(w, h); r += 45) {
          // Distort circle near central singularity
          ctx.beginPath();
          for (let angle = 0; angle <= Math.PI * 2 + 0.1; angle += 0.08) {
            const radDistort = r + (r < 180 ? Math.sin(angle * 4 + t) * 8 * (1 - r/180) : 0);
            const px = centerX + Math.cos(angle) * radDistort;
            const py = centerY + Math.sin(angle) * radDistort;
            if (angle === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Draw & update particles
      particlesRef.current.forEach(p => {
        p.pulse += 0.02;
        // Update positions
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Apply visual modifications based on filter
        let drawX = p.x;
        let drawY = p.y;
        let pColor = p.color;
        let pSize = p.size;

        if (hubbleFilter === 'ir') {
          pColor = `rgba(239, 68, 68, ${0.4 + Math.sin(p.pulse) * 0.3})`;
          pSize = p.size * 1.4;
        } else if (hubbleFilter === 'uv') {
          pColor = `rgba(168, 85, 247, ${0.5 + Math.sin(p.pulse) * 0.4})`;
          pSize = p.size * 1.1;
        } else if (hubbleFilter === 'xray') {
          pColor = `rgba(255, 255, 255, ${0.2 + Math.sin(p.pulse) * 0.2})`;
          pSize = p.size * 1.5;
        } else if (hubbleFilter === 'grav') {
          const dx = p.x - w/2;
          const dy = p.y - h/2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 30) {
            const deflection = 600 / (dist + 5);
            drawX = p.x - (dx / dist) * deflection;
            drawY = p.y - (dy / dist) * deflection;
            pSize = p.size * (1 + deflection / 12);
            pColor = `rgba(6, 182, 212, ${0.4 + Math.sin(p.pulse) * 0.3})`;
          } else {
            p.x = Math.random() * w;
            p.y = Math.random() * h;
          }
        } else {
          pColor = `rgba(255, 255, 255, ${0.6 + Math.sin(p.pulse) * 0.4})`;
        }

        // Draw particle
        ctx.fillStyle = pColor;
        ctx.beginPath();
        if (hubbleFilter === 'xray') {
          ctx.strokeStyle = pColor;
          ctx.lineWidth = 1;
          ctx.arc(drawX, drawY, pSize, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.arc(drawX, drawY, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. Draw high-tech HUD crosshair
      ctx.strokeStyle = hubbleFilter === 'grav' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(34, 197, 94, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w/2, h/2, 24, 0, Math.PI * 2);
      ctx.moveTo(w/2 - 32, h/2); ctx.lineTo(w/2 - 8, h/2);
      ctx.moveTo(w/2 + 8, h/2); ctx.lineTo(w/2 + 32, h/2);
      ctx.moveTo(w/2, h/2 - 32); ctx.lineTo(w/2, h/2 - 8);
      ctx.moveTo(w/2, h/2 + 8); ctx.lineTo(w/2, h/2 + 32);
      ctx.stroke();

      // Framing corners
      const pad = 12;
      const len = 16;
      ctx.strokeStyle = hubbleFilter === 'xray' ? 'rgba(255, 255, 255, 0.3)' : hubbleFilter === 'grav' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(34, 197, 94, 0.4)';
      ctx.beginPath();
      ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad);
      ctx.moveTo(w - pad - len, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + len);
      ctx.moveTo(pad, h - pad - len); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + len, h - pad);
      ctx.moveTo(w - pad - len, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - len);
      ctx.stroke();

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [hubbleMode, hubbleFilter, isMaximized]);

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
                      src={issStreamType === 'nasa_johnson' 
                        ? "https://www.youtube.com/embed/live_stream?channel=UCmheCYT4HlbFi943IpHOO9Q&autoplay=1&mute=1&playsinline=1"
                        : issStreamType === 'nasa_main'
                        ? "https://www.youtube.com/embed/live_stream?channel=UCLA_DiR1FfKNvjuUpBHmylQ&autoplay=1&mute=1&playsinline=1"
                        : `https://www.youtube.com/embed/${customVideoId.trim() || 'jPTD2gnpFUg'}?autoplay=1&mute=1&playsinline=1`
                      }
                      style={{ width: '100%', height: '100%', border: 'none' }} 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                    />
                  )}
                  {issSource === 'timelapse' && (
                    <video
                      src="https://svs.gsfc.nasa.gov/vis/a010000/a015500/a015570/Earth_wAtmos_spin_02_1080p60.mp4"
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
                    🔴 ISS FEED [{issSource.toUpperCase()}]
                  </div>

                  {/* Maximize Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMaximized(true); }}
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.7)',
                      border: '1px solid rgba(0, 240, 255, 0.4)',
                      borderRadius: '4px',
                      color: '#00f0ff',
                      fontSize: '8px',
                      padding: '2px 5px',
                      cursor: 'pointer',
                      zIndex: 30,
                      fontWeight: 'bold',
                      outline: 'none'
                    }}
                    title="Maximize Viewport"
                  >
                    ⛶ ENLARGE
                  </button>

                  {/* ISS YouTube custom channel preset & glow input router */}
                  {issSource === 'youtube' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '6px',
                      left: '6px',
                      right: '72px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      background: 'rgba(4, 8, 20, 0.85)',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '4px',
                      padding: '4px',
                      zIndex: 25,
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[
                          { id: 'nasa_johnson', label: 'ISS-HD' },
                          { id: 'nasa_main', label: 'NASA-TV' },
                          { id: 'custom', label: 'CUSTOM' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={(e) => { e.stopPropagation(); setIssStreamType(t.id); }}
                            style={{
                              fontSize: '5.5px',
                              fontWeight: 'bold',
                              fontFamily: 'Courier New, monospace',
                              padding: '2px 4px',
                              background: issStreamType === t.id ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255,255,255,0.05)',
                              border: issStreamType === t.id ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '2px',
                              color: issStreamType === t.id ? '#00f0ff' : 'rgba(255,255,255,0.6)',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      {issStreamType === 'custom' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                          <span style={{ fontSize: '5px', color: 'rgba(0,240,255,0.6)' }}>ID:</span>
                          <input
                            type="text"
                            value={customVideoId}
                            onChange={(e) => setCustomVideoId(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Video ID"
                            style={{
                              flex: 1,
                              background: '#020617',
                              border: '1px solid rgba(0, 240, 255, 0.4)',
                              borderRadius: '2px',
                              color: '#00f0ff',
                              fontSize: '6px',
                              padding: '1px 3px',
                              outline: 'none',
                              fontFamily: 'Courier New, monospace'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

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
                      { id: 'youtube', label: 'YT' },
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
                <div>
                  <div style={{ position: 'relative', width: '100%', height: '140px', background: '#020617', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                    {hubbleMode === 'gallery' ? (
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
                    ) : (
                      /* Scaled down HTML5 Canvas Space Simulator */
                      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                        <div style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '6px', color: '#facc15', background: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px', border: '1px solid rgba(250,204,21,0.3)', pointerEvents: 'none' }}>
                          CCD: -84°C
                        </div>
                        <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '5.5px', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.7)', padding: '2px 4px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }}>
                          <span>RA: 05h 35m</span>
                          <span>DEC: -05° 23′</span>
                          <span style={{ color: '#22c55e' }}>LOCK: 99%</span>
                        </div>
                      </div>
                    )}

                    {/* Green Sci-fi Scanner target Grid (Only in gallery mode!) */}
                    {hubbleMode === 'gallery' && (
                      <>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '1px dashed rgba(34, 197, 94, 0.3)', pointerEvents: 'none', boxSizing: 'border-box' }} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(34, 197, 94, 0.5)', width: '40px', height: '40px', borderRadius: '50%', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '1px', background: 'rgba(34, 197, 94, 0.7)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', height: '10px', width: '1px', background: 'rgba(34, 197, 94, 0.7)', pointerEvents: 'none' }} />
                      </>
                    )}
                    
                    {/* Overlay labels */}
                    <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(34, 197, 94, 0.25)', color: '#22c55e', fontSize: '6.5px', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid rgba(34, 197, 94, 0.4)', pointerEvents: 'none', letterSpacing: '0.05em', zIndex: 10 }}>
                      🔭 HUBBLE CAM [{hubbleMode.toUpperCase()}]
                    </div>

                    {/* Maximize Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsMaximized(true); }}
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '4px',
                        color: '#22c55e',
                        fontSize: '8px',
                        padding: '2px 5px',
                        cursor: 'pointer',
                        zIndex: 30,
                        fontWeight: 'bold',
                        outline: 'none'
                      }}
                      title="Maximize Viewport"
                    >
                      ⛶ ENLARGE
                    </button>

                    {/* Dynamic control switcher for Gallery/Live mode and filters */}
                    <div style={{ 
                      position: 'absolute', 
                      top: '6px', 
                      right: '6px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '4px',
                      alignItems: 'flex-end',
                      zIndex: 20
                    }}>
                      {/* Mode selector */}
                      <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                        {[
                          { id: 'gallery', label: '📸' },
                          { id: 'live', label: '🔴' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={(e) => { e.stopPropagation(); setHubbleMode(m.id); }}
                            style={{
                              fontSize: '6.5px',
                              padding: '2px 4px',
                              background: hubbleMode === m.id ? 'rgba(34, 197, 94, 0.25)' : 'none',
                              border: 'none',
                              borderRadius: '2px',
                              color: hubbleMode === m.id ? '#22c55e' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                            title={m.label === '📸' ? "Show Gallery" : "Show Live Telemetry"}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {/* Spectral Filter Switcher (Only if in gallery mode) */}
                      {hubbleMode === 'gallery' && (
                        <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                          {['vis', 'ir', 'uv', 'xray', 'grav'].map(f => (
                            <button
                              key={f}
                              onClick={(e) => { e.stopPropagation(); setHubbleFilter(f); }}
                              style={{
                                fontSize: '5.5px',
                                fontWeight: 'bold',
                                fontFamily: 'Courier New, monospace',
                                padding: '2px 3px',
                                background: hubbleFilter === f ? 'rgba(34, 197, 94, 0.25)' : 'none',
                                border: 'none',
                                borderRadius: '2px',
                                color: hubbleFilter === f ? '#22c55e' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              {f.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hubble manual gallery controls overlay */}
                    {hubbleMode === 'gallery' && (
                      <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        right: '72px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(4, 8, 20, 0.85)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        zIndex: 25,
                        boxSizing: 'border-box'
                      }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePrevHubble(); }}
                          style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '8px', cursor: 'pointer', padding: '0 4px', outline: 'none' }}
                        >
                          ◀
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsAutoplay(!isAutoplay); }}
                          style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '2px', color: '#22c55e', fontSize: '6px', cursor: 'pointer', padding: '1px 3px', outline: 'none', fontFamily: 'Courier New, monospace' }}
                        >
                          {isAutoplay ? '⏸' : '▶'}
                        </button>
                        <span style={{ fontSize: '5.5px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px', textAlign: 'center' }}>
                          {HUBBLE_IMAGES[hubbleIdx].name.split(' (')[0]}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleNextHubble(); }}
                          style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '8px', cursor: 'pointer', padding: '0 4px', outline: 'none' }}
                        >
                          ▶
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Navigation Grid for small viewport */}
                  {hubbleMode === 'gallery' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '3px',
                      marginTop: '6px',
                      background: 'rgba(0, 240, 255, 0.03)',
                      border: '1px solid rgba(0, 240, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '4px',
                      boxSizing: 'border-box'
                    }}>
                      {HUBBLE_IMAGES.map((img, i) => (
                        <div
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setHubbleIdx(i); }}
                          style={{
                            height: '18px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            border: hubbleIdx === i ? '1.5px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            position: 'relative'
                          }}
                          title={img.name}
                        >
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* 3. PREMIUM SCI-FI MAXIMIZED VIEWPORT OVERLAY MODAL */}
      {isMaximized && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(4, 6, 12, 0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Courier New, monospace',
          color: '#ffffff',
          boxSizing: 'border-box',
          padding: '24px',
          userSelect: 'none'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
            paddingBottom: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', background: '#ff2d55', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite' }} />
              <strong style={{ color: '#00f0ff', fontSize: '14px', letterSpacing: '0.15em' }}>
                TACTICAL MULTI-SPECTRAL VIEWPORT // SATELLITE: {satellite.name.toUpperCase()} [# {satellite.code}]
              </strong>
            </div>
            <button
              onClick={() => setIsMaximized(false)}
              style={{
                background: 'rgba(255, 45, 85, 0.15)',
                border: '1px solid rgba(255, 45, 85, 0.4)',
                color: '#ff2d55',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'Courier New, monospace',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 45, 85, 0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 45, 85, 0.15)'; }}
            >
              [ CLOSE VIEWPORT × ]
            </button>
          </div>

          {/* Grid Layout (Left: Large Viewport, Right: Telemetry & logs) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', flex: 1, minHeight: 0 }}>
            {/* Viewport Area */}
            <div style={{
              background: '#000000',
              borderRadius: '8px',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isISS ? (
                /* ISS Large view */
                <>
                  {issSource === 'youtube' && (
                    <iframe 
                      src={issStreamType === 'nasa_johnson' 
                        ? "https://www.youtube.com/embed/live_stream?channel=UCmheCYT4HlbFi943IpHOO9Q&autoplay=1&mute=1&playsinline=1"
                        : issStreamType === 'nasa_main'
                        ? "https://www.youtube.com/embed/live_stream?channel=UCLA_DiR1FfKNvjuUpBHmylQ&autoplay=1&mute=1&playsinline=1"
                        : `https://www.youtube.com/embed/${customVideoId.trim() || 'jPTD2gnpFUg'}?autoplay=1&mute=1&playsinline=1`
                      } 
                      style={{ width: '100%', height: '100%', border: 'none' }} 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                    />
                  )}
                  {issSource === 'timelapse' && (
                    <video
                      src="https://svs.gsfc.nasa.gov/vis/a010000/a015500/a015570/Earth_wAtmos_spin_02_1080p60.mp4"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  )}
                  {issSource === 'matrix' && (
                    <div style={{ width: '100%', height: '100%', background: '#020617', boxSizing: 'border-box', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '10px', color: '#22c55e', textTransform: 'uppercase', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#00f0ff', borderBottom: '1px solid rgba(0,240,255,0.15)', paddingBottom: '8px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                          📡 DIGITAL INTELLIGENCE SIGINT SIGNAL SCANNER
                        </div>
                        {sigintLogs.map((log, index) => (
                          <div key={index} style={{ opacity: index === 0 ? 1 : 1 - index * 0.15 }}>
                            &gt; {log}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '4px', borderTop: '1px solid rgba(0,240,255,0.15)', paddingTop: '10px', overflow: 'hidden' }}>
                        {Array.from({ length: 70 }).map((_, i) => {
                          const h = Math.floor(Math.sin((i + Date.now()/400) * 0.8) * 40) + 50;
                          return (
                            <div 
                              key={i} 
                              style={{ 
                                flex: 1, 
                                height: `${Math.max(15, Math.min(100, h))}%`, 
                                background: `linear-gradient(to top, rgba(0,240,255,0.15), ${i % 5 === 0 ? '#ff007f' : '#00f0ff'})`, 
                                borderRadius: '2px' 
                              }} 
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : isHubble ? (
                /* Hubble Large view */
                hubbleMode === 'gallery' ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
                    {/* Floating Large Carousel & Thumbnail Navigation inside maximized player */}
                    <div style={{
                      position: 'absolute',
                      bottom: '50px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(4, 6, 14, 0.9)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      zIndex: 30,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      width: '480px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 15px rgba(34, 197, 94, 0.15)',
                      boxSizing: 'border-box'
                    }}>
                      {/* Playback controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handlePrevHubble(); }}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', color: '#22c55e', padding: '3px 8px', fontSize: '9px', cursor: 'pointer', outline: 'none', fontFamily: 'Courier New, monospace' }}
                          >
                            ◀ PREV
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsAutoplay(!isAutoplay); }}
                            style={{ background: isAutoplay ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '4px', color: '#22c55e', padding: '3px 10px', fontSize: '9px', cursor: 'pointer', outline: 'none', fontWeight: 'bold', fontFamily: 'Courier New, monospace' }}
                          >
                            {isAutoplay ? '⏸ PAUSE' : '▶ PLAY'}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleNextHubble(); }}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', color: '#22c55e', padding: '3px 8px', fontSize: '9px', cursor: 'pointer', outline: 'none', fontFamily: 'Courier New, monospace' }}
                          >
                            NEXT ▶
                          </button>
                        </div>
                        <span style={{ color: '#ffffff', fontSize: '9px', letterSpacing: '0.05em', fontWeight: 'bold', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {HUBBLE_IMAGES[hubbleIdx].name}
                        </span>
                      </div>

                      {/* 12-image grid strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
                        {HUBBLE_IMAGES.map((img, i) => (
                          <div
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setHubbleIdx(i); }}
                            style={{
                              height: '28px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: hubbleIdx === i ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.2)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              position: 'relative'
                            }}
                            title={img.name}
                          >
                            <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Hubble Live Telemetry view */
                  <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                    <canvas ref={maxCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block', zIndex: 1 }} />
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '24px', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(34, 197, 94, 0.25)', paddingBottom: '12px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '8px' }}>
                        <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: 'bold' }}>🔭 LIVE TELEMETRY SPACIAL SCANNER</div>
                        <div style={{ color: '#facc15', fontSize: '10px', fontWeight: 'bold' }}>EXPOSURE: ACTIVE [{(1800 + Math.floor(Date.now() / 100) % 5400)}s / 7200s]</div>
                      </div>
                      
                      {/* Empty flex container to allow seeing the canvas particles in the center */}
                      <div style={{ flex: 1 }} />

                      {/* Readouts */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '9px', borderTop: '1px solid rgba(34,197,94,0.15)', paddingTop: '10px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '8px' }}>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>RIGHT ASCENSION:</span><br/>
                          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>05h 35m 17s</span>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>DECLINATION:</span><br/>
                          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>-05° 23′ 28″</span>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>CCD TEMP:</span><br/>
                          <span style={{ color: '#ff2d55', fontWeight: 'bold' }}>-84.3°C [NOMINAL]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>SENSOR NOT INITIALIZED</div>
              )}

              {/* Viewport HUD Overlays */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '2px solid rgba(0,240,255,0.15)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: isISS ? 'rgba(0,240,255,0.25)' : 'rgba(34,197,94,0.25)', color: isISS ? '#00f0ff' : '#22c55e', fontSize: '8px', padding: '3px 6px', borderRadius: '4px', border: isISS ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(34, 197, 94, 0.4)', fontWeight: 'bold', zIndex: 30 }}>
                {isISS ? `🔴 ISS FEED [${issSource.toUpperCase()}]` : `🔭 HUBBLE SCANNER [${hubbleMode.toUpperCase()}]`}
              </div>

              {/* Control panels on the player inside Maximized modal */}
              <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 40, display: 'flex', gap: '10px', alignItems: 'center' }}>
                {isISS ? (
                  /* ISS stream switcher and YouTube custom router */
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* YouTube stream routing options (Only if source is YouTube) */}
                    {issSource === 'youtube' && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(0,0,0,0.85)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                        <span style={{ fontSize: '8px', color: 'rgba(0,240,255,0.7)', fontWeight: 'bold' }}>STREAM:</span>
                        {[
                          { id: 'nasa_johnson', label: 'ISS HD (NASA JOHNSON)' },
                          { id: 'nasa_main', label: 'NASA TV (MAIN)' },
                          { id: 'custom', label: 'CUSTOM FEED' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={(e) => { e.stopPropagation(); setIssStreamType(t.id); }}
                            style={{
                              fontSize: '8px',
                              fontWeight: 'bold',
                              fontFamily: 'Courier New, monospace',
                              padding: '4px 8px',
                              background: issStreamType === t.id ? 'rgba(0, 240, 255, 0.3)' : 'none',
                              border: 'none',
                              borderRadius: '4px',
                              color: issStreamType === t.id ? '#00f0ff' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                        {issStreamType === 'custom' && (
                          <input
                            type="text"
                            value={customVideoId}
                            onChange={(e) => setCustomVideoId(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Enter YouTube Video ID..."
                            style={{
                              background: '#040814',
                              border: '1px solid rgba(0, 240, 255, 0.5)',
                              borderRadius: '4px',
                              color: '#00f0ff',
                              fontSize: '8px',
                              padding: '3px 8px',
                              width: '130px',
                              outline: 'none',
                              fontFamily: 'Courier New, monospace',
                              boxShadow: 'inset 0 0 5px rgba(0,240,255,0.2)'
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Standard source selectors */}
                    <div style={{ display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.85)', padding: '3px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                      {[
                        { id: 'youtube', label: 'YT-LIVE' },
                        { id: 'timelapse', label: 'ORBIT (NASA)' },
                        { id: 'matrix', label: 'SIGINT SCAN' }
                      ].map(s => (
                        <button
                          key={s.id}
                          onClick={(e) => { e.stopPropagation(); setIssSource(s.id); }}
                          style={{
                            fontSize: '8px',
                            fontWeight: 'bold',
                            fontFamily: 'Courier New, monospace',
                            padding: '4px 8px',
                            background: issSource === s.id ? 'rgba(0, 240, 255, 0.3)' : 'none',
                            border: 'none',
                            borderRadius: '4px',
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
                ) : isHubble ? (
                  /* Hubble controls in maximized screen */
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Mode selector */}
                    <div style={{ display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.85)', padding: '3px', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      {[
                        { id: 'gallery', label: '📸 GALLERY' },
                        { id: 'live', label: '🔴 LIVE FEED' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={(e) => { e.stopPropagation(); setHubbleMode(m.id); }}
                          style={{
                            fontSize: '8px',
                            fontWeight: 'bold',
                            fontFamily: 'Courier New, monospace',
                            padding: '4px 8px',
                            background: hubbleMode === m.id ? 'rgba(34, 197, 94, 0.3)' : 'none',
                            border: 'none',
                            borderRadius: '4px',
                            color: hubbleMode === m.id ? '#22c55e' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            outline: 'none',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Filter selector (Only visible if in gallery mode!) */}
                    {hubbleMode === 'gallery' && (
                      <div style={{ display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.85)', padding: '3px', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        {['vis', 'ir', 'uv', 'xray', 'grav'].map(f => (
                          <button
                            key={f}
                            onClick={(e) => { e.stopPropagation(); setHubbleFilter(f); }}
                            style={{
                              fontSize: '8px',
                              fontWeight: 'bold',
                              fontFamily: 'Courier New, monospace',
                              padding: '4px 8px',
                              background: hubbleFilter === f ? 'rgba(34, 197, 94, 0.3)' : 'none',
                              border: 'none',
                              borderRadius: '4px',
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
                    )}
                  </div>
                ) : null}
              </div>

              {/* Dynamic details overlay at the bottom of the maximized screen */}
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', color: '#ffffff', fontSize: '9px', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                <div>TARGET: {isISS ? 'International Space Station (Low Earth Orbit)' : isHubble ? (hubbleMode === 'gallery' ? HUBBLE_IMAGES[hubbleIdx].name : 'Orion Constellation Nebula [Active Lock]') : 'Global Coordinates Scanner'}</div>
                <div style={{ color: isISS ? '#00f0ff' : '#22c55e', fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>SIGNAL STABILITY: 99.8% // DOWNLINK NOMINAL</div>
              </div>
            </div>

            {/* Sidebar (Tactical telemetry readouts and logs) */}
            <div style={{
              background: 'rgba(8, 12, 24, 0.7)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxSizing: 'border-box',
              minHeight: 0
            }}>
              {/* Telemetry data */}
              <div>
                <div style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid rgba(0,240,255,0.15)', paddingBottom: '6px', marginBottom: '8px' }}>SYSTEM SENSOR DATA</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>NAME:</span><span style={{ color: '#00f0ff', fontWeight: 'bold' }}>{satellite.name}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>CODE:</span><span>NORAD #{satellite.code}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>ALTITUDE:</span><span style={{ color: '#facc15', fontWeight: 'bold' }}>{satellite.altitude} km</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>VELOCITY:</span><span style={{ color: '#22c55e', fontWeight: 'bold' }}>{satellite.velocity} km/s</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>LAT / LON:</span><span>{parseFloat(satellite.latitude).toFixed(4)}°, {parseFloat(satellite.longitude).toFixed(4)}°</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>INCLINATION:</span><span>{satellite.inclination}°</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>OPERATOR:</span><span>{satellite.country}</span></div>
                </div>
              </div>

              {/* Signal details */}
              <div style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: '6px', padding: '10px', fontSize: '9px' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', marginBottom: '6px' }}>REAL-TIME DOWNLINK DATA</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>PING: <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>{liveLatency} ms</span></div>
                  <div>SIGNAL: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{liveSignal}%</span></div>
                  <div>BANDWIDTH: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{downlinkRate} Gbps</span></div>
                  <div>JITTER: <span style={{ color: '#facc15', fontWeight: 'bold' }}>0.04 ms</span></div>
                </div>
              </div>

              {/* Scrolling intercept logs */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid rgba(0,240,255,0.15)', paddingBottom: '6px', marginBottom: '8px' }}>SIGINT FREQUENCY DECODER LOGS</div>
                <div className="details-window-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px', fontSize: '9px', color: '#22c55e', boxSizing: 'border-box' }}>
                  {sigintLogs.map((log, index) => (
                    <div key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>[{new Date().toLocaleTimeString()}]</span> &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
