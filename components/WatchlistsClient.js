'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Plus, Trash2, Play, CheckCircle2, AlertTriangle, Mail, Webhook } from 'lucide-react';
import EditorialThemeToggle from './EditorialThemeToggle';

const KEYWORD_PRESETS = [
  { label: 'EU AI Act & GPAI', keywords: 'EU AI Act, GPAI, AI Office, Brussels' },
  { label: 'Frontier Safety (Anthropic / OpenAI / DeepMind)', keywords: 'Anthropic, OpenAI, DeepMind, RSP, frontier, AISI' },
  { label: 'Autonomous Weapons & LAWS', keywords: 'Autonomous Weapons, LAWS, CCW, killer robots, military AI' },
  { label: 'Export Controls & Chips', keywords: 'Export Controls, NVIDIA, TSMC, semiconductor, compute, H100' }
];

export default function WatchlistsClient({ jurisdictions = [] }) {
  const [ownerEmail, setOwnerEmail] = useState('');
  const [watchlists, setWatchlists] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [name, setName] = useState('');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState(['eu', 'us']);
  const [keywordsText, setKeywordsText] = useState('EU AI Act, GPAI, frontier');
  const [minSeverity, setMinSeverity] = useState(3);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('sovdash_watchlist_email') || '';
      if (savedEmail) {
        setOwnerEmail(savedEmail);
        fetchWatchlists(savedEmail);
      }
    } catch {}
  }, []);

  const fetchWatchlists = async (targetEmail) => {
    const clean = String(targetEmail || ownerEmail || '').trim().toLowerCase();
    if (!clean) return;
    setLoadingList(true);
    try {
      const res = await fetch(`/api/watchlists?email=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.success) {
        setWatchlists(data.watchlists || []);
        try {
          localStorage.setItem('sovdash_watchlist_email', clean);
        } catch {}
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to load watchlists.' });
    } finally {
      setLoadingList(false);
    }
  };

  const toggleJurisdiction = (slug) => {
    setSelectedJurisdictions((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : prev.length < 10 ? [...prev, slug] : prev
    );
  };

  const handleDryRun = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          jurisdictions: selectedJurisdictions,
          keywords: keywordsText,
          minSeverity
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Dry-run test failed.');
      }
      setTestResult(data);
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const cleanEmail = ownerEmail.trim().toLowerCase();
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: cleanEmail,
          name: name.trim(),
          jurisdictions: selectedJurisdictions,
          keywords: keywordsText,
          minSeverity,
          emailAlerts,
          webhookUrl: webhookUrl.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not save watchlist.');
      }
      try {
        localStorage.setItem('sovdash_watchlist_email', cleanEmail);
      } catch {}
      setStatusMsg({
        type: 'success',
        text: `Saved "${data.watchlist.name}". Matched ${data.initialMatchesCount || 0} recent signals across the 90-day archive.`
      });
      setName('');
      await fetchWatchlists(cleanEmail);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const cleanEmail = ownerEmail.trim().toLowerCase();
      const res = await fetch(`/api/watchlists?id=${encodeURIComponent(id)}&email=${encodeURIComponent(cleanEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setWatchlists((prev) => prev.filter((w) => w.id !== id));
      }
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Toolbar */}
      <div className="editorial-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: 1, minWidth: '260px' }}>
          <Mail size={15} style={{ color: 'var(--sov-accent)' }} />
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="Researcher / institutional email (e.g. analyst@cam.ac.uk)"
            style={{ flex: 1, minWidth: '220px', maxWidth: '340px', padding: '7px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.35)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px' }}
          />
          <button
            type="button"
            onClick={() => fetchWatchlists()}
            disabled={!ownerEmail.trim() || loadingList}
            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.45)', background: 'rgba(0, 240, 255, 0.14)', color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            {loadingList ? 'LOADING...' : 'LOAD WATCHLISTS'}
          </button>
        </div>
        <EditorialThemeToggle />
      </div>

      {statusMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '8px', background: statusMsg.type === 'error' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)', border: `1px solid ${statusMsg.type === 'error' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`, color: statusMsg.type === 'error' ? '#fda4af' : '#6ee7b7', fontSize: '13px' }}>
          {statusMsg.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px', alignItems: 'start' }}>
        {/* Create Watchlist Card */}
        <form onSubmit={handleSave} className="editorial-card" style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} style={{ color: 'var(--sov-accent)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--sov-text)' }}>Create Jurisdiction or Lab Watchlist</h2>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--sov-muted)' }}>
            <span>Rule Name *</span>
            <input
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. EU AI Office & UK AISI Frontier Rules"
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: 'var(--sov-backdrop)', color: 'var(--sov-text)', fontSize: '13px' }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--sov-muted)' }}>
              <span>Target Jurisdictions (optional; empty = all global)</span>
              <span style={{ color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px' }}>{selectedJurisdictions.length} selected</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '140px', overflowY: 'auto', padding: '4px 0' }}>
              {jurisdictions.map((j) => {
                const active = selectedJurisdictions.includes(j.slug);
                return (
                  <button
                    key={j.slug}
                    type="button"
                    onClick={() => toggleJurisdiction(j.slug)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${active ? '#00f0ff' : 'rgba(148,163,184,0.25)'}`,
                      background: active ? 'rgba(0, 240, 255, 0.16)' : 'rgba(15, 23, 42, 0.55)',
                      color: active ? '#00f0ff' : '#94a3b8',
                      fontSize: '11px',
                      fontFamily: 'var(--font-jetbrains-fallback)',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {j.iso} · {j.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--sov-muted)' }}>Keywords / Labs / Statutory Terms (comma-separated)</span>
            <input
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="e.g. EU AI Act, GPAI, frontier, compute"
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: 'var(--sov-backdrop)', color: 'var(--sov-text)', fontSize: '13px' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {KEYWORD_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setKeywordsText(preset.keywords)}
                  style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--sov-border)', background: 'rgba(56, 189, 248, 0.08)', color: 'var(--sov-sky)', fontSize: '10.5px', cursor: 'pointer' }}
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--sov-muted)' }}>
              <span>Minimum Severity (SEV-1 to SEV-5)</span>
              <select
                value={minSeverity}
                onChange={(e) => setMinSeverity(Number(e.target.value))}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: 'var(--sov-backdrop)', color: 'var(--sov-text)', fontSize: '13px' }}
              >
                <option value={1}>SEV-1+ (All Relevant)</option>
                <option value={2}>SEV-2+ (Notable Policy)</option>
                <option value={3}>SEV-3+ (High Significance)</option>
                <option value={4}>SEV-4+ (Critical Enforcement / Cyber)</option>
                <option value={5}>SEV-5 (Emergency Binding / Treatylevel)</option>
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--sov-text)', paddingTop: '22px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
              <span>Dispatch Email Digests</span>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--sov-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Webhook size={13} style={{ color: 'var(--sov-purple)' }} /> Slack, Discord, or Custom HTTPS Webhook URL (optional)
            </span>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: 'var(--sov-backdrop)', color: 'var(--sov-text)', fontSize: '12.5px' }}
            />
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={handleDryRun}
              disabled={testing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '6px', border: '1px solid rgba(250, 204, 21, 0.45)', background: 'rgba(250, 204, 21, 0.12)', color: 'var(--sov-amber)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              <Play size={13} />
              <span>{testing ? 'TESTING...' : 'DRY-RUN TEST RULE'}</span>
            </button>

            <button
              type="submit"
              disabled={saving || !ownerEmail.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.55)', background: 'rgba(0, 240, 255, 0.2)', color: 'var(--sov-text)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
            >
              <Bell size={13} />
              <span>{saving ? 'SAVING...' : 'SAVE & ACTIVATE WATCHLIST'}</span>
            </button>
          </div>
        </form>

        {/* Active Watchlists + Dry-Run Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {testResult && (
            <section className="editorial-card" style={{ background: 'var(--sov-panel-bg)', border: '1px solid rgba(250, 204, 21, 0.35)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sov-amber)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                  DRY-RUN PREVIEW: {testResult.matchedCount} SIGNAL MATCH{testResult.matchedCount === 1 ? '' : 'ES'} (90D ARCHIVE)
                </h3>
              </div>
              {testResult.matches?.length === 0 ? (
                <p style={{ fontSize: '12.5px', color: 'var(--sov-muted)' }}>No signals in the 90-day window matched these exact filters. Broaden keywords or lower minimum severity.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {testResult.matches.map((m) => (
                    <Link key={m.id} href={m.permalink} style={{ padding: '9px 11px', borderRadius: '6px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', textDecoration: 'none', color: 'var(--sov-text)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-accent)' }}>
                        SEV-{m.severity} · {m.location} · {m.source}
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{m.title}</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="editorial-card" style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--sov-text)' }}>Active Watchlists ({watchlists.length})</h2>
              <span style={{ fontSize: '10.5px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>CRON DISPATCH: DAILY 04:00 UTC</span>
            </div>

            {watchlists.length === 0 ? (
              <div style={{ padding: '22px', borderRadius: '8px', border: '1px dashed rgba(148,163,184,0.25)', color: 'var(--sov-muted)', fontSize: '13px', textAlign: 'center' }}>
                Enter your email above and click <strong>LOAD WATCHLISTS</strong> or create your first monitoring rule on the left.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {watchlists.map((wl) => (
                  <div key={wl.id} style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sov-text)' }}>{wl.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                        <span style={{ color: 'var(--sov-amber)' }}>SEV-{wl.minSeverity}+</span>
                        <span style={{ color: 'var(--sov-sky)' }}>
                          {wl.jurisdictions?.length ? wl.jurisdictions.map((j) => j.toUpperCase()).join(', ') : 'ALL JURISDICTIONS'}
                        </span>
                        <span style={{ color: 'var(--sov-emerald)' }}>TRIGGERS: {wl.triggerCount || 0}</span>
                      </div>
                      {wl.keywords?.length > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--sov-muted)' }}>Keywords: {wl.keywords.join(', ')}</div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>
                        {wl.emailAlerts ? 'Email ✓' : 'Email off'} {wl.webhookUrl ? ' · Webhook HTTPS ✓' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(wl.id)}
                      style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#fda4af', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                      title="Delete watchlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
