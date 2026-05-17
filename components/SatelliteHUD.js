'use client';
import { useState, useEffect, useRef } from 'react';
import { propagateSatellite } from '@/lib/satellitesPropagator';
import { Shield, Radio, Locate, X, Compass, Cpu, Activity } from 'lucide-react';

export default function SatelliteHUD({ satellite, onClose, isLocked, onToggleLock }) {
  const [telemetry, setTelemetry] = useState(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!satellite) return;

    const updateTelemetry = () => {
      const now = Date.now();
      const state = propagateSatellite(satellite, now);
      setTelemetry(state);
      frameRef.current = requestAnimationFrame(updateTelemetry);
    };

    updateTelemetry();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [satellite]);

  if (!satellite || !telemetry) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '320px',
      background: 'rgba(8, 12, 24, 0.92)',
      border: `1px solid ${satellite.color}44`,
      borderRadius: '12px',
      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px ${satellite.color}15`,
      color: '#ffffff',
      padding: '20px',
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      zIndex: 1000,
      backdropFilter: 'blur(12px)',
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* HUD Corners */}
      <div style={{ position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderTop: `2px solid ${satellite.color}`, borderLeft: `2px solid ${satellite.color}`, opacity: 0.6 }} />
      <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderTop: `2px solid ${satellite.color}`, borderRight: `2px solid ${satellite.color}`, opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 8, height: 8, borderBottom: `2px solid ${satellite.color}`, borderLeft: `2px solid ${satellite.color}`, opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 8, height: 8, borderBottom: `2px solid ${satellite.color}`, borderRight: `2px solid ${satellite.color}`, opacity: 0.6 }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} className="pulse-icon" style={{ color: satellite.color }} />
          <div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Uplink Established</div>
            <strong style={{ fontSize: '13px', color: '#ffffff', textShadow: `0 0 8px ${satellite.color}55` }}>{satellite.name}</strong>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2 }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          <X size={16} />
        </button>
      </div>

      {/* Primary Telemetry Data */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>REGISTRATION:</span>
          <span style={{ fontWeight: 600 }}>{satellite.cospar}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>NORAD ID:</span>
          <span>{satellite.norad}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>OPERATOR:</span>
          <span style={{ color: satellite.color }}>{satellite.owner}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>PURPOSE:</span>
          <span style={{ textAlign: 'right', fontSize: '11px' }}>{satellite.purpose}</span>
        </div>
      </div>

      {/* Live Geospatial Data Ticker */}
      <div style={{
        background: 'rgba(2, 6, 23, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '4px', marginBottom: '4px' }}>
          <Compass size={12} />
          <span>LIVE TELEMETRY TICKER</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>LATITUDE:</span>
          <strong style={{ color: '#38bdf8' }}>{telemetry.lat.toFixed(6)}° {telemetry.lat >= 0 ? 'N' : 'S'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>LONGITUDE:</span>
          <strong style={{ color: '#38bdf8' }}>{telemetry.lon.toFixed(6)}° {telemetry.lon >= 0 ? 'E' : 'W'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>ALTITUDE:</span>
          <strong style={{ color: '#10b981' }}>{telemetry.alt.toFixed(4)} km</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>VELOCITY:</span>
          <strong style={{ color: '#facc15' }}>{telemetry.speed.toFixed(5)} km/s</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>ORBITAL PERIOD:</span>
          <span>{telemetry.period.toFixed(2)} mins</span>
        </div>
      </div>

      {/* Connection Status Log */}
      <div style={{
        padding: '8px 12px',
        background: `${satellite.color}11`,
        border: `1px solid ${satellite.color}22`,
        borderRadius: '6px',
        fontSize: '9px',
        color: satellite.color,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        textTransform: 'uppercase',
        fontWeight: 700
      }}>
        <Activity size={12} className="pulse-icon" />
        <span>STATUS: {satellite.status}</span>
      </div>

      {/* HUD Control Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onToggleLock}
          style={{
            flex: 1,
            background: isLocked ? satellite.color : 'rgba(255,255,255,0.03)',
            color: isLocked ? '#020617' : '#ffffff',
            border: `1px solid ${isLocked ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            padding: '8px 0',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: isLocked ? `0 0 10px ${satellite.color}33` : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isLocked) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = satellite.color;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLocked) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }
          }}
        >
          <Locate size={12} />
          {isLocked ? 'LOCKED ON' : 'LOCK CAMERA'}
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            background: 'transparent',
            color: '#ffffff',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '6px',
            padding: '8px 0',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
        >
          UPLINK CLOSE
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse-icon {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        :global(.pulse-icon) {
          animation: pulse-icon 1.5s infinite;
        }
        @keyframes slideInRight {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
