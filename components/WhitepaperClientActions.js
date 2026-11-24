'use client';

import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

export default function WhitepaperClientActions({ bibtex = '', oscola = '' }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  return (
    <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="/api/v1/export/dataset?format=jsonl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.45)', background: 'rgba(16, 185, 129, 0.14)', color: '#34d399', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
          >
            <Download size={12} /> JSONL DATASET
          </a>
          <a
            href="/api/v1/export/dataset?format=csv"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.45)', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
          >
            <Download size={12} /> CSV DATASET
          </a>
          <a
            href="/api/v1/export/dataset?format=datapackage"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '6px', border: '1px solid rgba(192, 132, 252, 0.45)', background: 'rgba(192, 132, 252, 0.12)', color: '#c084fc', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
          >
            DATAPACKAGE.JSON ↗
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
        <div className="editorial-subcard" style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: '#00f0ff' }}>OSCOLA CITATION</span>
            <button
              type="button"
              onClick={() => handleCopy(oscola, 'oscola')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(0,240,255,0.35)', background: 'rgba(0,240,255,0.1)', color: '#00f0ff', fontSize: '10px', cursor: 'pointer' }}
            >
              {copiedKey === 'oscola' ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedKey === 'oscola' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
          <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.5 }}>{oscola}</div>
        </div>

        <div className="editorial-subcard" style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: '#c084fc' }}>BIBTEX ENTRY</span>
            <button
              type="button"
              onClick={() => handleCopy(bibtex, 'bibtex')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(192,132,252,0.35)', background: 'rgba(192,132,252,0.1)', color: '#c084fc', fontSize: '10px', cursor: 'pointer' }}
            >
              {copiedKey === 'bibtex' ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedKey === 'bibtex' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
          <pre style={{ margin: 0, fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-jetbrains-fallback)', overflowX: 'auto' }}>{bibtex}</pre>
        </div>
      </div>
    </div>
  );
}
