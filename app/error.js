'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[Sovereign Observatory] Client boundary caught error:', error);
  }, [error]);

  const handleReload = () => {
    if (typeof reset === 'function') {
      try {
        reset();
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--sov-bg, #040914)',
        color: 'var(--sov-text, #f8fafc)',
        fontFamily: 'var(--font-main, system-ui, sans-serif)'
      }}
    >
      <div
        role="alert"
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--sov-panel-bg, rgba(15, 23, 42, 0.92))',
          border: '1px solid var(--sov-border, rgba(148, 163, 184, 0.25))',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--sov-shadow, 0 20px 48px rgba(0, 0, 0, 0.45))',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: 'var(--sov-accent, #38bdf8)',
            fontFamily: 'var(--font-jetbrains-fallback, monospace)'
          }}
        >
          SOVEREIGN OBSERVATORY // RECOVERY
        </div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--sov-text, #f8fafc)' }}>
          The observatory encountered a display error
        </h2>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: 'var(--sov-muted, #94a3b8)' }}>
          A client module failed to render on this device. Your saved bookmarks and settings are safe.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={handleReload}
            style={{
              padding: '9px 16px',
              borderRadius: '7px',
              border: '1px solid var(--sov-accent, #38bdf8)',
              background: 'var(--sov-accent, #38bdf8)',
              color: '#040914',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Reload Observatory
          </button>
        </div>
      </div>
    </div>
  );
}
