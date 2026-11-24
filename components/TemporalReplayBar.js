'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, X, Clock, Scale, Cpu, ShieldCheck } from 'lucide-react';
import { MONTHS_2020_2026, formatMonthLabel, computeTemporalSnapshot } from '@/lib/temporalMilestones';

const BASELINE_OPTIONS = [
  { value: '2020-01', label: 'vs. Jan 2020 Baseline' },
  { value: '2022-10', label: 'vs. Pre-GenAI Era (Oct 2022)' },
  { value: '2023-11', label: 'vs. Bletchley Summit (Nov 2023)' },
  { value: '2024-08', label: 'vs. EU AI Act Entry (Aug 2024)' },
  { value: '', label: 'Before/After Lens Off' }
];

const YEAR_TICKS = [
  { label: '2020', ym: '2020-01' },
  { label: '2021', ym: '2021-06' },
  { label: '2022', ym: '2022-03' },
  { label: '2023', ym: '2023-11' },
  { label: '2024', ym: '2024-08' },
  { label: '2025', ym: '2025-09' },
  { label: '2026', ym: '2026-11' }
];

export default function TemporalReplayBar({
  monthIdx,
  setMonthIdx,
  baselineYm,
  setBaselineYm,
  activeTracks,
  setActiveTracks,
  onSelectMilestone,
  onClose
}) {
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(550);

  const safeIdx = Math.max(0, Math.min(MONTHS_2020_2026.length - 1, monthIdx));
  const currentYm = MONTHS_2020_2026[safeIdx] || '2026-11';

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setMonthIdx((prev) => {
        if (prev >= MONTHS_2020_2026.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => clearInterval(timer);
  }, [playing, speedMs, setMonthIdx]);

  const snapshot = useMemo(
    () => computeTemporalSnapshot(currentYm, baselineYm, activeTracks),
    [currentYm, baselineYm, activeTracks]
  );

  const latestRecent = useMemo(
    () => [...snapshot.milestones].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
    [snapshot.milestones]
  );

  const { metrics } = snapshot;

  return (
    <section
      className="sov-modal-shell"
      aria-label="Longitudinal Compute-Regulation Replay"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '74px',
        transform: 'translateX(-50%)',
        width: 'min(95vw, 760px)',
        zIndex: 1350,
        background: 'var(--sov-panel-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: 'var(--sov-shadow, 0 18px 42px rgba(0, 0, 0, 0.5))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: 'var(--sov-text)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'auto'
      }}
    >
      {/* Top Row: Title + Compute-Regulation Gap HUD + Close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Clock size={14} style={{ color: 'var(--sov-accent)' }} />
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: 'var(--sov-accent)' }}>
            {formatMonthLabel(currentYm).toUpperCase()}
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--sov-muted)' }}>
            Compute–Regulation Lens ({snapshot.milestones.length} milestones)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={baselineYm}
            onChange={(e) => setBaselineYm(e.target.value)}
            aria-label="Before and after comparison baseline"
            style={{
              padding: '4px 7px',
              borderRadius: '5px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-text)',
              fontSize: '10.5px',
              fontFamily: 'var(--font-jetbrains-fallback)'
            }}
          >
            {BASELINE_OPTIONS.map((b) => (
              <option key={b.value || 'off'} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close temporal replay"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Live Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
        {[
          {
            label: 'BINDING LAWS',
            val: metrics.laws,
            delta: baselineYm && metrics.deltaLaws > 0 ? `+${metrics.deltaLaws}` : null,
            color: 'var(--sov-emerald)'
          },
          {
            label: 'SAFETY INSTITUTES',
            val: metrics.institutes,
            delta: baselineYm && metrics.deltaInstitutes > 0 ? `+${metrics.deltaInstitutes}` : null,
            color: 'var(--sov-purple)'
          },
          {
            label: 'FRONTIER COMPUTE',
            val: `${metrics.totalGw} GW`,
            delta: baselineYm && metrics.deltaGw > 0 ? `+${metrics.deltaGw} GW` : null,
            color: 'var(--sov-amber)'
          },
          {
            label: 'STATUTE COVERAGE',
            val: `${metrics.coveredPct}%`,
            delta: baselineYm ? `${metrics.deltaCoveredPct >= 0 ? '+' : ''}${metrics.deltaCoveredPct}pp` : null,
            color: 'var(--sov-sky)'
          }
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              borderRadius: '6px',
              padding: '5px 8px'
            }}
          >
            <div style={{ fontSize: '8.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {kpi.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '1px' }}>
              <span style={{ fontSize: '13.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: kpi.color }}>
                {kpi.val}
              </span>
              {kpi.delta && (
                <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)' }}>
                  ({kpi.delta})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scrub Slider + Transport Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              if (!playing && safeIdx >= MONTHS_2020_2026.length - 1) setMonthIdx(0);
              setPlaying((p) => !p);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--sov-accent)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-accent)',
              fontSize: '10.5px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {playing ? <Pause size={12} /> : <Play size={12} />}
            <span>{playing ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSpeedMs((s) => (s === 550 ? 280 : s === 280 ? 120 : 550))}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-text)',
              fontSize: '10px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {speedMs === 550 ? '1x' : speedMs === 280 ? '2x' : '4x'}
          </button>

          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setMonthIdx(0);
            }}
            aria-label="Reset replay to Jan 2020"
            style={{
              padding: '5px 7px',
              borderRadius: '6px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} />
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={MONTHS_2020_2026.length - 1}
          value={safeIdx}
          onChange={(e) => {
            setPlaying(false);
            setMonthIdx(Number(e.target.value));
          }}
          aria-label="Timeline month slider 2020 to 2026"
          style={{ flex: '1 1 180px', accentColor: 'var(--sov-accent)', cursor: 'pointer' }}
        />
      </div>

      {/* Year Quick Jumps + Track Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {YEAR_TICKS.map((yt) => {
            const idx = MONTHS_2020_2026.indexOf(yt.ym);
            const active = currentYm.startsWith(yt.label);
            return (
              <button
                key={yt.label}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  if (idx !== -1) setMonthIdx(idx);
                }}
                style={{
                  padding: '3px 7px',
                  borderRadius: '4px',
                  border: `1px solid ${active ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                  background: active ? 'var(--sov-card-bg)' : 'transparent',
                  color: active ? 'var(--sov-accent)' : 'var(--sov-muted)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {yt.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {[
            { key: 'law', label: 'Laws', color: '#10b981', Icon: Scale },
            { key: 'institute', label: 'AISIs', color: '#a855f7', Icon: ShieldCheck },
            { key: 'compute', label: 'GW Compute', color: '#f59e0b', Icon: Cpu }
          ].map(({ key, label, color, Icon }) => {
            const on = activeTracks[key] !== false;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTracks((prev) => ({ ...prev, [key]: !on }))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  border: `1px solid ${on ? color : 'var(--sov-border)'}`,
                  background: on ? `${color}18` : 'transparent',
                  color: on ? color : 'var(--sov-muted)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Icon size={11} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Latest Emerged Milestones Strip */}
      {latestRecent.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {latestRecent.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMilestone && onSelectMilestone(m)}
              style={{
                flex: '1 1 200px',
                minWidth: '180px',
                textAlign: 'left',
                background: 'var(--sov-card-bg)',
                border: '1px solid var(--sov-border)',
                borderLeft: `3px solid ${m.track === 'law' ? '#10b981' : m.track === 'institute' ? '#a855f7' : '#f59e0b'}`,
                borderRadius: '5px',
                padding: '5px 8px',
                color: 'var(--sov-text)',
                fontSize: '10.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <strong style={{ fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', marginRight: '5px' }}>
                {m.date}
              </strong>
              <span>{m.title}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
