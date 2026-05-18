'use client';
import { useState, useEffect, useRef } from 'react';
import { RefreshCw, X, TrendingUp, TrendingDown } from 'lucide-react';

const INITIAL_QUOTES = [
  { symbol: 'S&P500', icon: '📈', name: 'S&P500', price: 7409, chg: -1.2, isUp: false },
  { symbol: 'FTSE 100', region: 'GB', name: 'FTSE 100', price: 10195, chg: -1.7, isUp: false },
  { symbol: 'Shanghai Composite', region: 'CN', name: 'Shanghai Composite', price: 4135, chg: -2.5, isUp: false },
  { symbol: 'Nikkei', region: 'JP', name: 'Nikkei', price: 61409, chg: -2.0, isUp: false },
  { symbol: 'Gold', icon: '🥇', name: 'Gold', price: 4543, chg: -0.4, isUp: false },
  { symbol: 'Silver', icon: '🥈', name: 'Silver', price: 76.74, chg: -1.0, isUp: false },
  { symbol: 'BTC', icon: '₿', name: 'BTC', price: 77194, chg: -1.2, isUp: false },
  { symbol: 'WTI', icon: '🛢️', name: 'WTI', price: 102.56, chg: 1.5, isUp: true },
  { symbol: 'Brent', icon: '🛢️', name: 'Brent', price: 110.71, chg: 1.3, isUp: true },
  { symbol: 'VIX', icon: '😱', name: 'VIX', price: 18.52, chg: 7.3, isUp: true },
];

export default function MarketQuotesBox({ onClose }) {
  const [quotes, setQuotes] = useState(INITIAL_QUOTES);
  const [lastUpdated, setLastUpdated] = useState('just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Position state for dragging (default centered horizontally on mobile, positioned elegantly on desktop)
  const [pos, setPos] = useState({ x: 340, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Center horizontally on mobile viewports on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 900;
      if (mobile) {
        const startX = Math.max(10, (window.innerWidth - 280) / 2);
        setPos({ x: startX, y: 70 });
      }
    }
  }, []);

  const handleDragStart = (e) => {
    if (e.button !== 0) return; // Left click only
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  };

  useEffect(() => {
    const handleDrag = (e) => {
      if (!dragging) return;
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      
      setPos({
        x: dragRef.current.startPosX + (clientX - dragRef.current.startX),
        y: dragRef.current.startPosY + (clientY - dragRef.current.startY),
      });
    };

    const handleDragEnd = () => setDragging(false);

    if (dragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [dragging]);

  // Live ticking simulation
  useEffect(() => {
    const tick = () => {
      setQuotes(prev =>
        prev.map(q => {
          // VIX has higher volatility, others are smaller
          const factor = q.symbol === 'VIX' ? 2 : 0.4;
          const fluctuation = (Math.random() * 2 - 1) * factor;
          const priceChangePercent = fluctuation / 100;
          const newPrice = q.price * (1 + priceChangePercent);
          const newChg = q.chg + fluctuation;

          // Decimals formatting helper
          let decimals = q.price > 1000 ? 0 : 2;
          if (q.symbol === 'Silver' || q.symbol === 'WTI' || q.symbol === 'Brent' || q.symbol === 'VIX') {
            decimals = 2;
          }

          return {
            ...q,
            price: parseFloat(newPrice.toFixed(decimals)),
            chg: parseFloat(newChg.toFixed(1)),
            isUp: newChg >= 0,
          };
        })
      );
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    const interval = setInterval(tick, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setQuotes(prev =>
        prev.map(q => {
          const shift = (Math.random() * 1.5 - 0.75);
          return {
            ...q,
            chg: parseFloat((q.chg + shift).toFixed(1)),
            isUp: (q.chg + shift) >= 0,
          };
        })
      );
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: '280px',
        background: 'rgba(8, 12, 24, 0.95)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.08)',
        zIndex: 100,
        fontFamily: 'monospace',
        color: '#e2e8f0',
        userSelect: 'none',
        backdropFilter: 'blur(12px)',
        transition: dragging ? 'none' : 'transform 0.1s ease',
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>$</span>
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.1em', color: '#ffffff' }}>MARKETS</span>
          <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.35)', marginLeft: '4px' }}>{lastUpdated}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleManualRefresh}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
          >
            <RefreshCw size={12} className={isRefreshing ? 'spinning' : ''} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Column Labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 12px 4px 12px',
          fontSize: '8.5px',
          fontWeight: 'bold',
          color: 'rgba(255, 255, 255, 0.3)',
          letterSpacing: '0.05em',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        <div style={{ width: '135px' }}>SYMBOL</div>
        <div style={{ width: '65px', textAlign: 'right' }}>PRICE</div>
        <div style={{ width: '55px', textAlign: 'right' }}>CHG</div>
      </div>

      {/* Quotes List */}
      <div style={{ padding: '4px 0' }}>
        {quotes.map((q, idx) => (
          <div
            key={q.symbol}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px 12px',
              fontSize: '10.5px',
              transition: 'background 0.2s',
              background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'}
          >
            {/* Symbol name and arrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '135px', minWidth: '135px', overflow: 'hidden' }}>
              {q.isUp ? (
                <TrendingUp size={11} color="#22c55e" style={{ flexShrink: 0 }} />
              ) : (
                <TrendingDown size={11} color="#ef4444" style={{ flexShrink: 0 }} />
              )}
              <span style={{ color: '#e2e8f0', fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={q.name}>
                {q.name}
              </span>
              {q.icon && <span style={{ fontSize: '10px', flexShrink: 0 }}>{q.icon}</span>}
              {q.region && (
                <span 
                  style={{ 
                    fontSize: '8px', 
                    color: '#38bdf8', 
                    border: '1px solid rgba(56, 189, 248, 0.25)', 
                    padding: '0px 2.5px', 
                    borderRadius: '3px', 
                    background: 'rgba(56, 189, 248, 0.05)', 
                    fontWeight: '800',
                    flexShrink: 0,
                    letterSpacing: '0.02em'
                  }}
                >
                  {q.region}
                </span>
              )}
            </div>

            {/* Price */}
            <div style={{ width: '65px', textAlign: 'right', color: '#f8fafc', fontWeight: 'bold' }}>
              {q.price.toLocaleString(undefined, { minimumFractionDigits: q.price > 1000 ? 0 : 2 })}
            </div>

            {/* Change */}
            <div
              style={{
                width: '55px',
                textAlign: 'right',
                color: q.isUp ? '#22c55e' : '#ef4444',
                fontWeight: 'bold',
              }}
            >
              {q.isUp ? '+' : ''}
              {q.chg.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
