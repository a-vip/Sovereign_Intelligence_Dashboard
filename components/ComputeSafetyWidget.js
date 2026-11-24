'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { X, Cpu, ShieldCheck, MapPin, GripHorizontal } from 'lucide-react';
import { classifyMitRiskDomain, MIT_RISK_DOMAINS } from '@/lib/mitRiskTaxonomy';

export default function ComputeSafetyWidget({ onClose, onFocusLocation, signals = [] }) {
  const [tab, setTab] = useState('compute'); // 'compute' | 'safety'
  const [envData, setEnvData] = useState([]);
  const [labsData, setLabsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState({ x: 350, y: 140 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 900;
      setPos({
        x: mobile ? 10 : Math.max(24, Math.min(window.innerWidth - 420, 420)),
        y: mobile ? 84 : 134
      });
    }
    Promise.all([
      fetch('/api/ethics-layers?layer=environmental').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/labs').then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ]).then(([envJson, labsJson]) => {
      if (Array.isArray(envJson?.items)) setEnvData(envJson.items);
      if (Array.isArray(labsJson?.labs)) setLabsData(labsJson.labs);
      setLoading(false);
    });
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target?.closest?.('button, a')) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 140, dragRef.current.startPosX + (e.clientX - dragRef.current.startX))),
        y: Math.max(52, Math.min(window.innerHeight - 90, dragRef.current.startPosY + (e.clientY - dragRef.current.startY)))
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  const computeStats = useMemo(() => {
    const totalMw = envData.reduce((acc, n) => acc + (Number(n.powerLoadMw) || 0), 0);
    const highCarbon = envData.filter((n) => Number(n.carbonIntensity) >= 450).length;
    const extremeWater = envData.filter((n) => String(n.waterStress || '').startsWith('Extreme')).length;
    const topNodes = [...envData].sort((a, b) => (Number(b.powerLoadMw) || 0) - (Number(a.powerLoadMw) || 0)).slice(0, 12);
    return { totalGw: (totalMw / 1000).toFixed(1), highCarbon, extremeWater, topNodes };
  }, [envData]);

  const mitCounts = useMemo(() => {
    const counts = {};
    Object.keys(MIT_RISK_DOMAINS).forEach((k) => { counts[k] = 0; });
    for (const s of signals || []) {
      const m = s.details?.mitRisk || classifyMitRiskDomain(s.title || s.name || '', s.details?.summary || '', s.details?.domainPillar || '');
      if (m?.code && counts[m.code] !== undefined) counts[m.code] += 1;
    }
    const maxVal = Math.max(1, ...Object.values(counts));
    return { counts, maxVal };
  }, [signals]);

  return (
    <aside
      className="sov-modal-shell"
      aria-label="Compute Stress & Frontier Safety Monitor"
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: 'min(94vw, 400px)',
        maxHeight: 'calc(100dvh - 140px)',
        zIndex: 1452,
        background: 'var(--sov-panel-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '12px',
        boxShadow: 'var(--sov-shadow, 0 20px 44px rgba(0, 0, 0, 0.45))',
        backdropFilter: 'blur(16px)',
        color: 'var(--sov-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 13px',
          background: 'var(--sov-card-bg)',
          borderBottom: '1px solid var(--sov-border)',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <GripHorizontal size={13} style={{ color: 'var(--sov-muted)' }} />
          <Cpu size={14} style={{ color: 'var(--sov-amber)' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', letterSpacing: '0.05em' }}>
            COMPUTE &amp; SAFETY MONITOR
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Compute & Safety Monitor"
          style={{ background: 'transparent', border: '1px solid var(--sov-border)', borderRadius: '5px', color: 'var(--sov-muted)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--sov-border)', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[
            { id: 'compute', label: 'Compute & Grid' },
            { id: 'safety', label: 'MIT Risk & Labs' }
          ].map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '4px 9px',
                  borderRadius: '4px',
                  border: `1px solid ${on ? 'var(--sov-amber)' : 'var(--sov-border)'}`,
                  background: on ? 'rgba(245, 158, 11, 0.14)' : 'var(--sov-card-bg)',
                  color: on ? 'var(--sov-amber)' : 'var(--sov-muted)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <Link href={tab === 'compute' ? '/compute' : '/labs'} style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-accent)', textDecoration: 'none' }}>
          {tab === 'compute' ? 'Compute Atlas ↗' : 'Lab Matrix ↗'}
        </Link>
      </div>

      <div style={{ padding: '10px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '11.5px', color: 'var(--sov-muted)' }}>
            Syncing Epoch AI compute &amp; Frontier Lab telemetry…
          </div>
        ) : tab === 'compute' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <div style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '6px', padding: '6px 8px' }}>
                <div style={{ fontSize: '8px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>TRACKED LOAD</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: 'var(--sov-amber)' }}>{computeStats.totalGw} GW</div>
              </div>
              <div style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '6px', padding: '6px 8px' }}>
                <div style={{ fontSize: '8px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>HIGH CARBON</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: '#ef4444' }}>{computeStats.highCarbon} hubs</div>
              </div>
              <div style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '6px', padding: '6px 8px' }}>
                <div style={{ fontSize: '8px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>WATER STRESS</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: 'var(--sov-sky)' }}>{computeStats.extremeWater} extreme</div>
              </div>
            </div>

            {computeStats.topNodes.map((n) => (
              <div key={n.id} style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '7px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--sov-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '2px' }}>
                    {n.powerLoadMw} MW · {n.carbonIntensity}g/kWh · {n.waterStress}
                  </div>
                </div>
                {onFocusLocation && (
                  <button
                    type="button"
                    onClick={() => onFocusLocation(n.lat, n.lon)}
                    style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 7px', borderRadius: '4px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-accent)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <MapPin size={10} /> Locate
                  </button>
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '7px', padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: 'var(--sov-muted)' }}>
                LIVE SIGNAL VOLUME BY MIT AI RISK DOMAIN
              </div>
              {Object.values(MIT_RISK_DOMAINS).map((dom) => {
                const count = mitCounts.counts[dom.code] || 0;
                const pct = Math.round((count / mitCounts.maxVal) * 100);
                return (
                  <div key={dom.code} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px' }}>
                    <span style={{ width: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sov-text)', fontWeight: 600 }}>
                      {dom.code}: {dom.shortLabel}
                    </span>
                    <div style={{ flex: 1, height: '6px', background: 'var(--sov-panel-bg)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: dom.color }} />
                    </div>
                    <span style={{ width: '24px', textAlign: 'right', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-muted)' }}>{count}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: 'var(--sov-muted)', marginTop: '2px' }}>
              FRONTIER LAB SAFETY COMMITMENTS ({labsData.length})
            </div>
            {labsData.slice(0, 8).map((lab) => (
              <div key={lab.slug} style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '6px', padding: '7px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--sov-text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={12} style={{ color: 'var(--sov-emerald)' }} />
                    {lab.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--sov-muted)' }}>
                    {lab.hq || lab.country} · {lab.safetyFramework || 'Frontier Safety Policy'}
                  </div>
                </div>
                <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--sov-panel-bg)', color: 'var(--sov-sky)', flexShrink: 0 }}>
                  {lab.aisiStatus || lab.euGpaiStatus || 'Monitored'}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
