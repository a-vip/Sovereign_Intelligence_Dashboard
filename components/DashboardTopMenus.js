'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  SlidersHorizontal,
  ChevronDown,
  User,
  LogOut,
  Plus,
  BookOpen,
  RefreshCw,
  MessageSquare,
  Shield,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';

const UI_THEMES = [
  { id: 'obsidian', label: 'Obsidian Cyan', swatch: '#00f0ff', bg: '#060a12' },
  { id: 'cambridge', label: 'Cambridge Navy', swatch: '#60a5fa', bg: '#0a1122' },
  { id: 'emerald', label: 'Emerald Carbon', swatch: '#10b981', bg: '#050f0c' },
  { id: 'light', label: 'Editorial Light', swatch: '#0284c7', bg: '#f8fafc', light: true }
];

const OBSERVATORY_GROUPS = [
  {
    heading: 'GLOBAL MONITORS',
    links: [
      { href: '/jurisdictions', label: 'Jurisdiction Atlas (60)', color: '#c084fc' },
      { href: '/compare', label: 'Regulatory Diff Matrix', color: '#00f0ff' },
      { href: '/readiness', label: 'SAGRI Readiness Index', color: '#34d399' },
      { href: '/labs', label: 'Frontier Lab Watch', color: '#38bdf8' },
      { href: '/compute', label: 'Global Compute Observatory', color: '#facc15' }
    ]
  },
  {
    heading: 'RESEARCH, BRIEFS & API',
    links: [
      { href: '/brief', label: 'Executive Brief & Copilot', color: '#f472b6' },
      { href: '/watchlists', label: 'Watchlists & Alerts', color: '#fb923c' },
      { href: '/whitepaper', label: 'Whitepaper #1 (Academic)', color: '#e2e8f0' },
      { href: '/ai-report', label: 'SovDash AI Hallucination Audit', color: '#10b981' },
      { href: '/developers', label: 'REST / GeoJSON API & Embeds', color: '#22d3ee' },
      { href: '/methodology', label: 'Methodology & Codebook', color: '#94a3b8' }
    ]
  }
];

const MAP_STYLE_OPTIONS = [
  { id: 'tactical', label: 'Tactical Dark' },
  { id: 'minimal', label: 'Clean Dark' },
  { id: 'light', label: 'Editorial Light' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'lights', label: 'Earth Night' },
  { id: 'buildings', label: '3D Urban' }
];

