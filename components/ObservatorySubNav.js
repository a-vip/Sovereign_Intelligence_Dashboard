'use client';

import React from 'react';
import Link from 'next/link';
import EditorialThemeToggle from './EditorialThemeToggle';

const NAV_ITEMS = [
  { key: 'jurisdictions', label: 'Atlas', href: '/jurisdictions' },
  { key: 'compare', label: 'Legal Diff', href: '/compare' },
  { key: 'readiness', label: 'Readiness', href: '/readiness' },
  { key: 'labs', label: 'Labs', href: '/labs' },
  { key: 'compute', label: 'Compute', href: '/compute' },
  { key: 'brief', label: 'Briefs', href: '/brief' },
  { key: 'watchlists', label: 'Watchlists', href: '/watchlists' },
  { key: 'developers', label: 'API', href: '/developers' },
  { key: 'ai-report', label: 'AI Audit', href: '/ai-report' },
  { key: 'methodology', label: 'Methods', href: '/methodology' },
  { key: 'whitepaper', label: 'Whitepaper', href: '/whitepaper' }
];

export default function ObservatorySubNav({ active = '' }) {
  return (
    <nav
      className="no-print"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderBottom: '1px solid var(--sov-border)',
        paddingBottom: '14px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 11px',
            borderRadius: '6px',
            border: '1px solid var(--sov-border)',
            background: 'var(--sov-panel-bg)',
            color: 'var(--sov-accent)',
            textDecoration: 'none',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontSize: '11.5px',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}
        >
          ← LIVE 3D GLOBE
        </Link>

        <EditorialThemeToggle />
      </div>

      <div className="sov-subnav-scroll" aria-label="Observatory modules">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                padding: '5px 11px',
                borderRadius: '6px',
                fontFamily: 'var(--font-jetbrains-fallback)',
                fontSize: '11.5px',
                fontWeight: isActive ? 800 : 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                border: isActive ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                background: isActive ? 'var(--sov-card-bg)' : 'transparent',
                color: isActive ? 'var(--sov-accent)' : 'var(--sov-text)'
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
