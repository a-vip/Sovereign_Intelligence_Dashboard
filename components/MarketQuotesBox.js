'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  Search,
  Star,
  ArrowLeft,
  CandlestickChart,
  LineChart,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Lock
} from 'lucide-react';
import WidgetInfoTooltip from './WidgetInfoTooltip';

const CATEGORIES = ['All', 'Watchlist', 'Indices', 'AI', 'Defense', 'Macro', 'Crypto'];
const RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];

function formatPrice(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return '—';
  if (Math.abs(num) >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Math.abs(num) >= 10) return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatVol(val) {
  const n = Number(val) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function formatAxisTime(tsMs, range) {
  const d = new Date(tsMs);
  if (range === '1D') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (range === '5D') {
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
  }
  if (range === '5Y') {
    return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MarketProChart({
  candles,
  range,
  chartType,
  showSma,
  showVolume,
  isPositive,
  onHoverCandle
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const sma20 = useMemo(() => {
    if (!showSma || !candles.length) return [];
    const out = new Array(candles.length).fill(null);
    let sum = 0;
    const period = Math.min(20, Math.max(5, Math.floor(candles.length / 4)));
    for (let i = 0; i < candles.length; i++) {
      sum += candles[i].c;
      if (i >= period) sum -= candles[i - period].c;
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  }, [candles, showSma]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const w = wrap.clientWidth || 420;
    const h = wrap.clientHeight || 220;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (!candles || candles.length === 0) {
      ctx.restore();
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const textCol = styles.getPropertyValue('--sov-text').trim() || '#e2e8f0';
    const mutedCol = styles.getPropertyValue('--sov-muted').trim() || '#94a3b8';
    const borderCol = styles.getPropertyValue('--sov-border').trim() || 'rgba(148,163,184,0.22)';
    const accentCol = styles.getPropertyValue('--sov-accent').trim() || '#0ea5e9';

    const padLeft = 8;
    const padRight = 56;
    const padTop = 12;
    const padBottom = 22;
    const plotW = Math.max(40, w - padLeft - padRight);
    const plotH = Math.max(40, h - padTop - padBottom);
    const volH = showVolume ? Math.round(plotH * 0.2) : 0;
    const priceH = plotH - volH - (showVolume ? 6 : 0);

    let minP = Infinity;
    let maxP = -Infinity;
    let maxVol = 0;
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      if (c.l < minP) minP = c.l;
      if (c.h > maxP) maxP = c.h;
      if (c.v > maxVol) maxVol = c.v;
    }
    if (!Number.isFinite(minP) || !Number.isFinite(maxP)) {
      ctx.restore();
      return;
    }
    const span = Math.max(maxP - minP, maxP * 0.004 || 0.01);
    const lo = minP - span * 0.08;
    const hi = maxP + span * 0.08;

    const n = candles.length;
    const stepX = n > 1 ? plotW / n : plotW;
    const xOf = (idx) => padLeft + (idx + 0.5) * stepX;
    const yOf = (price) => padTop + (1 - (price - lo) / (hi - lo)) * priceH;

    // 1. Subtle horizontal price gridlines & right-axis labels
    ctx.font = '600 9.5px var(--font-jetbrains-fallback), monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const gridSteps = 4;
    for (let g = 0; g <= gridSteps; g++) {
      const frac = g / gridSteps;
      const y = padTop + frac * priceH;
      const val = hi - frac * (hi - lo);
      ctx.strokeStyle = borderCol;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = mutedCol;
      ctx.fillText(formatPrice(val), padLeft + plotW + 6, y);
    }
    ctx.globalAlpha = 1;

    // 2. Bottom time axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const tickCount = Math.min(5, Math.max(2, Math.floor(plotW / 80)));
    for (let t = 0; t < tickCount; t++) {
      const idx = Math.min(n - 1, Math.round((t / Math.max(1, tickCount - 1)) * (n - 1)));
      const x = xOf(idx);
      ctx.fillStyle = mutedCol;
      ctx.fillText(formatAxisTime(candles[idx].t, range), x, padTop + plotH + 5);
    }

    // 3. Volume Histogram Bars
    if (showVolume && maxVol > 0 && volH > 6) {
      const volBaseY = padTop + plotH;
      const barW = Math.max(1.4, Math.min(10, stepX * 0.65));
      for (let i = 0; i < n; i++) {
        const c = candles[i];
        if (!c.v) continue;
        const bh = (c.v / maxVol) * volH;
        const up = c.c >= c.o;
        ctx.fillStyle = up ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)';
        ctx.fillRect(xOf(i) - barW / 2, volBaseY - bh, barW, bh);
      }
    }

    // 4. Primary Price Series (Line/Area OR OHLC Candlesticks)
    const upCol = '#10b981';
    const downCol = '#ef4444';

    if (chartType === 'candles') {
      const bodyW = Math.max(2.2, Math.min(12, stepX * 0.68));
      for (let i = 0; i < n; i++) {
        const c = candles[i];
        const x = xOf(i);
        const yO = yOf(c.o);
        const yC = yOf(c.c);
        const yH = yOf(c.h);
        const yL = yOf(c.l);
        const up = c.c >= c.o;
        const col = up ? upCol : downCol;

        // High-low wick
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(1, Math.min(1.6, bodyW * 0.2));
        ctx.beginPath();
        ctx.moveTo(x, yH);
        ctx.lineTo(x, yL);
        ctx.stroke();

        // Open-close body
        const top = Math.min(yO, yC);
        const height = Math.max(1.5, Math.abs(yC - yO));
        ctx.fillStyle = col;
        ctx.fillRect(x - bodyW / 2, top, bodyW, height);
      }
    } else {
      const lineCol = isPositive ? upCol : downCol;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xOf(i);
        const y = yOf(candles[i].c);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = lineCol;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Subtle gradient area fill underneath
      ctx.lineTo(xOf(n - 1), padTop + priceH);
      ctx.lineTo(xOf(0), padTop + priceH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + priceH);
      grad.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.26)' : 'rgba(239, 68, 68, 0.24)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // 5. Optional SMA 20 Overlay Curve
    if (showSma && sma20.length) {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        if (sma20[i] == null) continue;
        const x = xOf(i);
        const y = yOf(sma20[i]);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Interactive Crosshair + Price Tag
    if (hoverIdx !== null && candles[hoverIdx]) {
      const c = candles[hoverIdx];
      const hx = xOf(hoverIdx);
      const hy = yOf(c.c);

      ctx.save();
      ctx.strokeStyle = mutedCol;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, padTop + plotH);
      ctx.moveTo(padLeft, hy);
      ctx.lineTo(padLeft + plotW, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Highlight point
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fillStyle = accentCol;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Right-axis live price pill
      const tagH = 16;
      const tagY = Math.max(padTop, Math.min(padTop + priceH - tagH, hy - tagH / 2));
      ctx.fillStyle = accentCol;
      ctx.fillRect(padLeft + plotW + 2, tagY, padRight - 4, tagH);
      ctx.fillStyle = '#020617';
      ctx.font = '800 9px var(--font-jetbrains-fallback), monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatPrice(c.c), padLeft + plotW + 5, tagY + tagH / 2);
      ctx.restore();
    } else if (candles.length > 0) {
      // Latest price marker line
      const last = candles[n - 1];
      const ly = yOf(last.c);
      ctx.save();
      ctx.strokeStyle = isPositive ? upCol : downCol;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(padLeft, ly);
      ctx.lineTo(padLeft + plotW, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Keep textCol referenced cleanly for linter
    void textCol;
    ctx.restore();
  }, [candles, range, chartType, showSma, showVolume, isPositive, hoverIdx, sma20]);

  const handlePointerAt = (clientX) => {
    const wrap = wrapRef.current;
    if (!wrap || !candles.length) return;
    const rect = wrap.getBoundingClientRect();
    const plotW = Math.max(40, rect.width - 8 - 56);
    const relX = clientX - rect.left - 8;
    const idx = Math.max(0, Math.min(candles.length - 1, Math.floor((relX / plotW) * candles.length)));
    setHoverIdx(idx);
    if (onHoverCandle) onHoverCandle(candles[idx]);
  };

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        height: '214px',
        position: 'relative',
        cursor: 'crosshair',
        touchAction: 'none',
        userSelect: 'none'
      }}
      onPointerMove={(e) => handlePointerAt(e.clientX)}
      onPointerDown={(e) => handlePointerAt(e.clientX)}
      onPointerLeave={() => {
        setHoverIdx(null);
        if (onHoverCandle) onHoverCandle(null);
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

export default function MarketQuotesBox({
  onClose,
  currentUser = null,
  onRequireAuth = null,
  isMobile = false
}) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filter, Sort & Search states
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'symbol' | 'price' | 'change'
  const [sortDir, setSortDir] = useState('desc');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Custom Watchlist state (account-persisted when signed in)
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  // Interactive Chart Mode state
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [expandedChart, setExpandedChart] = useState(false);
  const [chartType, setChartType] = useState('candles'); // 'line' | 'candles'
  const [chartRange, setChartRange] = useState('1M');
  const [showSma, setShowSma] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [hoveredCandle, setHoveredCandle] = useState(null);

  // Viewport-clamped draggable positioning
  const [position, setPosition] = useState({ x: 16, y: 74 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const boxRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768) {
      setPosition({ x: 10, y: 62 });
    } else {
      setPosition({ x: Math.max(16, window.innerWidth - 388), y: 74 });
    }
  }, []);

  // Re-clamp inside viewport whenever width expands for Chart mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetW = selectedQuote ? (expandedChart ? 560 : 470) : 346;
    setPosition((prev) => ({
      x: Math.max(8, Math.min(prev.x, window.innerWidth - Math.min(window.innerWidth - 16, targetW) - 8)),
      y: Math.max(54, Math.min(prev.y, window.innerHeight - 140))
    }));
  }, [selectedQuote, expandedChart]);

  // Load authenticated user's saved custom watchlist
  useEffect(() => {
    if (!currentUser?.email) {
      setWatchlist([]);
      return;
    }
    let alive = true;
    fetch('/api/markets/watchlist', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && Array.isArray(d?.watchlist)) setWatchlist(d.watchlist);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [currentUser?.email]);

  const watchlistSet = useMemo(
    () => new Set(watchlist.map((w) => String(w.ticker || '').toUpperCase())),
    [watchlist]
  );

  const fetchQuotes = useCallback(async (extraWatchlist = watchlist) => {
    setLoading(true);
    try {
      const extraTickers = (extraWatchlist || []).map((w) => w.ticker).filter(Boolean);
      const url = extraTickers.length
        ? `/api/markets?tickers=${encodeURIComponent(extraTickers.join(','))}`
        : '/api/markets';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.quotes)) {
        setQuotes(data.quotes);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch markets:', err);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    fetchQuotes(watchlist);
    const interval = setInterval(() => fetchQuotes(watchlist), 60000);
    return () => clearInterval(interval);
  }, [watchlist, fetchQuotes]);

  // Debounced live global ticker search
  useEffect(() => {
    if (!searchOpen) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/markets/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.results)) {
          setSearchResults(data.results);
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, searchQuery.trim() ? 220 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchOpen, searchQuery]);

  // Fetch historical OHLCV series when a ticker or timeframe is active
  useEffect(() => {
    if (!selectedQuote?.ticker) return;
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError('');
    setHoveredCandle(null);
    fetch(`/api/markets/history?ticker=${encodeURIComponent(selectedQuote.ticker)}&range=${encodeURIComponent(chartRange)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.candles) && data.candles.length > 0) {
          setHistoryData(data);
        } else {
          setHistoryData(null);
          setHistoryError(data?.error || 'Historical chart data unavailable for this timeframe.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryData(null);
          setHistoryError('Unable to reach market history feed right now.');
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedQuote?.ticker, chartRange]);

  const handleToggleWatchlist = async (item, e) => {
    if (e) e.stopPropagation();
    if (!currentUser?.email) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const ticker = String(item.ticker || '').toUpperCase();
    if (!ticker || watchlistBusy) return;
    const exists = watchlistSet.has(ticker);
    setWatchlistBusy(true);
    try {
      const res = await fetch('/api/markets/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: exists ? 'remove' : 'add',
          ticker,
          name: item.name || item.symbol || ticker,
          category: item.category || 'Custom'
        })
      });
      if (res.status === 401) {
        if (onRequireAuth) onRequireAuth();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.watchlist)) {
        setWatchlist(data.watchlist);
      }
    } catch (err) {
      console.error('Watchlist update failed:', err);
    } finally {
      setWatchlistBusy(false);
    }
  };

  // Dragging listeners (mouse + touch header)
  const handleMouseDown = (e) => {
    if (isMobile) return;
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const w = boxRef.current?.offsetWidth || 350;
      const nextX = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX - dragOffset.current.x));
      const nextY = Math.max(54, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
      setPosition({ x: nextX, y: nextY });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'symbol' ? 'asc' : 'desc');
    }
  };

  const displayedQuotes = useMemo(() => {
    let list = [...quotes];
    if (category === 'Watchlist') {
      list = list.filter((q) => watchlistSet.has(String(q.ticker || '').toUpperCase()));
    } else if (category !== 'All') {
      list = list.filter((q) => q.category === category);
    }

    if (sortBy === 'symbol') {
      list.sort((a, b) => (sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol)));
    } else if (sortBy === 'price') {
      list.sort((a, b) => (sortDir === 'asc' ? a.price - b.price : b.price - a.price));
    } else if (sortBy === 'change') {
      list.sort((a, b) => (sortDir === 'asc' ? a.change - b.change : b.change - a.change));
    }
    return list;
  }, [quotes, category, sortBy, sortDir, watchlistSet]);

  const panelWidth = selectedQuote
    ? (expandedChart ? 'min(96vw, 560px)' : 'min(95vw, 470px)')
    : 'min(94vw, 352px)';

  const activeCandle = hoveredCandle || (historyData?.candles?.[historyData.candles.length - 1] ?? null);
  const chartIsPos = (historyData?.changePct ?? selectedQuote?.change ?? 0) >= 0;

  return (
    <div
      ref={boxRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: panelWidth,
        maxHeight: 'calc(100vh - 96px)',
        background: 'var(--sov-panel-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--sov-border)',
        borderRadius: '12px',
        boxShadow: 'var(--sov-shadow)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: 'var(--sov-text)',
        fontFamily: 'var(--font-jetbrains-fallback)',
        userSelect: isDragging ? 'none' : 'auto',
        transition: isDragging ? 'none' : 'width 0.2s ease'
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: '10px 13px',
          background: 'var(--sov-card-bg)',
          borderBottom: '1px solid var(--sov-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
          {selectedQuote ? (
            <button
              type="button"
              onClick={() => setSelectedQuote(null)}
              style={{
                background: 'var(--sov-panel-bg)',
                border: '1px solid var(--sov-border)',
                color: 'var(--sov-text)',
                borderRadius: '5px',
                padding: '3px 7px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Back to markets list"
            >
              <ArrowLeft size={12} /> Back
            </button>
          ) : (
            <DollarSign size={15} color="#10b981" />
          )}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.07em',
              color: 'var(--sov-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {selectedQuote ? `${selectedQuote.ticker}` : 'MARKETS'}
          </span>
          {!selectedQuote && lastUpdated && (
            <span style={{ fontSize: '9px', color: 'var(--sov-muted)' }}>
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <WidgetInfoTooltip
            title="Live Strategic Markets & Pro Charts"
            accent="#10b981"
            description="Tracks real-time prices across global stock indexes, AI chipmakers, defense contractors, energy commodities, and crypto — helping you see how world events move financial markets."
            bullets={[
              'Click any row to open an interactive historical chart with Line/Area or OHLC Candlesticks, volume, and moving averages.',
              'Use the search icon to look up any public stock, ETF, commodity, FX pair, or crypto ticker worldwide.',
              'Sign in to star and save your own custom Watchlist synced to your account.'
            ]}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {!selectedQuote && (
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              title="Search & add global market tickers"
              style={{
                background: searchOpen ? 'var(--sov-accent-soft)' : 'transparent',
                border: searchOpen ? '1px solid var(--sov-accent)' : '1px solid transparent',
                color: searchOpen ? 'var(--sov-accent)' : 'var(--sov-muted)',
                borderRadius: '5px',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Search size={13} />
            </button>
          )}
          {selectedQuote && !isMobile && (
            <button
              type="button"
              onClick={() => setExpandedChart((e) => !e)}
              title={expandedChart ? 'Compact chart width' : 'Expand chart width'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sov-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {expandedChart ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (selectedQuote) {
                setChartRange((r) => r);
                fetchQuotes(watchlist);
              } else {
                fetchQuotes(watchlist);
              }
            }}
            title="Refresh live quotes"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--sov-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Markets"
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              color: 'var(--sov-text)',
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* VIEW 1: PRO INTERACTIVE HISTORICAL CHART */}
      {selectedQuote ? (
        <div style={{ padding: '11px 13px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {/* Asset Title & Live Price Strip */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sov-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {historyData?.name || selectedQuote.name || selectedQuote.symbol}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--sov-muted)', marginTop: '2px' }}>
                {selectedQuote.ticker}
                {historyData?.exchangeName ? ` · ${historyData.exchangeName}` : ''}
                {historyData?.currency ? ` · ${historyData.currency}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--sov-text)' }}>
                  {formatPrice(historyData?.currentPrice ?? selectedQuote.price)}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: chartIsPos ? '#10b981' : '#ef4444' }}>
                  {chartIsPos ? '+' : ''}{(historyData?.changePct ?? selectedQuote.change ?? 0).toFixed(2)}% ({chartRange})
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleToggleWatchlist(selectedQuote, e)}
                title={currentUser ? (watchlistSet.has(selectedQuote.ticker) ? 'Remove from saved Watchlist' : 'Save to Watchlist') : 'Sign in to save to Watchlist'}
                style={{
                  background: watchlistSet.has(selectedQuote.ticker) ? 'rgba(245, 158, 11, 0.16)' : 'var(--sov-card-bg)',
                  border: watchlistSet.has(selectedQuote.ticker) ? '1px solid #f59e0b' : '1px solid var(--sov-border)',
                  color: watchlistSet.has(selectedQuote.ticker) ? '#f59e0b' : 'var(--sov-muted)',
                  borderRadius: '6px',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <Star size={13} fill={watchlistSet.has(selectedQuote.ticker) ? '#f59e0b' : 'none'} />
              </button>
            </div>
          </div>

          {/* Chart Type + Overlay + Timescale Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setChartType('line')}
                style={{
                  padding: '3px 7px',
                  borderRadius: '5px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: chartType === 'line' ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                  background: chartType === 'line' ? 'var(--sov-accent-soft)' : 'var(--sov-card-bg)',
                  color: chartType === 'line' ? 'var(--sov-accent)' : 'var(--sov-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LineChart size={11} /> Line
              </button>
              <button
                type="button"
                onClick={() => setChartType('candles')}
                style={{
                  padding: '3px 7px',
                  borderRadius: '5px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: chartType === 'candles' ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                  background: chartType === 'candles' ? 'var(--sov-accent-soft)' : 'var(--sov-card-bg)',
                  color: chartType === 'candles' ? 'var(--sov-accent)' : 'var(--sov-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CandlestickChart size={11} /> Candles
              </button>
              <button
                type="button"
                onClick={() => setShowSma((s) => !s)}
                style={{
                  padding: '3px 6px',
                  borderRadius: '5px',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: showSma ? '1px solid #f59e0b' : '1px solid var(--sov-border)',
                  background: showSma ? 'rgba(245, 158, 11, 0.14)' : 'var(--sov-card-bg)',
                  color: showSma ? '#f59e0b' : 'var(--sov-muted)'
                }}
                title="Toggle 20-period Simple Moving Average"
              >
                SMA
              </button>
              <button
                type="button"
                onClick={() => setShowVolume((v) => !v)}
                style={{
                  padding: '3px 6px',
                  borderRadius: '5px',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: showVolume ? '1px solid #10b981' : '1px solid var(--sov-border)',
                  background: showVolume ? 'rgba(16, 185, 129, 0.14)' : 'var(--sov-card-bg)',
                  color: showVolume ? '#10b981' : 'var(--sov-muted)'
                }}
                title="Toggle Volume bars"
              >
                VOL
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: chartRange === r ? '1px solid var(--sov-accent)' : '1px solid transparent',
                    background: chartRange === r ? 'var(--sov-accent-soft)' : 'transparent',
                    color: chartRange === r ? 'var(--sov-accent)' : 'var(--sov-muted)'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Live OHLCV Crosshair Readout */}
          {activeCandle && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '5px 8px',
                borderRadius: '6px',
                background: 'var(--sov-card-bg)',
                border: '1px solid var(--sov-border)',
                fontSize: '9.5px',
                color: 'var(--sov-muted)'
              }}
            >
              <span>O <strong style={{ color: 'var(--sov-text)' }}>{formatPrice(activeCandle.o)}</strong></span>
              <span>H <strong style={{ color: '#10b981' }}>{formatPrice(activeCandle.h)}</strong></span>
              <span>L <strong style={{ color: '#ef4444' }}>{formatPrice(activeCandle.l)}</strong></span>
              <span>C <strong style={{ color: 'var(--sov-text)' }}>{formatPrice(activeCandle.c)}</strong></span>
              {activeCandle.v > 0 && <span>V <strong style={{ color: 'var(--sov-text)' }}>{formatVol(activeCandle.v)}</strong></span>}
              <span style={{ marginLeft: 'auto', opacity: 0.85 }}>
                {new Date(activeCandle.t).toLocaleString([], chartRange === '1D' ? { hour: '2-digit', minute: '2-digit' } : { month: 'short', day: 'numeric', year: '2-digit' })}
              </span>
            </div>
          )}

          {/* Canvas Container */}
          <div
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              borderRadius: '8px',
              padding: '6px 4px 4px 4px',
              minHeight: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {historyLoading ? (
              <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)' }}>
                Loading {chartRange} OHLCV history for {selectedQuote.ticker}…
              </div>
            ) : historyError ? (
              <div style={{ fontSize: '10.5px', color: '#ef4444', textAlign: 'center', padding: '16px' }}>
                {historyError}
              </div>
            ) : (
              <MarketProChart
                candles={historyData?.candles || []}
                range={chartRange}
                chartType={chartType}
                showSma={showSma}
                showVolume={showVolume}
                isPositive={chartIsPos}
                onHoverCandle={setHoveredCandle}
              />
            )}
          </div>

          {/* Period Summary Metrics */}
          {historyData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <div style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)' }}>
                <div style={{ fontSize: '8.5px', color: 'var(--sov-muted)', fontWeight: 700 }}>{chartRange} HIGH</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{formatPrice(historyData.periodHigh)}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)' }}>
                <div style={{ fontSize: '8.5px', color: 'var(--sov-muted)', fontWeight: 700 }}>{chartRange} LOW</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>{formatPrice(historyData.periodLow)}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)' }}>
                <div style={{ fontSize: '8.5px', color: 'var(--sov-muted)', fontWeight: 700 }}>BASE / PREV</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sov-text)', marginTop: '2px' }}>{formatPrice(historyData.previousClose)}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: CLEAN SCANNABLE LIVE MARKETS LIST */
        <>
          {/* Optional Collapsible Ticker Search & Add Drawer */}
          {searchOpen && (
            <div
              style={{
                padding: '9px 12px',
                borderBottom: '1px solid var(--sov-border)',
                background: 'var(--sov-card-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '7px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search symbol or company (e.g. AAPL, TSM, BTC, EURUSD)..."
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'var(--sov-panel-bg)',
                    border: '1px solid var(--sov-border)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '10.5px',
                    color: 'var(--sov-text)',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--sov-muted)',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '156px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {searching ? (
                  <div style={{ fontSize: '10px', color: 'var(--sov-muted)', padding: '6px 2px' }}>Searching global exchanges…</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ fontSize: '10px', color: 'var(--sov-muted)', padding: '6px 2px' }}>No matching instruments found.</div>
                ) : (
                  searchResults.map((item) => {
                    const saved = watchlistSet.has(item.ticker);
                    return (
                      <div
                        key={item.ticker}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          padding: '5px 7px',
                          borderRadius: '6px',
                          background: 'var(--sov-panel-bg)',
                          border: '1px solid var(--sov-border)',
                          fontSize: '10px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQuote({
                              ticker: item.ticker,
                              symbol: item.name,
                              name: item.name,
                              category: item.category || 'Custom',
                              price: null,
                              change: 0
                            });
                            setSearchOpen(false);
                          }}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: 'var(--sov-text)',
                            fontFamily: 'inherit',
                            minWidth: 0,
                            padding: 0
                          }}
                        >
                          <div style={{ fontWeight: 800, color: 'var(--sov-accent)' }}>
                            {item.ticker} <span style={{ fontWeight: 500, color: 'var(--sov-muted)', fontSize: '8.5px' }}>{item.exchange}</span>
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--sov-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleWatchlist(item, e)}
                          title={currentUser ? (saved ? 'Remove from Watchlist' : 'Add to Watchlist') : 'Sign in to save to Watchlist'}
                          style={{
                            padding: '4px 7px',
                            borderRadius: '5px',
                            border: saved ? '1px solid #ef4444' : '1px solid var(--sov-accent)',
                            background: saved ? 'rgba(239, 68, 68, 0.12)' : 'var(--sov-accent-soft)',
                            color: saved ? '#ef4444' : 'var(--sov-accent)',
                            fontSize: '9px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            flexShrink: 0
                          }}
                        >
                          {saved ? <Trash2 size={10} /> : currentUser ? <Plus size={10} /> : <Lock size={9} />}
                          {saved ? 'Remove' : 'Watch'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Compact Category Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '7px 11px',
              borderBottom: '1px solid var(--sov-border)',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: active ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                    background: active ? 'var(--sov-accent-soft)' : 'transparent',
                    color: active ? 'var(--sov-accent)' : 'var(--sov-muted)',
                    fontFamily: 'inherit'
                  }}
                >
                  {cat === 'Watchlist' ? `★ Watchlist${watchlist.length ? ` (${watchlist.length})` : ''}` : cat}
                </button>
              );
            })}
          </div>

          {/* Sortable Column Headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 78px 62px',
              padding: '7px 14px',
              fontSize: '9.5px',
              fontWeight: 700,
              color: 'var(--sov-muted)',
              letterSpacing: '0.06em',
              borderBottom: '1px solid var(--sov-border)'
            }}
          >
            <button
              type="button"
              onClick={() => toggleSort('symbol')}
              style={{ background: 'transparent', border: 'none', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }}
            >
              SYMBOL {sortBy === 'symbol' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </button>
            <button
              type="button"
              onClick={() => toggleSort('price')}
              style={{ background: 'transparent', border: 'none', color: 'inherit', font: 'inherit', textAlign: 'right', cursor: 'pointer', padding: 0 }}
            >
              PRICE {sortBy === 'price' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </button>
            <button
              type="button"
              onClick={() => toggleSort('change')}
              style={{ background: 'transparent', border: 'none', color: 'inherit', font: 'inherit', textAlign: 'right', cursor: 'pointer', padding: 0 }}
            >
              CHG {sortBy === 'change' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </button>
          </div>

          {/* Watchlist Signed-Out Gate / Empty State */}
          {category === 'Watchlist' && !currentUser ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--sov-accent)" />
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--sov-text)' }}>
                Save Your Custom Watchlist
              </div>
              <div style={{ fontSize: '10px', lineHeight: 1.5, color: 'var(--sov-muted)', fontFamily: 'system-ui, sans-serif' }}>
                Sign in or create a free account to add any global stock, ETF, commodity, or crypto ticker and sync your watchlist across sessions.
              </div>
              {onRequireAuth && (
                <button
                  type="button"
                  onClick={onRequireAuth}
                  style={{
                    marginTop: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--sov-accent)',
                    background: 'var(--sov-accent-soft)',
                    color: 'var(--sov-accent)',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Sign In / Sign Up →
                </button>
              )}
            </div>
          ) : category === 'Watchlist' && displayedQuotes.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Star size={18} color="#f59e0b" />
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sov-text)' }}>Your Watchlist is Empty</div>
              <div style={{ fontSize: '10px', color: 'var(--sov-muted)', fontFamily: 'system-ui, sans-serif' }}>
                Click the star icon on any market row or search for any global ticker to pin it here.
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--sov-accent)',
                  background: 'var(--sov-accent-soft)',
                  color: 'var(--sov-accent)',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                + Search & Add Tickers
              </button>
            </div>
          ) : (
            /* Clean Scrollable Market Rows */
            <div style={{ overflowY: 'auto', padding: '4px 6px 8px 6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {loading && quotes.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--sov-muted)' }}>
                  Connecting to live markets…
                </div>
              ) : (
                displayedQuotes.map((q) => {
                  const isPos = q.change >= 0;
                  const isStarred = watchlistSet.has(String(q.ticker || '').toUpperCase());
                  return (
                    <div
                      key={q.ticker || q.symbol}
                      onClick={() => setSelectedQuote(q)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedQuote(q); }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 78px 62px',
                        alignItems: 'center',
                        padding: '7px 8px',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        transition: 'background 0.14s ease',
                        fontSize: '11px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sov-card-bg)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      title={`Click to open ${q.ticker} interactive candlestick & line chart`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        {isPos ? <TrendingUp size={12} color="#10b981" style={{ flexShrink: 0 }} /> : <TrendingDown size={12} color="#ef4444" style={{ flexShrink: 0 }} />}
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--sov-text)', fontWeight: 600 }}>
                          {q.symbol}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleWatchlist(q, e)}
                          title={currentUser ? (isStarred ? 'Remove from Watchlist' : 'Save to Watchlist') : 'Sign in to customize Watchlist'}
                          style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: isStarred ? '#f59e0b' : 'var(--sov-muted)',
                            opacity: isStarred ? 1 : 0.35,
                            display: 'inline-flex',
                            flexShrink: 0
                          }}
                        >
                          <Star size={11} fill={isStarred ? '#f59e0b' : 'none'} />
                        </button>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--sov-text)' }}>
                        {formatPrice(q.price)}
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 800, color: isPos ? '#10b981' : '#ef4444' }}>
                        {isPos ? '+' : ''}{Number(q.change || 0).toFixed(1)}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Subtle Bottom Hint Bar */}
          <div
            style={{
              padding: '6px 12px',
              borderTop: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '9px',
              color: 'var(--sov-muted)'
            }}
          >
            <span>Click any ticker for OHLC candles & history</span>
            <button
              type="button"
              onClick={() => {
                if (!currentUser && onRequireAuth) {
                  onRequireAuth();
                } else {
                  setSearchOpen(true);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sov-accent)',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '9px',
                padding: 0
              }}
            >
              {currentUser ? '+ Add Ticker' : 'Customize →'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
