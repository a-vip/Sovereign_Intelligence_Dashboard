'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Faint circled "?" helper tooltip for floating tactical widgets.
 * Renders via React Portal with fixed viewport-clamped positioning so it NEVER clips
 * inside overflow:hidden widget shells on desktop or mobile.
 */
export default function WidgetInfoTooltip({
  title,
  description,
  bullets = [],
  accent = 'var(--sov-accent)'
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [coords, setCoords] = useState({ top: 80, left: 16, width: 280 });
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const computeCoords = () => {
    if (!btnRef.current || typeof window === 'undefined') return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(286, vw - 24);
    const left = Math.max(12, Math.min(vw - width - 12, rect.left - 18));
    // Place below button unless near bottom edge
    const estHeight = 190;
    const top = rect.bottom + 8 + estHeight > vh - 12
      ? Math.max(12, rect.top - estHeight - 8)
      : rect.bottom + 8;
    setCoords({ top, left, width });
  };

  useEffect(() => {
    if (!open) return;
    computeCoords();
    const onDocDown = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        popRef.current && !popRef.current.contains(e.target)
      ) {
        setOpen(false);
        setPinned(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setPinned(false);
      }
    };
    const onWinChange = () => computeCoords();
    document.addEventListener('pointerdown', onDocDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onWinChange, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onDocDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onWinChange);
    };
  }, [open]);

  const tooltipNode = open && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={popRef}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => {
            if (!pinned) setOpen(false);
          }}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            padding: '11px 13px',
            borderRadius: '10px',
            background: 'var(--sov-panel-bg)',
            border: '1px solid var(--sov-border)',
            boxShadow: 'var(--sov-shadow), 0 14px 36px rgba(0, 0, 0, 0.36)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 999999,
            color: 'var(--sov-text)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'left',
            whiteSpace: 'normal',
            letterSpacing: 'normal',
            textTransform: 'none',
            fontWeight: 400
          }}
        >
          {title && (
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: accent,
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <span>{title}</span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPinned(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--sov-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '0 2px',
                  lineHeight: 1
                }}
                aria-label="Close help tooltip"
              >
                ×
              </button>
            </div>
          )}
          {description && (
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                lineHeight: 1.5,
                color: 'var(--sov-text)',
                opacity: 0.92
              }}
            >
              {description}
            </p>
          )}
          {Array.isArray(bullets) && bullets.length > 0 && (
            <ul
              style={{
                margin: '7px 0 0 0',
                paddingLeft: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '10.5px',
                lineHeight: 1.45,
                color: 'var(--sov-muted)'
              }}
            >
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => {
        computeCoords();
        setOpen(true);
      }}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        ref={btnRef}
        type="button"
        aria-label={`About ${title || 'this module'}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          computeCoords();
          setPinned((prev) => {
            const next = !prev;
            setOpen(next);
            return next;
          });
        }}
        style={{
          width: '17px',
          height: '17px',
          borderRadius: '50%',
          border: '1px solid var(--sov-border)',
          background: open ? 'var(--sov-accent-soft)' : 'transparent',
          color: open ? accent : 'var(--sov-muted)',
          opacity: open ? 1 : 0.62,
          fontSize: '10px',
          fontWeight: 800,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          transition: 'opacity 0.15s ease, border-color 0.15s ease, color 0.15s ease, background 0.15s ease',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.borderColor = accent;
          e.currentTarget.style.color = accent;
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.opacity = '0.62';
            e.currentTarget.style.borderColor = 'var(--sov-border)';
            e.currentTarget.style.color = 'var(--sov-muted)';
          }
        }}
      >
        ?
      </button>
      {tooltipNode}
    </span>
  );
}
