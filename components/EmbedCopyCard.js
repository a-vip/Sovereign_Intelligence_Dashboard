'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check, ExternalLink } from 'lucide-react';

export default function EmbedCopyCard({
  embedPath = '/embed/jurisdiction/eu',
  title = 'Embed Institutional Widget',
  height = 290
}) {
  const [theme, setTheme] = useState('dark');
  const [copied, setCopied] = useState(false);

  const srcUrl = `https://app.sovdash.com${embedPath}${theme === 'light' ? (embedPath.includes('?') ? '&theme=light' : '?theme=light') : ''}`;
  const snippet = `<iframe src="${srcUrl}" width="100%" height="${height}" style="border:0;border-radius:10px;overflow:hidden;" loading="lazy" title="${title}"></iframe>`;

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={15} style={{ color: 'var(--sov-accent)' }} />
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--sov-text)' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            style={{ padding: '4px 9px', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.35)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', cursor: 'pointer' }}
          >
            THEME: {theme.toUpperCase()}
          </button>
          <a
            href={srcUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--sov-sky)', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
          >
            <span>OPEN EMBED</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <pre style={{ margin: 0, padding: '10px 12px', borderRadius: '6px', background: 'var(--sov-backdrop)', border: '1px solid var(--sov-border)', color: 'var(--sov-muted)', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', overflowX: 'auto' }}>
        {snippet}
      </pre>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={copySnippet}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.45)', background: 'rgba(0, 240, 255, 0.14)', color: 'var(--sov-accent)', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, cursor: 'pointer' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'COPIED IFRAME CODE' : 'COPY IFRAME CODE'}</span>
        </button>
      </div>
    </div>
  );
}
