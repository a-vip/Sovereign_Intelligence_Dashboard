'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Crosshair, MapPin, ExternalLink, Satellite, Radio, GripHorizontal } from 'lucide-react';

const MISSION_STYLE = {
  station: { label: 'ORBITAL STATION', color: '#00f0ff' },
  earth_obs: { label: 'EARTH OBSERVATION', color: '#10b981' },
  navigation: { label: 'GNSS NAVIGATION', color: '#f59e0b' },
  comms: { label: 'ORBITAL COMMS', color: '#38bdf8' },
  weather_geo: { label: 'GEO WEATHER', color: '#a855f7' },
  science: { label: 'SPACE SCIENCE', color: '#ec4899' }
};

export default function SatelliteDetailWindow({
  satellite,
  onClose,
  isTracked = false,
  onTrackToggle = null,
  onFocusLocation = null
}) {
  const [pos, setPos] = useState({ x: 24, y: 84 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncSize = () => {
      const mobile = window.innerWidth < 680;
      setIsMobile(mobile);
      setPos({
        x: mobile ? 10 : Math.max(24, window.innerWidth - 430),
        y: mobile ? Math.max(60, window.innerHeight - 430) : 86
      });
    };
    syncSize();
    window.addEventListener('resize', syncSize);
    return () => window.removeEventListener('resize', syncSize);
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const maxX = Math.max(12, window.innerWidth - (isMobile ? 310 : 405));
      const maxY = Math.max(54, window.innerHeight - 160);
      setPos({
        x: Math.max(8, Math.min(maxX, dragRef.current.origX + dx)),
        y: Math.max(54, Math.min(maxY, dragRef.current.origY + dy))
      });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDragging, isMobile]);

  if (!satellite) return null;

  const altKm = Number(satellite.altitude || 550);
  const swathKm = Number(satellite.swathRadiusKm || Math.round(Math.sqrt(2 * 6371 * altKm) * 0.35));
  const revPerDay = satellite.revolutionsPerDay || (1440 / Number(satellite.period || 95)).toFixed(2);
  const mission = MISSION_STYLE[satellite.missionType] || MISSION_STYLE.comms;
  const latStr = Number(satellite.latitude || 0).toFixed(2);
  const lonStr = Number(satellite.longitude || 0).toFixed(2);

  const fallbackRelevance =
    satellite.missionType === 'earth_obs'
      ? 'Supplies open multispectral, SAR, or atmospheric telemetry for AI environmental, crisis, and conflict verification.'
      : satellite.missionType === 'navigation'
        ? 'Core PNT constellation monitored globally for electronic-warfare GNSS jamming and spoofing anomalies.'
        : 'Dual-use orbital infrastructure shaping cross-border sovereignty, telecommunications resilience, and space governance.';

  const handleFlyToNadir = () => {
    const lat = Number(satellite.latitude);
    const lon = Number(satellite.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (typeof onFocusLocation === 'function') {
      onFocusLocation({ lat, lon, timestamp: Date.now() });
    }
  };

  return (
    <aside
      className="sov-modal-shell"
      aria-label={`Orbital Inspector: ${satellite.name}`}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: isMobile ? 'calc(100vw - 20px)' : '388px',
        maxWidth: '400px',
        zIndex: 1650,
        background: 'var(--sov-panel-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '12px',
        boxShadow: 'var(--sov-shadow, 0 20px 44px rgba(0, 0, 0, 0.45))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: 'var(--sov-text)',
        overflow: 'hidden',
        pointerEvents: 'auto'
      }}
    >
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderBottom: '1px solid var(--sov-border)',
          background: 'var(--sov-card-bg)',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
          <GripHorizontal size={13} style={{ color: 'var(--sov-muted)' }} />
          <span
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '4px',
              color: mission.color,
              background: `${mission.color}1a`,
              border: `1px solid ${mission.color}44`
            }}
          >
            {satellite.orbitRegime || 'LEO'} · {mission.label}
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>
            NORAD #{satellite.code}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close satellite inspector"
          style={{
            background: 'transparent',
            border: '1px solid var(--sov-border)',
            borderRadius: '6px',
            color: 'var(--sov-muted)',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Satellite size={15} style={{ color: mission.color, flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: 'var(--sov-text)' }}>
              {satellite.name}
            </h3>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--sov-muted)', marginTop: '3px' }}>
            {satellite.purpose || satellite.desc || 'Orbital Observatory Node'}
          </div>
        </div>

        {/* Orbital Telemetry Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
          {[
            { label: 'ALTITUDE', val: `${altKm.toLocaleString()} km`, color: 'var(--sov-accent)' },
            { label: 'VELOCITY', val: `${satellite.velocity} km/s`, color: 'var(--sov-sky)' },
            { label: 'INCLINATION', val: `${satellite.inclination}°`, color: 'var(--sov-purple)' },
            { label: 'PERIOD', val: `${satellite.period} min`, color: 'var(--sov-text)' },
            { label: 'REV / DAY', val: `${revPerDay}`, color: 'var(--sov-emerald)' },
            { label: 'SWATH', val: `${swathKm} km`, color: 'var(--sov-amber)' }
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--sov-card-bg)',
                border: '1px solid var(--sov-border)',
                borderRadius: '6px',
                padding: '7px 8px'
              }}
            >
              <div style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: stat.color, marginTop: '2px' }}>
                {stat.val}
              </div>
            </div>
          ))}
        </div>

        {/* Agency & Live Sub-Point */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
            fontSize: '11px',
            background: 'var(--sov-card-bg)',
            border: '1px solid var(--sov-border)',
            borderRadius: '6px',
            padding: '8px 10px'
          }}
        >
          <div>
            <span style={{ color: 'var(--sov-muted)' }}>Operator: </span>
            <strong style={{ color: 'var(--sov-text)' }}>{satellite.operator || satellite.country}</strong>
            {satellite.launchDate && <span style={{ color: 'var(--sov-muted)' }}> · {satellite.launchDate}</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', color: 'var(--sov-sky)', fontWeight: 700 }}>
            {latStr}°, {lonStr}°
          </div>
        </div>

        {/* AI & Strategic Policy Relevance */}
        <div
          style={{
            background: 'var(--sov-card-bg)',
            border: '1px solid var(--sov-border)',
            borderLeft: `3px solid ${mission.color}`,
            borderRadius: '6px',
            padding: '9px 11px',
            fontSize: '11.5px',
            lineHeight: 1.5,
            color: 'var(--sov-text)'
          }}
        >
          <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: mission.color, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Radio size={11} />
            <span>AI, OSINT &amp; GOVERNANCE RELEVANCE</span>
          </div>
          {satellite.strategicRelevance || fallbackRelevance}
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {typeof onTrackToggle === 'function' && (
            <button
              type="button"
              onClick={onTrackToggle}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: `1px solid ${isTracked ? '#10b981' : 'var(--sov-border)'}`,
                background: isTracked ? 'rgba(16, 185, 129, 0.16)' : 'var(--sov-card-bg)',
                color: isTracked ? 'var(--sov-emerald)' : 'var(--sov-text)',
                fontSize: '10.5px',
                fontFamily: 'var(--font-jetbrains-fallback)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Crosshair size={12} />
              <span>{isTracked ? 'TRACKING' : 'LOCK CAMERA'}</span>
            </button>
          )}

          {typeof onFocusLocation === 'function' && (
            <button
              type="button"
              onClick={handleFlyToNadir}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid var(--sov-border)',
                background: 'var(--sov-card-bg)',
                color: 'var(--sov-accent)',
                fontSize: '10.5px',
                fontFamily: 'var(--font-jetbrains-fallback)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <MapPin size={12} />
              <span>FLY TO NADIR</span>
            </button>
          )}

          <a
            href={`https://www.n2yo.com/satellite/?s=${encodeURIComponent(satellite.code)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-sky)',
              fontSize: '10.5px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <span>N2YO</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </aside>
  );
}
