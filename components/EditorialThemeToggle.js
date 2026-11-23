'use client';

import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';

const THEMES = [
  { id: 'obsidian', label: 'Obsidian', dot: '#00f0ff' },
  { id: 'cambridge', label: 'Cambridge', dot: '#60a5fa' },
  { id: 'emerald', label: 'Emerald', dot: '#10b981' },
  { id: 'light', label: 'Light', dot: '#0284c7' }
];

export default function EditorialThemeToggle() {
  const [activeTheme, setActiveTheme] = useState('obsidian');

  useEffect(() => {
    try {
      const uiTheme = localStorage.getItem('sovdash_ui_theme');
      const savedEditorial = localStorage.getItem('sovdash_editorial_theme');
      const resolved = uiTheme || (savedEditorial === 'light' ? 'light' : 'obsidian');
      setActiveTheme(resolved);
      document.documentElement.setAttribute('data-ui-theme', resolved);
      if (resolved === 'light') {
        document.documentElement.classList.add('editorial-light');
      } else {
        document.documentElement.classList.remove('editorial-light');
      }
    } catch {}
  }, []);

  const selectTheme = (themeId) => {
    setActiveTheme(themeId);
    try {
      localStorage.setItem('sovdash_ui_theme', themeId);
      localStorage.setItem('sovdash_editorial_theme', themeId === 'light' ? 'light' : 'dark');
      if (themeId !== 'light') {
        localStorage.setItem('sovdash_last_dark_theme', themeId);
      }
      document.documentElement.setAttribute('data-ui-theme', themeId);
      if (themeId === 'light') {
        document.documentElement.classList.add('editorial-light');
      } else {
        document.documentElement.classList.remove('editorial-light');
      }
    } catch {}
  };

  return (
    <div className="no-print" style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div
        role="group"
        aria-label="Color Theme"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '3px',
          borderRadius: '7px',
          border: '1px solid var(--sov-border)',
          background: 'var(--sov-card-bg)'
        }}
      >
        {THEMES.map((t) => {
          const active = activeTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTheme(t.id)}
              title={`Switch to ${t.label} theme`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 7px',
                borderRadius: '5px',
                border: active ? '1px solid var(--sov-accent)' : '1px solid transparent',
                background: active ? 'var(--sov-panel-bg)' : 'transparent',
                color: active ? 'var(--sov-text)' : 'var(--sov-muted)',
                fontSize: '10.5px',
                fontWeight: active ? 700 : 600,
                fontFamily: 'var(--font-jetbrains-fallback)',
                cursor: 'pointer'
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.dot }} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => typeof window !== 'undefined' && window.print()}
        className="editorial-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid var(--sov-border)',
          background: 'var(--sov-card-bg)',
          color: 'var(--sov-text)',
          fontSize: '10.5px',
          fontWeight: 700,
          fontFamily: 'var(--font-jetbrains-fallback)',
          cursor: 'pointer'
        }}
        title="Print or Save Current Dossier as Clean Academic PDF"
      >
        <Printer size={12} />
        <span>PRINT / PDF</span>
      </button>
    </div>
  );
}
