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
    <div style={{ background: 'rgba(11, 17, 32, 0.88)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={15} style={{ color: '#00f0ff' }} />
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            style={{ padding: '4px 9px', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(15, 23, 42, 0.7)', color: '#cbd5e1', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', cursor: 'pointer' }}
          >
            THEME: {theme.toUpperCase()}
          </button>
          <a
            href={srcUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
          >
            <span>OPEN EMBED</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <pre style={{ margin: 0, padding: '10px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.85)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', overflowX: 'auto' }}>
        {snippet}
      </pre>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={copySnippet}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.45)', background: 'rgba(0, 240, 255, 0.14)', color: '#00f0ff', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, cursor: 'pointer' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'COPIED IFRAME CODE' : 'COPY IFRAME CODE'}</span>
        </button>
      </div>
    </div>
  );
}
