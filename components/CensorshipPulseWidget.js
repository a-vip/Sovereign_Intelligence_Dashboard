'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, WifiOff, RefreshCw, MapPin, ExternalLink, GripHorizontal, Eye, Search, LayoutGrid, Table2 } from 'lucide-react';
import WidgetInfoTooltip from './WidgetInfoTooltip';

export default function CensorshipPulseWidget({
  onClose,
  onFocusLocation,
  censorshipEnabled,
  onToggleCensorshipLayer,
  isMobile = false
}) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('top'); // 'top' | 'ioda' | 'im'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('severity'); // 'severity' | 'rate' | 'blocks' | 'im' | 'ioda' | 'name'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [pos, setPos] = useState({ x: 350, y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/censorship');
      if (r.ok) setPayload(await r.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 900;
      setPos({
        x: mobile ? 10 : Math.max(24, Math.min(window.innerWidth - 420, 380)),
        y: mobile ? 72 : 112
      });
    }
    loadData();
  }, []);

  const handlePointerDown = (e) => {
    if (isMobile) return;
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target?.closest?.('button, a, input, select')) return;
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

  const items = payload?.items || [];
  const totals = useMemo(() => {
    return items.reduce(
      (acc, cur) => {
        acc.blocks += Number(cur.confirmedBlocks) || 0;
        acc.im += Number(cur.imAnomalies) || 0;
        acc.ioda += Number(cur.iodaAlerts) || 0;
        return acc;
      },
      { blocks: 0, im: 0, ioda: 0 }
    );
  }, [items]);

  const displayed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...items];

    if (tab === 'ioda') {
      list = list.filter((i) => i.iodaAlerts > 0);
    } else if (tab === 'im') {
      list = list.filter((i) => i.imAnomalies > 0);
    }

    if (q) {
      list = list.filter((i) =>
        `${i.country || ''} ${i.cc || ''}`.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'rate') return (b.blockRatePct || 0) - (a.blockRatePct || 0);
      if (sortBy === 'blocks') return (b.confirmedBlocks || 0) - (a.confirmedBlocks || 0);
      if (sortBy === 'im') return (b.imAnomalies || 0) - (a.imAnomalies || 0);
      if (sortBy === 'ioda') return (b.iodaAlerts || 0) - (a.iodaAlerts || 0) || (b.confirmedBlocks || 0) - (a.confirmedBlocks || 0);
      if (sortBy === 'name') return String(a.country || '').localeCompare(String(b.country || ''));
      if (tab === 'ioda') return (b.iodaAlerts || 0) - (a.iodaAlerts || 0) || (b.confirmedBlocks || 0) - (a.confirmedBlocks || 0);
      if (tab === 'im') return (b.imAnomalies || 0) - (a.imAnomalies || 0);
      return (b.confirmedBlocks + b.iodaAlerts * 350 + b.imAnomalies * 0.6) - (a.confirmedBlocks + a.iodaAlerts * 350 + a.imAnomalies * 0.6);
    });

    return q ? list : list.slice(0, 36);
  }, [items, tab, searchQuery, sortBy]);

  return (
    <aside
      className="sov-modal-shell"
      aria-label="Live Internet Censorship & Shutdown Pulse"
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: 'min(94vw, 405px)',
        maxHeight: 'calc(100dvh - 134px)',
        zIndex: 1451,
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
      {/* Header */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 13px',
          background: 'var(--sov-card-bg)',
          borderBottom: '1px solid var(--sov-border)',
          cursor: isMobile ? 'default' : (dragging ? 'grabbing' : 'grab'),
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <GripHorizontal size={13} style={{ color: 'var(--sov-muted)' }} />
          <WifiOff size={14} style={{ color: '#f43f5e' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', letterSpacing: '0.05em' }}>
            SHUTDOWN &amp; OONI PULSE
          </span>
          <WidgetInfoTooltip
            title="Live Internet Censorship & Shutdown Pulse"
            accent="#f43f5e"
            description="Shows where governments or telecom providers are blocking websites, disrupting messaging apps (Signal, Telegram, WhatsApp, Tor), or cutting off national internet access over the past 14 days."
            bullets={[
              'OONI (Open Observatory of Network Interference) runs independent citizen network tests worldwide.',
              'IODA (Georgia Tech) detects sudden country-wide internet blackouts via BGP routing and active pings.',
              'Disruption Rate % shows what share of tests in that country failed or were blocked.'
            ]}
          />
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'cards' ? 'table' : 'cards'))}
            title={viewMode === 'cards' ? 'Switch to compact table view' : 'Switch to card view'}
            style={{
              background: 'transparent',
              border: '1px solid var(--sov-border)',
              borderRadius: '5px',
              color: viewMode === 'table' ? '#f43f5e' : 'var(--sov-muted)',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {viewMode === 'cards' ? <Table2 size={12} /> : <LayoutGrid size={12} />}
          </button>
          <button
            type="button"
            onClick={loadData}
            title="Refresh OONI + IODA Telemetry"
            style={{ background: 'transparent', border: '1px solid var(--sov-border)', borderRadius: '5px', color: 'var(--sov-muted)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <RefreshCw size={11} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Shutdown Pulse"
            style={{ background: 'transparent', border: '1px solid var(--sov-border)', borderRadius: '5px', color: 'var(--sov-muted)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Live Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', padding: '8px 12px', borderBottom: '1px solid var(--sov-border)' }}>
        {[
          { k: 'STATES', v: items.length, c: 'var(--sov-text)' },
          { k: 'IODA OUTAGES', v: totals.ioda, c: '#f43f5e' },
          { k: 'WEB BLOCKS', v: totals.blocks > 999 ? `${(totals.blocks / 1000).toFixed(1)}k` : totals.blocks, c: 'var(--sov-amber)' },
          { k: 'IM / TOR', v: totals.im > 999 ? `${(totals.im / 1000).toFixed(1)}k` : totals.im, c: 'var(--sov-purple)' }
        ].map((s) => (
          <div key={s.k} style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '5px', padding: '4px 6px' }}>
            <div style={{ fontSize: '8px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>{s.k}</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: s.c }}>{loading ? '…' : s.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs & Layer Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--sov-border)', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'top', label: 'Severity' },
            { id: 'ioda', label: 'IODA Outages' },
            { id: 'im', label: 'IM & Tor' }
          ].map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '3px 7px',
                  borderRadius: '4px',
                  border: `1px solid ${on ? '#f43f5e' : 'var(--sov-border)'}`,
                  background: on ? 'rgba(244, 63, 94, 0.14)' : 'var(--sov-card-bg)',
                  color: on ? '#f43f5e' : 'var(--sov-muted)',
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
        {onToggleCensorshipLayer && (
          <button
            type="button"
            onClick={onToggleCensorshipLayer}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              border: `1px solid ${censorshipEnabled ? '#f43f5e' : 'var(--sov-border)'}`,
              background: censorshipEnabled ? 'rgba(244, 63, 94, 0.14)' : 'var(--sov-card-bg)',
              color: censorshipEnabled ? '#f43f5e' : 'var(--sov-text)',
              fontSize: '9.5px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Eye size={10} /> {censorshipEnabled ? 'Map On' : 'Show Map'}
          </button>
        )}
      </div>

      {/* Subtle Search + Sort Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderBottom: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Search size={11} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sov-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search country (e.g. Iran, RU, India)..."
            style={{
              width: '100%',
              padding: '4px 7px 4px 23px',
              borderRadius: '5px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-panel-bg)',
              color: 'var(--sov-text)',
              fontSize: '10px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              outline: 'none'
            }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort countries"
          style={{
            padding: '4px 6px',
            borderRadius: '5px',
            border: '1px solid var(--sov-border)',
            background: 'var(--sov-panel-bg)',
            color: 'var(--sov-text)',
            fontSize: '9.5px',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <option value="severity">Severity</option>
          <option value="rate">Block Rate %</option>
          <option value="blocks">Web Blocks</option>
          <option value="im">IM / Tor</option>
          <option value="ioda">IODA Alerts</option>
          <option value="name">Country A–Z</option>
        </select>
      </div>

      {/* Country Feed (Cards or Compact Table) */}
      <div style={{ padding: '10px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {loading && items.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '11.5px', color: 'var(--sov-muted)' }}>
            Querying OONI Explorer &amp; Georgia Tech IODA…
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--sov-muted)' }}>
            {tab === 'ioda'
              ? 'No active country-wide IODA BGP/ping outage alerts in the last 7 days.'
              : 'No matching countries in this filter window.'}
          </div>
        ) : viewMode === 'table' ? (
          <div style={{ border: '1px solid var(--sov-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
              <thead>
                <tr style={{ background: 'var(--sov-card-bg)', color: 'var(--sov-muted)', borderBottom: '1px solid var(--sov-border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 7px' }}>COUNTRY</th>
                  <th style={{ textAlign: 'right', padding: '6px 6px' }}>RATE</th>
                  <th style={{ textAlign: 'right', padding: '6px 6px' }}>BLOCKS</th>
                  <th style={{ textAlign: 'right', padding: '6px 6px' }}>IM/TOR</th>
                  <th style={{ textAlign: 'right', padding: '6px 6px' }}>MAP</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                    <td style={{ padding: '6px 7px', fontWeight: 700, color: 'var(--sov-text)' }}>
                      {row.country} <span style={{ color: 'var(--sov-muted)', fontWeight: 500 }}>({row.cc})</span>
                    </td>
                    <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 800, color: row.color || '#f43f5e' }}>
                      {row.blockRatePct}%
                    </td>
                    <td style={{ padding: '6px 6px', textAlign: 'right', color: 'var(--sov-text)' }}>
                      {Number(row.confirmedBlocks || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 6px', textAlign: 'right', color: 'var(--sov-muted)' }}>
                      {Number(row.imAnomalies || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                      {onFocusLocation && (
                        <button
                          type="button"
                          onClick={() => onFocusLocation(row.lat, row.lon)}
                          style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '4px', color: 'var(--sov-accent)', padding: '2px 5px', cursor: 'pointer' }}
                          title="Fly to country"
                        >
                          <MapPin size={10} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          displayed.map((row) => (
            <div
              key={row.id}
              style={{
                background: 'var(--sov-card-bg)',
                border: '1px solid var(--sov-border)',
                borderLeft: `3px solid ${row.color || '#f43f5e'}`,
                borderRadius: '7px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', color: 'var(--sov-text)' }}>
                  {row.country} ({row.cc})
                </strong>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: row.color || '#f43f5e' }}>
                  {row.blockRatePct}% rate
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                {Number(row.confirmedBlocks || 0).toLocaleString()} web blocks · {Number(row.imAnomalies || 0).toLocaleString()} IM/Tor · {row.iodaAlerts || 0} IODA alerts
              </div>
              {/* Subtle severity meter */}
              <div style={{ height: '3px', width: '100%', background: 'var(--sov-panel-bg)', borderRadius: '99px', overflow: 'hidden', margin: '1px 0' }}>
                <div style={{ width: `${Math.min(100, Math.max(4, Number(row.blockRatePct || 0) * 1.8))}%`, height: '100%', background: row.color || '#f43f5e', opacity: 0.8 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
                {onFocusLocation ? (
                  <button
                    type="button"
                    onClick={() => onFocusLocation(row.lat, row.lon)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-accent)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <MapPin size={10} /> Locate
                  </button>
                ) : <span />}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={row.ooniExplorerUrl || row.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, color: 'var(--sov-sky)', textDecoration: 'none' }}>
                    OONI <ExternalLink size={9} />
                  </a>
                  {row.iodaUrl && (
                    <a href={row.iodaUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, color: '#f43f5e', textDecoration: 'none' }}>
                      IODA <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
