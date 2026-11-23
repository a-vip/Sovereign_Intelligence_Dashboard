'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Printer } from 'lucide-react';

export default function EditorialThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    try {
      const uiTheme = localStorage.getItem('sovdash_ui_theme');
      const savedEditorial = localStorage.getItem('sovdash_editorial_theme');
      const light = uiTheme ? uiTheme === 'light' : savedEditorial === 'light';
      setIsLight(light);
      if (light) {
        document.documentElement.setAttribute('data-ui-theme', 'light');
        document.documentElement.classList.add('editorial-light');
      } else {
        const darkTheme = uiTheme && uiTheme !== 'light' ? uiTheme : (localStorage.getItem('sovdash_last_dark_theme') || 'obsidian');
        document.documentElement.setAttribute('data-ui-theme', darkTheme);
        document.documentElement.classList.remove('editorial-light');
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextLight = !isLight;
    setIsLight(nextLight);
    try {
      if (nextLight) {
        const currentUi = localStorage.getItem('sovdash_ui_theme');
        if (currentUi && currentUi !== 'light') {
          localStorage.setItem('sovdash_last_dark_theme', currentUi);
        }
        localStorage.setItem('sovdash_ui_theme', 'light');
        localStorage.setItem('sovdash_editorial_theme', 'light');
        document.documentElement.setAttribute('data-ui-theme', 'light');
        document.documentElement.classList.add('editorial-light');
      } else {
        const darkTheme = localStorage.getItem('sovdash_last_dark_theme') || 'obsidian';
        localStorage.setItem('sovdash_ui_theme', darkTheme);
        localStorage.setItem('sovdash_editorial_theme', 'dark');
        document.documentElement.setAttribute('data-ui-theme', darkTheme);
        document.documentElement.classList.remove('editorial-light');
      }
    } catch {}
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
        title="Switch between Dark Theme and Publication-Ready Editorial Light theme"
      >
        {isLight ? <Moon size={12} /> : <Sun size={12} />}
        <span>{isLight ? 'DARK THEME' : 'EDITORIAL LIGHT'}</span>
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
