'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function SatelliteDetailWindow({ satellite, onClose, isTracked, onTrackToggle }) {
  // Draggable state: Position starts relative to right panel (right: 300px, bottom: 30px)
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const containerRef = useRef(null);

  // Initialize position to align with the screen layout on load
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const initialX = window.innerWidth - (isMobile ? 300 : 580);
    const initialY = window.innerHeight - (isMobile ? 520 : 500);
    setPos({ x: initialX, y: initialY });
  }, []);

  // Drag handlers
  const handleDragStart = (e) => {
    // Only drag with left click on the drag handle header
    if (e.button !== 0) return;
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
    
    // Clamp inside viewport
    const newX = Math.max(10, Math.min(window.innerWidth - 300, dragRef.current.startPosX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 300, dragRef.current.startPosY + dy));
    
    setPos({ x: newX, y: newY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  // Dynamic Telemetry State simulation (for premium live visual feedback!)
  const [liveLatency, setLiveLatency] = useState(124);
  const [liveSignal, setLiveSignal] = useState(98);
  const [downlinkRate, setDownlinkRate] = useState(4.8);
  const [isPinged, setIsPinged] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLatency(prev => Math.max(110, Math.min(145, prev + Math.floor(Math.random() * 9) - 4)));
      setLiveSignal(prev => Math.max(92, Math.min(100, prev + Math.floor(Math.random() * 3) - 1)));
      setDownlinkRate(prev => Math.max(4.2, Math.min(5.4, parseFloat((prev + (Math.random() * 0.4 - 0.2)).toFixed(1)))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTransmitPing = () => {
    setIsPinged(true);
    setTimeout(() => setIsPinged(false), 1500);
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        width: '285px',
        background: 'rgba(8, 12, 24, 0.92)',
        border: isPinged ? '2px solid #00f0ff' : '1px solid rgba(0, 240, 255, 0.65)',
        borderRadius: '12px',
        boxShadow: isPinged 
          ? '0 0 25px rgba(0, 240, 255, 0.5), inset 0 0 15px rgba(0, 240, 255, 0.2)'
          : '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(0, 240, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        padding: '14px',
        zIndex: 9999,
        fontFamily: 'Courier New, monospace',
        color: '#ffffff',
        transition: 'border 0.2s ease, box-shadow 0.2s ease, transform 0.05s linear',
        userSelect: 'none'
      }}
    >
      {/* Draggable Header Drag Handle */}
      <div 
        onMouseDown={handleDragStart}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid rgba(0, 240, 255, 0.3)', 
          paddingBottom: '8px', 
          marginBottom: '10px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            animation: 'pulse 1s infinite', 
            width: '6px', 
            height: '6px', 
            background: isPinged ? '#ff007f' : '#00f0ff', 
            borderRadius: '50%' 
          }} />
          <strong style={{ color: '#00f0ff', fontSize: '10px', letterSpacing: '0.12em' }}>
            {isPinged ? 'PING TRANSMISSION' : 'TELEMETRY ONLINE'}
          </strong>
        </div>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'rgba(255, 255, 255, 0.6)', 
            cursor: 'pointer', 
            fontSize: '15px', 
            lineHeight: 1,
            outline: 'none',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ff2d55'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
        >
          ×
        </button>
      </div>

      {/* Sci-Fi Radar SVG Outline with active status info overlays */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px', position: 'relative' }}>
        <svg width="76" height="76" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="1" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" strokeDasharray="3, 3" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="0.5" />
          <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="0.5" />
          <line x1="50" y1="50" x2="50" y2="5" stroke={isPinged ? '#ff007f' : '#00f0ff'} strokeWidth="1.5">
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="3s" repeatCount="indefinite" />
          </line>
          {isPinged ? (
            <circle cx="50" cy="50" r="2" fill="#ff007f">
              <animate attributeName="r" from="2" to="40" dur="0.8s" repeatCount="1" />
              <animate attributeName="opacity" from="0.9" to="0" dur="0.8s" repeatCount="1" />
            </circle>
          ) : (
            <circle cx="50" cy="18" r="3.5" fill="#00f0ff">
              <animate attributeName="opacity" values="0.3; 1; 0.3" dur="1s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
        <div style={{ position: 'absolute', fontSize: '8px', color: 'rgba(0, 240, 255, 0.55)', fontWeight: 'bold' }}>
          #{satellite.code}
        </div>
      </div>

      {/* Signal Strength & Signal Latency Mini Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '6px', 
        background: 'rgba(0, 240, 255, 0.04)', 
        border: '1px solid rgba(0, 240, 255, 0.15)', 
        borderRadius: '6px', 
        padding: '6px', 
        marginBottom: '10px', 
        fontSize: '8px', 
        textAlign: 'center' 
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>SIG STRENGTH</div>
          <div style={{ color: '#22c55e', fontWeight: 'bold' }}>{liveSignal}%</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>LATENCY</div>
          <div style={{ color: '#00f0ff', fontWeight: 'bold' }}>{liveLatency}ms</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>DOWNLINK</div>
          <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>{downlinkRate}Gb/s</div>
        </div>
      </div>

      {/* Stats Readout Grid */}
      <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>NAME:</span>
          <span style={{ color: '#00f0ff', fontWeight: 'bold', maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {satellite.name}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>ALTITUDE:</span>
          <span style={{ color: '#facc15', fontWeight: 'bold' }}>{satellite.altitude} km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>VELOCITY:</span>
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{satellite.velocity} km/s</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>LATITUDE:</span>
          <span>{parseFloat(satellite.latitude).toFixed(4)}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>LONGITUDE:</span>
          <span>{parseFloat(satellite.longitude).toFixed(4)}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>INCLINATION:</span>
          <span>{satellite.inclination}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>PERIOD:</span>
          <span>{satellite.period} mins</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>OPERATOR:</span>
          <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{satellite.country}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>LAUNCH DATE:</span>
          <span>{satellite.launchDate || 'N/A'}</span>
        </div>
      </div>

      {/* Sci-Fi description text footer */}
      <div style={{ 
        borderTop: '1px solid rgba(0, 240, 255, 0.15)', 
        marginTop: '10px', 
        paddingTop: '6px', 
        fontSize: '7.5px', 
        color: 'rgba(0, 240, 255, 0.5)', 
        textAlign: 'center', 
        lineHeight: '1.2' 
      }}>
        {satellite.desc || 'ACTIVE INTELLIGENCE SCANNING PLATFORM'}
      </div>

      {/* Tactical Interactive Action Button Row */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        <button 
          onClick={onTrackToggle}
          style={{
            flex: 2,
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
            boxShadow: isTracked ? '0 0 10px rgba(250, 204, 21, 0.15)' : 'none',
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

        <button 
          onClick={handleTransmitPing}
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
            border: '1px solid rgba(0, 240, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.03)',
            color: '#e2e8f0',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ff007f';
            e.currentTarget.style.background = 'rgba(255, 0, 127, 0.1)';
            e.currentTarget.style.color = '#ff007f';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 0, 127, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.color = '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>🛰️</span> PING
        </button>
      </div>
    </div>
  );
}