export default function DashboardTopMenus({
  isMobile = false,
  uiTheme = 'obsidian',
  onSelectUiTheme,
  mapStyle = 'tactical',
  setMapStyle,
  mapMode = '3d',
  setMapMode,
  autoRotate = false,
  setAutoRotate,
  tickerSpeed = 'slow',
  setTickerSpeed,
  refreshing = false,
  handleRefresh,
  currentUser = null,
  onOpenCms,
  onAvatarClick,
  setShowAuthModal,
  handleLogout,
  setShowSourceModal,
  setShowResourcesModal,
  setShowCommandPalette,
  onOpenAiCopilot
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const isLightUi = uiTheme === 'light';
  const menuBg = isLightUi ? 'rgba(255, 255, 255, 0.98)' : 'rgba(9, 14, 28, 0.98)';
  const menuBorder = isLightUi ? 'rgba(148, 163, 184, 0.5)' : 'rgba(56, 189, 248, 0.3)';
  const subSurface = isLightUi ? '#f1f5f9' : 'rgba(15, 23, 42, 0.72)';

  const pillBtnStyle = (active = false, iconOnly = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: iconOnly ? 0 : '5px',
    height: '30px',
    width: iconOnly ? '30px' : 'auto',
    padding: iconOnly ? 0 : '0 10px',
    borderRadius: '6px',
    border: `1px solid ${active ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
    background: active ? 'var(--sov-accent-soft)' : 'var(--sov-card-bg)',
    color: active ? 'var(--sov-accent)' : 'var(--sov-text)',
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: 'var(--font-jetbrains-fallback)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    outline: 'none'
  });

  return (
    <div
      ref={rootRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '5px' : '8px',
        position: 'relative',
        flexShrink: 0,
        maxWidth: isMobile ? 'calc(100vw - 135px)' : 'none',
        overflowX: isMobile ? 'auto' : 'visible',
        scrollbarWidth: 'none'
      }}
    >
      {/* 1. Ask AI Copilot */}
      {onOpenAiCopilot && (
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null);
            onOpenAiCopilot();
          }}
          style={{
            ...pillBtnStyle(false, isMobile),
            borderColor: 'var(--sov-accent)',
            background: 'var(--sov-accent-soft)',
            color: 'var(--sov-accent)'
          }}
          title="Ask SovDash AI"
        >
          <Sparkles size={13} />
          {!isMobile && <span>Ask AI</span>}
        </button>
      )}

      {/* 2. Command Search */}
      <button
        type="button"
        onClick={() => {
          setOpenMenu(null);
          setShowCommandPalette(true);
        }}
        style={pillBtnStyle(false, isMobile)}
        title="Quick Search & Jump (Ctrl/Cmd + K)"
      >
        <Search size={13} style={{ color: 'var(--sov-accent)' }} />
        {!isMobile && <span style={{ color: 'var(--sov-muted)', fontWeight: 500 }}>Search</span>}
        {!isMobile && (
          <span
            style={{
              fontSize: '9.5px',
              padding: '1px 5px',
              borderRadius: '4px',
              border: '1px solid var(--sov-border)',
              color: 'var(--sov-accent)'
            }}
          >
            ⌘K
          </span>
        )}
      </button>

      {/* 2. Standalone Refresh Button */}
      <button
        type="button"
        className="tour-refresh-button"
        onClick={() => {
          setOpenMenu(null);
          handleRefresh();
        }}
        disabled={refreshing}
        style={pillBtnStyle(refreshing, true)}
        title="Refresh Live Signals & Reset View"
      >
        <RefreshCw size={13} className={refreshing ? 'spinning' : ''} style={{ color: refreshing ? 'var(--sov-accent)' : 'var(--sov-text)' }} />
      </button>

      {/* 3. Observatory Modules Dropdown (Icon-only on mobile!) */}
      <button
        type="button"
        onClick={() => setOpenMenu((prev) => (prev === 'observatory' ? null : 'observatory'))}
        style={pillBtnStyle(openMenu === 'observatory', isMobile)}
        aria-expanded={openMenu === 'observatory'}
        title="Observatory Modules (Atlas, Compare, Index, Briefs, Whitepaper, API)"
      >
        <LayoutGrid size={13} style={{ color: 'var(--sov-accent)' }} />
        {!isMobile && <span>Observatory</span>}
        {!isMobile && <ChevronDown size={12} />}
      </button>

      {/* 4. Theme & Settings Dropdown */}
      <button
        type="button"
        onClick={() => setOpenMenu((prev) => (prev === 'settings' ? null : 'settings'))}
        style={pillBtnStyle(openMenu === 'settings', isMobile)}
        aria-expanded={openMenu === 'settings'}
        title="Color Theme, Map Style, Sources & Settings"
      >
        <SlidersHorizontal size={13} style={{ color: 'var(--sov-accent)' }} />
        {!isMobile && <span>Theme &amp; Settings</span>}
      </button>

      {/* 5. Compact Account Avatar */}
      {currentUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            className="tour-login-button"
            onClick={() => {
              setOpenMenu(null);
              onAvatarClick('profile');
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid #10b981',
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#10b981',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-jetbrains-fallback)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={`Profile & Bookmarks: ${currentUser.fullName || currentUser.email}`}
          >
            {(currentUser.fullName || 'O').charAt(0).toUpperCase()}
          </button>
          {!isMobile && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sov-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Sign Out"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="tour-login-button"
          onClick={() => {
            setOpenMenu(null);
            setShowAuthModal(true);
          }}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '1px solid var(--sov-border)',
            background: 'var(--sov-card-bg)',
            color: 'var(--sov-accent)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          title="Sign In / Register"
        >
          <User size={13} />
        </button>
      )}

      {/* Popover: Observatory Modules */}
      {openMenu === 'observatory' && (
        <div
          style={{
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? '52px' : 'calc(100% + 8px)',
            right: isMobile ? '10px' : 0,
            left: isMobile ? '10px' : 'auto',
            width: isMobile ? 'auto' : '460px',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: menuBg,
            border: `1px solid ${menuBorder}`,
            borderRadius: '10px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(14px)',
            padding: '14px',
            zIndex: 10050,
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '14px'
          }}
        >
          {OBSERVATORY_GROUPS.map((group) => (
            <div key={group.heading} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  fontWeight: 700,
                  color: 'var(--sov-muted)',
                  letterSpacing: '0.08em',
                  paddingLeft: '6px'
                }}
              >
                {group.heading}
              </div>
              {group.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenMenu(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 9px',
                    borderRadius: '6px',
                    background: subSurface,
                    border: `1px solid ${isLightUi ? '#cbd5e1' : 'rgba(255,255,255,0.06)'}`,
                    color: isLightUi ? '#0f172a' : '#f8fafc',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ color: isLightUi ? '#0284c7' : item.color, fontSize: '11px' }}>→</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Popover: Theme & Settings */}
      {openMenu === 'settings' && (
        <div
          style={{
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? '52px' : 'calc(100% + 8px)',
            right: isMobile ? '10px' : 0,
            left: isMobile ? '10px' : 'auto',
            width: isMobile ? 'auto' : '340px',
            maxHeight: '82vh',
            overflowY: 'auto',
            background: menuBg,
            border: `1px solid ${menuBorder}`,
            borderRadius: '10px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(14px)',
            padding: '14px',
            zIndex: 10050,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* UI Color Themes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-muted)', letterSpacing: '0.08em' }}>
              DASHBOARD COLOR THEME
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {UI_THEMES.map((t) => {
                const active = uiTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectUiTheme(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${active ? t.swatch : isLightUi ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                      background: active ? 'var(--sov-accent-soft)' : subSurface,
                      color: isLightUi ? '#0f172a' : '#f8fafc',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: t.bg,
                        border: `2px solid ${t.swatch}`,
                        flexShrink: 0
                      }}
                    />
                    <span>{t.label}</span>
                    {t.light ? <Sun size={11} style={{ marginLeft: 'auto', color: t.swatch }} /> : <Moon size={10} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Globe Basemap + 3D/2D */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: `1px solid ${menuBorder}`, paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-muted)', letterSpacing: '0.08em' }}>
                MAP STYLE &amp; VIEWPORT
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: '3d', label: '3D GLOBE' },
                  { id: '2d', label: '2D EQUAL EARTH' }
                ].map((opt) => {
                  const active = mapMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMapMode(opt.id);
                        try {
                          localStorage.setItem('sovdash_map_mode_v2', opt.id);
                          window.dispatchEvent(new Event('operator_pref_changed'));
                          if (opt.id === '3d') {
                            window.dispatchEvent(new Event('sovdash_force_3d'));
                          }
                        } catch {}
                      }}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: `1px solid ${active ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                        background: active ? 'var(--sov-accent-soft)' : 'transparent',
                        color: active ? 'var(--sov-accent)' : 'var(--sov-muted)',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-jetbrains-fallback)',
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
              {MAP_STYLE_OPTIONS.map((opt) => {
                const active = mapStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setMapStyle(opt.id);
                      try { localStorage.setItem('operator_pref_mapStyle', opt.id); } catch {}
                    }}
                    style={{
                      padding: '5px 4px',
                      borderRadius: '5px',
                      border: `1px solid ${active ? 'var(--sov-accent)' : isLightUi ? '#cbd5e1' : 'rgba(255,255,255,0.08)'}`,
                      background: active ? 'var(--sov-accent-soft)' : subSurface,
                      color: active ? 'var(--sov-accent)' : isLightUi ? '#334155' : '#cbd5e1',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticker & Auto-Rotate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: `1px solid ${menuBorder}`, paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-muted)' }}>TICKER:</span>
              {['off', 'slow', 'normal'].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => {
                    setTickerSpeed(spd);
                    try { localStorage.setItem('operator_pref_tickerSpeed', spd); } catch {}
                  }}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${tickerSpeed === spd ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                    background: tickerSpeed === spd ? 'var(--sov-accent-soft)' : 'transparent',
                    color: tickerSpeed === spd ? 'var(--sov-accent)' : 'var(--sov-muted)',
                    fontSize: '10px',
                    fontFamily: 'var(--font-jetbrains-fallback)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {spd.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !autoRotate;
                setAutoRotate(next);
                try { localStorage.setItem('operator_pref_autoRotate', String(next)); } catch {}
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: `1px solid ${autoRotate ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                background: autoRotate ? 'var(--sov-accent-soft)' : 'transparent',
                color: autoRotate ? 'var(--sov-accent)' : 'var(--sov-muted)',
                fontSize: '10px',
                fontFamily: 'var(--font-jetbrains-fallback)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              SPIN: {autoRotate ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Workspace Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', borderTop: `1px solid ${menuBorder}`, paddingTop: '10px' }}>
            <button
              type="button"
              onClick={() => { setOpenMenu(null); setShowSourceModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 9px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              <Plus size={13} /> Add Source
            </button>
            <button
              type="button"
              onClick={() => { setOpenMenu(null); setShowResourcesModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 9px', borderRadius: '6px', border: `1px solid ${menuBorder}`, background: subSurface, color: 'var(--sov-accent)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              <BookOpen size={13} /> Resources
            </button>
            <button
              type="button"
              onClick={() => { setOpenMenu(null); onAvatarClick('bookmarks'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 9px', borderRadius: '6px', border: `1px solid ${menuBorder}`, background: subSurface, color: isLightUi ? '#0f172a' : '#e2e8f0', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              Saved Bookmarks
            </button>
            <button
              type="button"
              onClick={() => { setOpenMenu(null); onAvatarClick('suggestions'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 9px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              <MessageSquare size={13} /> Feedback
            </button>
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => { setOpenMenu(null); onOpenCms(); }}
                style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '7px 9px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.45)', background: 'rgba(168,85,247,0.14)', color: '#c084fc', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Shield size={13} /> Open Admin CMS
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
