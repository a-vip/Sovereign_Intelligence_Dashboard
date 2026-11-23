'use client';

import React, { useState, useEffect } from 'react';
import { Rss, Plus, Globe, Check, Trash2, RefreshCw, MapPin, Shield, X, ExternalLink } from 'lucide-react';

export default function SourceManagerModal({
  onClose,
  currentUser,
  selectedRssSources = [],
  onToggleRssSource,
  onSourcesIngested,
  onFlyToEvent
}) {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'custom' | 'registry'
  const [builtInSources, setBuiltInSources] = useState([]);
  const [customSources, setCustomSources] = useState([]);
  const [curatedCatalog, setCuratedCatalog] = useState([]);
  const [loadingRegistry, setLoadingRegistry] = useState(true);

  // Custom form state
  const [feedUrl, setFeedUrl] = useState('');
  const [feedName, setFeedName] = useState('');
  const [categoryHint, setCategoryHint] = useState('Political');
  const [keywords, setKeywords] = useState('');

  // Ingestion status & live telemetry
  const [ingestingId, setIngestingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [ingestReport, setIngestReport] = useState(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'workwithavip@gmail.com';

  const loadSources = async () => {
    setLoadingRegistry(true);
    try {
      const res = await fetch('/api/sources', { cache: 'no-store' });
      const data = await res.json();
      if (data.builtInSources) setBuiltInSources(data.builtInSources);
      if (data.customSources) setCustomSources(data.customSources);
      if (data.curatedCatalog) setCuratedCatalog(data.curatedCatalog);
    } catch (e) {
      console.error('Failed to load sources registry:', e);
    } finally {
      setLoadingRegistry(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleIngestSource = async (payload, loaderKey = 'custom') => {
    setErrorMsg('');
    setIngestReport(null);
    setIngestingId(loaderKey);

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to parse or ingest RSS/Atom feed.');
        setIngestingId(null);
        return;
      }

      setIngestReport(data);
      if (loaderKey === 'custom') {
        setFeedUrl('');
        setFeedName('');
        setKeywords('');
      }

      await loadSources();

      // Notify parent LiveMap to immediately merge new pins & enable the source sid
      if (onSourcesIngested) {
        onSourcesIngested(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error while ingesting intelligence source.');
    } finally {
      setIngestingId(null);
    }
  };

  const handleDeleteSource = async (sid) => {
    try {
      const res = await fetch(`/api/sources?sid=${encodeURIComponent(sid)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCustomSources(prev => prev.filter(s => s.sid !== sid && s.id !== sid));
      }
    } catch (err) {
      console.error('Failed to delete custom source:', err);
    }
  };

  const activeUrls = new Set([
    ...builtInSources.map(s => (s.url || '').toLowerCase()),
    ...customSources.map(s => (s.url || '').toLowerCase())
  ]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--sov-backdrop)',
        backdropFilter: 'blur(10px)',
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '88vh',
          background: 'var(--sov-panel-bg)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 240, 255, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--sov-text)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--sov-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--sov-card-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sov-accent)'
            }}>
              <Rss size={17} />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 800,
                fontFamily: 'var(--font-jetbrains-fallback, monospace)',
                letterSpacing: '0.06em',
                color: 'var(--sov-text)',
                textTransform: 'uppercase'
              }}>
                OSINT Source & Auto-Pin Engine
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--sov-muted)', marginTop: '2px' }}>
                Ingest live RSS/Atom feeds • Strict AI, Cyber & Tech Policy filter • Auto-geocode pins to Globe
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              borderRadius: '6px',
              color: 'var(--sov-muted)',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Close Source Manager (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--sov-border)',
          background: 'var(--sov-panel-bg)'
        }}>
          {[
            { id: 'directory', label: '🌐 CURATED TECH POLICY FEEDS' },
            { id: 'custom', label: '➕ ADD CUSTOM RSS / ATOM URL' },
            { id: 'registry', label: `📡 ACTIVE SOURCES (${builtInSources.length + customSources.length})` }
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrorMsg('');
                }}
                style={{
                  flex: 1,
                  padding: '11px 10px',
                  background: active ? 'rgba(0, 240, 255, 0.09)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #00f0ff' : '2px solid transparent',
                  color: active ? '#00f0ff' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-jetbrains-fallback, monospace)',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{
          padding: '18px 20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Error Banner */}
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '11.5px',
              fontFamily: 'monospace'
            }}>
              ⚠ {errorMsg}
            </div>
          )}

          {/* Live Ingestion Telemetry Report */}
          {ingestReport && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.38)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: 'var(--sov-emerald)' }}>
                  <Check size={15} />
                  <span>SOURCE SYNCED: {ingestReport.source?.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontFamily: 'monospace', fontSize: '10.5px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--sov-card-bg)', color: 'var(--sov-text)' }}>
                    Scanned: <strong>{ingestReport.stats?.fetchedCount || 0}</strong>
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(56,189,248,0.14)', color: 'var(--sov-sky)' }}>
                    Policy Relevant: <strong>{ingestReport.stats?.relevantCount || 0}</strong>
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', color: 'var(--sov-emerald)' }}>
                    Globe Pins Added: <strong>{ingestReport.stats?.pinnedCount || 0}</strong>
                  </span>
                </div>
              </div>

              {ingestReport.pinnedEvents && ingestReport.pinnedEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '170px', overflowY: 'auto', paddingRight: '4px' }}>
                  {ingestReport.pinnedEvents.slice(0, 8).map((ev, i) => (
                    <div
                      key={ev.id || i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        background: 'var(--sov-panel-bg)',
                        border: '1px solid var(--sov-border)',
                        fontSize: '11.5px'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: 'var(--sov-text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.title}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--sov-sky)', fontFamily: 'monospace', marginTop: '2px' }}>
                          📍 {ev.location} • {ev.details?.domainPillar || ev.category} • S{ev.severity}
                        </div>
                      </div>
                      {onFlyToEvent && (
                        <button
                          onClick={() => {
                            onFlyToEvent(ev);
                            onClose();
                          }}
                          style={{
                            flexShrink: 0,
                            padding: '4px 9px',
                            borderRadius: '4px',
                            background: 'rgba(0, 240, 255, 0.14)',
                            border: '1px solid rgba(0, 240, 255, 0.4)',
                            color: 'var(--sov-accent)',
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          }}
                        >
                          FLY TO PIN ↗
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--sov-text)' }}>
                  {ingestReport.stats?.relevantCount > 0
                    ? 'Relevant policy articles were added to the RSS Wire (no specific sovereign/city location was cited in headlines to place a map pin).'
                    : '0 articles in the current XML window matched strict AI, Cyber, or Tech Policy criteria. Non-policy stories were filtered out automatically.'}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: CURATED ONE-CLICK DIRECTORY */}
          {activeTab === 'directory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--sov-muted)', lineHeight: 1.5 }}>
                Add verified international cybersecurity, AI governance, national security law, and Global South digital rights feeds in one click. Every article is automatically filtered for strict tech-policy relevance and geocoded onto the globe.
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '10px'
              }}>
                {curatedCatalog.map(item => {
                  const isAdded = activeUrls.has((item.url || '').toLowerCase());
                  const isBusy = ingestingId === item.sid;
                  return (
                    <div
                      key={item.sid}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: isAdded ? 'rgba(0, 240, 255, 0.04)' : 'rgba(15, 23, 42, 0.55)',
                        border: isAdded ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--sov-text)' }}>{item.name}</span>
                          <span style={{
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: 'var(--sov-sky)',
                            border: '1px solid var(--sov-border)'
                          }}>
                            {item.region}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--sov-muted)', lineHeight: 1.45 }}>
                          {item.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '9.5px', fontFamily: 'monospace', color: 'var(--sov-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.url.replace(/^https?:\/\/(www\.)?/, '')}
                        </span>
                        <button
                          disabled={Boolean(ingestingId)}
                          onClick={() => handleIngestSource(
                            { sid: item.sid, name: item.name, url: item.url, categoryHint: item.categoryHint },
                            item.sid
                          )}
                          style={{
                            flexShrink: 0,
                            padding: '5px 10px',
                            borderRadius: '5px',
                            background: isAdded ? 'rgba(16, 185, 129, 0.14)' : 'rgba(0, 240, 255, 0.14)',
                            border: isAdded ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(0, 240, 255, 0.4)',
                            color: isAdded ? '#34d399' : '#00f0ff',
                            fontSize: '10px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            cursor: ingestingId ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          {isBusy ? (
                            <>
                              <RefreshCw size={11} className="spinning" /> SYNCING...
                            </>
                          ) : isAdded ? (
                            <>
                              <RefreshCw size={11} /> RE-SYNC PINS
                            </>
                          ) : (
                            <>
                              <Plus size={11} /> ADD & AUTO-PIN
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM RSS / ATOM FEED FORM */}
          {activeTab === 'custom' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleIngestSource(
                  {
                    url: feedUrl,
                    name: feedName,
                    categoryHint,
                    keywords
                  },
                  'custom'
                );
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid var(--sov-border)',
                fontSize: '11px',
                color: 'var(--sov-text)',
                lineHeight: 1.5
              }}>
                <strong style={{ color: 'var(--sov-sky)' }}>Automated Governance & Geo-Precision Pipeline:</strong> Paste any valid RSS 2.0 or Atom XML feed URL (think tanks, CERT advisories, ministries, research labs, or tech policy journals). Sovereign automatically filters out off-topic stories and places pins exclusively at verified sovereign/city locations.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--sov-muted)', marginBottom: '6px' }}>
                  RSS / ATOM XML FEED URL *
                </label>
                <input
                  type="url"
                  required
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://www.techpolicy.press/rss/ or https://www.cisa.gov/cybersecurity-advisories/all.xml"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'var(--sov-card-bg)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: 'var(--sov-text)',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--sov-muted)', marginBottom: '6px' }}>
                    DISPLAY NAME (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={feedName}
                    onChange={(e) => setFeedName(e.target.value)}
                    placeholder="e.g. Chatham House Cyber Policy"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      background: 'var(--sov-card-bg)',
                      border: '1px solid var(--sov-border)',
                      color: 'var(--sov-text)',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--sov-muted)', marginBottom: '6px' }}>
                    DEFAULT POLICY CATEGORY
                  </label>
                  <select
                    value={categoryHint}
                    onChange={(e) => setCategoryHint(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      background: '#0f172a',
                      border: '1px solid var(--sov-border)',
                      color: 'var(--sov-text)',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    <option value="Political">AI Governance & Policy (Political)</option>
                    <option value="Surveillance">Cybersecurity & Surveillance</option>
                    <option value="Conflict">Autonomous Systems & Defense (LAWS)</option>
                    <option value="Economic">Compute, Chips & Digital Economy</option>
                    <option value="Humanitarian">Digital Rights & Humanitarian</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--sov-muted)', marginBottom: '6px' }}>
                  ADDITIONAL DOMAIN KEYWORDS (OPTIONAL, COMMA-SEPARATED)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. frontier safety, subsea cable, quantum cryptography, export controls"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    background: 'var(--sov-card-bg)',
                    border: '1px solid var(--sov-border)',
                    color: 'var(--sov-text)',
                    fontFamily: 'monospace',
                    fontSize: '11.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={Boolean(ingestingId) || !feedUrl.trim()}
                style={{
                  marginTop: '4px',
                  padding: '11px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
                  border: 'none',
                  color: '#020617',
                  fontWeight: 800,
                  fontSize: '12px',
                  fontFamily: 'var(--font-jetbrains-fallback, monospace)',
                  letterSpacing: '0.05em',
                  cursor: ingestingId ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.25)'
                }}
              >
                {ingestingId === 'custom' ? (
                  <>
                    <RefreshCw size={14} className="spinning" /> FETCHING, CLASSIFYING & GEOCODING FEED...
                  </>
                ) : (
                  <>
                    <MapPin size={14} /> INGEST FEED & AUTO-PIN RELEVANT EVENTS TO GLOBE
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: ACTIVE REGISTRY */}
          {activeTab === 'registry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingRegistry ? (
                <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--sov-sky)', fontSize: '12px' }}>
                  Loading intelligence source registry...
                </div>
              ) : (
                <>
                  {customSources.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--sov-accent)', marginBottom: '8px', letterSpacing: '0.06em' }}>
                        OPERATOR-ADDED SOURCES ({customSources.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {customSources.map(src => {
                          const sid = src.sid || src.id;
                          const checked = selectedRssSources.includes(sid);
                          return (
                            <div
                              key={sid}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '9px 12px',
                                borderRadius: '7px',
                                background: 'var(--sov-card-bg)',
                                border: '1px solid rgba(0, 240, 255, 0.22)'
                              }}
                            >
                              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => onToggleRssSource && onToggleRssSource(sid)}
                                  style={{ accentColor: 'var(--sov-accent)', cursor: 'pointer' }}
                                />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sov-text)' }}>{src.name}</div>
                                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--sov-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {src.url} • {src.pinCount || 0} globe pins • {src.itemCount || 0} policy items
                                  </div>
                                </div>
                              </label>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => handleIngestSource({ sid, name: src.name, url: src.url, categoryHint: src.categoryHint }, sid)}
                                  disabled={Boolean(ingestingId)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                    color: 'var(--sov-sky)',
                                    fontSize: '9.5px',
                                    fontFamily: 'monospace',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {ingestingId === sid ? '...' : 'SYNC'}
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteSource(sid)}
                                    title="Remove custom source"
                                    style={{
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      background: 'rgba(239, 68, 68, 0.12)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      color: '#f87171',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--sov-muted)', marginBottom: '8px', letterSpacing: '0.06em' }}>
                      CORE INTERNATIONAL AI, CYBER & POLICY FEEDS ({builtInSources.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '6px' }}>
                      {builtInSources.map(src => {
                        const sid = src.id || src.sid;
                        const checked = selectedRssSources.includes(sid);
                        return (
                          <label
                            key={sid}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: checked ? 'rgba(56, 189, 248, 0.06)' : 'rgba(15, 23, 42, 0.4)',
                              border: checked ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleRssSource && onToggleRssSource(sid)}
                                style={{ accentColor: 'var(--sov-accent)', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '11.5px', fontWeight: 600, color: checked ? '#f1f5f9' : '#64748b' }}>
                                {src.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'var(--sov-sky)' }}>
                              {src.region || 'Global'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
