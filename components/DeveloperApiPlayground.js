'use client';

import React, { useState, useMemo } from 'react';
import { Play, Copy, Check, Terminal } from 'lucide-react';

const ENDPOINT_PRESETS = [
  {
    id: 'signals',
    label: 'v1 Signals Feed',
    basePath: '/api/v1/signals',
    supportsJurisdiction: true,
    supportsGeoJson: true,
    supportsLimit: true
  },
  {
    id: 'jurisdictions',
    label: 'v1 Jurisdictions (38)',
    basePath: '/api/v1/jurisdictions',
    supportsJurisdiction: true,
    jurisdictionParam: 'slug',
    supportsGeoJson: false,
    supportsLimit: false
  },
  {
    id: 'compute',
    label: 'v1 Compute Clusters',
    basePath: '/api/v1/compute',
    supportsJurisdiction: false,
    supportsGeoJson: true,
    supportsLimit: false
  },
  {
    id: 'export',
    label: 'Dataset Datapackage',
    basePath: '/api/v1/export/dataset',
    supportsJurisdiction: false,
    supportsGeoJson: false,
    fixedQuery: 'format=datapackage',
    supportsLimit: false
  }
];

const QUICK_JURISDICTIONS = ['', 'eu', 'us', 'us-ca', 'gb', 'cn', 'in', 'za', 'ke', 'id', 'br', 'ua', 'un'];

export default function DeveloperApiPlayground() {
  const [presetId, setPresetId] = useState('signals');
  const [jurisdiction, setJurisdiction] = useState('za');
  const [format, setFormat] = useState('json');
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const preset = ENDPOINT_PRESETS.find((p) => p.id === presetId) || ENDPOINT_PRESETS[0];

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (preset.fixedQuery) {
      const [k, v] = preset.fixedQuery.split('=');
      params.set(k, v);
    }
    if (preset.supportsJurisdiction && jurisdiction) {
      params.set(preset.jurisdictionParam || 'jurisdiction', jurisdiction);
    }
    if (preset.supportsGeoJson && format === 'geojson') {
      params.set('format', 'geojson');
    }
    if (preset.supportsLimit && limit) {
      params.set('limit', String(limit));
    }
    const qs = params.toString();
    return qs ? `${preset.basePath}?${qs}` : preset.basePath;
  }, [preset, jurisdiction, format, limit]);

  const curlCmd = `curl -sS "https://app.sovdash.com${requestUrl}" | jq .`;

  const handleRun = async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const res = await fetch(requestUrl);
      const text = await res.text();
      const ms = Math.round(performance.now() - t0);
      let pretty = text;
      let countLabel = '';
      try {
        const parsed = JSON.parse(text);
        pretty = JSON.stringify(parsed, null, 2);
        const count =
          parsed.features?.length ??
          parsed.signals?.length ??
          parsed.jurisdictions?.length ??
          parsed.data?.length ??
          parsed.clusters?.length ??
          parsed.meta?.total ??
          null;
        if (count !== null) countLabel = `${count} items`;
      } catch {}
      setResult({ status: res.status, ok: res.ok, ms, countLabel, body: pretty });
    } catch (err) {
      setResult({ status: 0, ok: false, ms: Math.round(performance.now() - t0), countLabel: '', body: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (val, kind) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(val);
    if (kind === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 1600);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1600);
    }
  };

  return (
    <section
      style={{
        background: 'var(--sov-panel-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '10px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} style={{ color: 'var(--sov-accent)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--sov-text)' }}>
            Interactive Live API Playground
          </h2>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)' }}>
          TEST REAL ENDPOINTS DIRECTLY IN BROWSER
        </span>
      </div>

      {/* Preset Endpoint Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {ENDPOINT_PRESETS.map((p) => {
          const active = p.id === presetId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPresetId(p.id);
                setResult(null);
              }}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                border: active ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                background: active ? 'var(--sov-card-bg)' : 'transparent',
                color: active ? 'var(--sov-accent)' : 'var(--sov-text)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Query Parameter Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: '10px' }}>
        {preset.supportsJurisdiction && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--sov-muted)' }}>
            <span>Jurisdiction ({preset.jurisdictionParam || 'jurisdiction'})</span>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
            >
              {QUICK_JURISDICTIONS.map((j) => (
                <option key={j || 'all'} value={j}>
                  {j ? j.toUpperCase() : 'All Jurisdictions'}
                </option>
              ))}
            </select>
          </label>
        )}

        {preset.supportsGeoJson && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--sov-muted)' }}>
            <span>Output Format</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
            >
              <option value="json">Structured JSON</option>
              <option value="geojson">RFC 7946 GeoJSON</option>
            </select>
          </label>
        )}

        {preset.supportsLimit && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--sov-muted)' }}>
            <span>Record Limit</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
            >
              <option value={5}>5 records</option>
              <option value={10}>10 records</option>
              <option value={15}>15 records (free max)</option>
            </select>
          </label>
        )}
      </div>

      {/* Built Endpoint + Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--sov-card-bg)',
          border: '1px solid var(--sov-border)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}
      >
        <code style={{ fontSize: '12px', color: 'var(--sov-accent)', wordBreak: 'break-all' }}>
          GET {requestUrl}
        </code>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleCopy(curlCmd, 'curl')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-panel-bg)',
              color: 'var(--sov-text)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {copiedCurl ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedCurl ? 'COPIED CURL' : 'COPY CURL'}</span>
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              background: 'rgba(16, 185, 129, 0.16)',
              color: 'var(--sov-emerald)',
              fontSize: '11px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Play size={12} />
            <span>{loading ? 'RUNNING...' : 'RUN LIVE REQUEST'}</span>
          </button>
        </div>
      </div>

      {/* Live Response Inspector */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', fontWeight: 700 }}>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  color: result.ok ? 'var(--sov-emerald)' : 'var(--sov-danger)',
                  border: `1px solid ${result.ok ? 'rgba(16,185,129,0.45)' : 'rgba(244,63,94,0.45)'}`
                }}
              >
                HTTP {result.status}
              </span>
              <span style={{ color: 'var(--sov-muted)' }}>{result.ms} ms</span>
              {result.countLabel && <span style={{ color: 'var(--sov-sky)' }}>• {result.countLabel}</span>}
            </div>
            <button
              type="button"
              onClick={() => handleCopy(result.body, 'json')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '5px',
                border: '1px solid var(--sov-border)',
                background: 'var(--sov-card-bg)',
                color: 'var(--sov-text)',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {copiedJson ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedJson ? 'COPIED JSON' : 'COPY JSON'}</span>
            </button>
          </div>

          <pre
            style={{
              margin: 0,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              color: 'var(--sov-text)',
              fontSize: '11.5px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              maxHeight: '300px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {result.body.slice(0, 6000)}
            {result.body.length > 6000 ? '\n... [truncated for preview — Copy JSON for full payload]' : ''}
          </pre>
        </div>
      )}
    </section>
  );
}
