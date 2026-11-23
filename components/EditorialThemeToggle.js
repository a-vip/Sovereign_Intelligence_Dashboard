'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Printer } from 'lucide-react';

export default function EditorialThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sovdash_editorial_theme');
      const light = saved === 'light';
      setIsLight(light);
      document.documentElement.classList.toggle('editorial-light', light);
    } catch {}
    return () => {
      document.documentElement.classList.remove('editorial-light');
    };
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    try {
      localStorage.setItem('sovdash_editorial_theme', next ? 'light' : 'dark');
    } catch {}
    document.documentElement.classList.toggle('editorial-light', next);
  };

  return (
    <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={toggleTheme}
        className="editorial-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 11px',
          borderRadius: '6px',
          border: isLight ? '1px solid #94a3b8' : '1px solid rgba(56, 189, 248, 0.35)',
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
          color: isLight ? '#0f172a' : '#38bdf8',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-jetbrains-fallback)',
          cursor: 'pointer'
        }}
        title="Switch between Tactical Dark and Publication-Ready Editorial Light theme"
      >
        {isLight ? <Moon size={12} /> : <Sun size={12} />}
        <span>{isLight ? 'TACTICAL DARK' : 'EDITORIAL LIGHT'}</span>
      </button>

      <button
        type="button"
        onClick={() => typeof window !== 'undefined' && window.print()}
        className="editorial-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '6px 11px',
          borderRadius: '6px',
          border: isLight ? '1px solid #94a3b8' : '1px solid rgba(148, 163, 184, 0.35)',
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
          color: isLight ? '#0f172a' : '#cbd5e1',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-jetbrains-fallback)',
          cursor: 'pointer'
        }}
        title="Print or Export Clean PDF Briefing"
      >
        <Printer size={12} />
        <span>PRINT / PDF</span>
      </button>
    </div>
  );
}
