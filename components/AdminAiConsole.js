'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Save,
  Download,
  Play,
  Loader2,
  Database,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const SUBTABS = [
  { id: 'overview', label: 'Analytics & Corpus' },
  { id: 'config', label: 'Model & Engine' },
  { id: 'logs', label: 'Prompt & Audit Logs' },
  { id: 'evals', label: 'Hallucination Evals' }
];

export default function AdminAiConsole({ currentUser, onToast }) {
  const [subTab, setSubTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [indexStats, setIndexStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [presets, setPresets] = useState([]);
  const [keyStatus, setKeyStatus] = useState({});
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logSearch, setLogSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [evalRuns, setEvalRuns] = useState([]);
  const [busyAction, setBusyAction] = useState('');

  const headers = {
    'x-user-id': currentUser?.id || '',
    'Content-Type': 'application/json'
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(logPage),
        limit: '20',
        search: logSearch,
        grade: gradeFilter
      });
      const res = await fetch(`/api/admin/ai?${qs.toString()}`, {
        headers: { 'x-user-id': currentUser?.id || '' },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAnalytics(json.analytics || {});
      setIndexStats(json.indexStats || {});
      setConfig(json.config || {});
      setPresets(json.presets || []);
      setKeyStatus(json.keyStatus || {});
      setLogs(json.logs || []);
      setTotalLogs(json.totalLogs || 0);
      setEvalRuns(json.evalRuns || []);
    } catch (err) {
      onToast?.(`Failed to load SovDash AI console: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, logPage, logSearch, gradeFilter, onToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveConfig = async () => {
    setBusyAction('save_config');
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'update_config', config })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setConfig(json.config);
      onToast?.('SovDash AI live model configuration updated');
    } catch (err) {
      onToast?.(`Config save failed: ${err.message}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const handleReindex = async () => {
    setBusyAction('reindex');
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'reindex' })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      onToast?.(`Synced ${json.result?.totalChunks || 0} chunks into pgvector`);
      fetchAll();
    } catch (err) {
      onToast?.(`Reindex failed: ${err.message}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const handleRunEval = async () => {
    setBusyAction('run_eval');
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'run_eval' })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      onToast?.(`Eval finished: ${json.evalSummary?.passRate}% pass rate · ${json.evalSummary?.phantomCitationCount} phantom citations`);
      fetchAll();
    } catch (err) {
      onToast?.(`Benchmark run failed: ${err.message}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const handleSaveNote = async (messageId) => {
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'update_note', messageId, adminNotes: noteDrafts[messageId] || '' })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onToast?.('Audit review note saved');
      fetchAll();
    } catch (err) {
      onToast?.(`Note save failed: ${err.message}`, 'error');
    }
  };

  const handleExportLogs = (fmt) => {
    if (!logs.length) return;
    let blob;
    let filename;
    if (fmt === 'json') {
      blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      filename = `sovdash-ai-audit-logs-p${logPage}.json`;
    } else {
      const cols = ['id', 'created_at', 'user_email', 'provider_used', 'model_used', 'hallucination_grade', 'latency_ms', 'user_feedback', 'prompt', 'answer'];
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [cols.join(','), ...logs.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
      blob = new Blob([csv], { type: 'text/csv' });
      filename = `sovdash-ai-audit-logs-p${logPage}.csv`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !analytics) {
    return (
      <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--sov-muted)' }}>
        <Loader2 size={16} className="animate-spin" /> Loading SovDash AI Console...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Sub-navigation bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SUBTABS.map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                style={{
                  padding: '6px 11px',
                  borderRadius: '6px',
                  border: active ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                  background: active ? 'var(--sov-accent-soft)' : 'var(--sov-card-bg)',
                  color: active ? 'var(--sov-accent)' : 'var(--sov-text)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={busyAction === 'reindex'}
          onClick={handleReindex}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--sov-accent)',
            background: 'var(--sov-accent-soft)',
            color: 'var(--sov-accent)',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Database size={13} />
          <span>{busyAction === 'reindex' ? 'Indexing pgvector...' : `Sync pgvector (${indexStats?.total || 0})`}</span>
        </button>
      </div>

      {/* 1. OVERVIEW & CORPUS */}
      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Total AI Turns', val: analytics?.totalTurns ?? 0, color: 'var(--sov-accent)' },
              { label: 'Unique Users', val: analytics?.uniqueUsers ?? 0, color: '#38bdf8' },
              { label: 'Avg Latency', val: `${analytics?.avgLatencyMs ?? 0} ms`, color: '#a855f7' },
              { label: 'Citation Coverage', val: `${analytics?.avgCitationCoverage ?? 100}%`, color: '#10b981' },
              { label: 'Grounding Pass Rate', val: `${analytics?.passRate ?? 100}%`, color: '#10b981' },
              { label: 'Thumbs Up / Down', val: `${analytics?.thumbsUp ?? 0} / ${analytics?.thumbsDown ?? 0}`, color: '#f59e0b' }
            ].map((k) => (
              <div key={k.label} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
                <div style={{ fontSize: '10px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: k.color, marginTop: '4px' }}>{k.val}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>NEON PGVECTOR INDEXED CORPUS ({indexStats?.total || 0} CHUNKS)</span>
              <span style={{ color: indexStats?.hasPgVector ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                {indexStats?.hasPgVector ? 'pgvector vector(256) ACTIVE' : 'JS Cosine Fallback'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(indexStats?.byType || {}).map(([type, cnt]) => (
                <div key={type} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', fontSize: '11.5px' }}>
                  <strong style={{ color: 'var(--sov-accent)' }}>{type}</strong>: {cnt}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. MODEL & ENGINE CONFIG */}
      {subTab === 'config' && config && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', borderRadius: '8px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sov-accent)' }}>
            ACTIVE OPEN-SOURCE ENGINE &amp; PROVIDER SWITCHER
          </div>

          {/* Preset Picker */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px' }}>
            <span style={{ fontWeight: 700 }}>Quick Select Model Preset ($0 Free Open-Source Recommended)</span>
            <select
              value={`${config.provider}:${config.modelId}`}
              onChange={(e) => {
                const chosen = presets.find((p) => `${p.provider}:${p.modelId}` === e.target.value);
                if (chosen) {
                  setConfig((prev) => ({ ...prev, provider: chosen.provider, modelId: chosen.modelId }));
                }
              }}
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
            >
              {presets.map((p) => (
                <option key={p.id} value={`${p.provider}:${p.modelId}`}>
                  {p.label} [{p.cost}]
                </option>
              ))}
            </select>
          </label>

          {/* Key Availability Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(keyStatus).map(([k, ok]) => (
              <span
                key={k}
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  border: `1px solid ${ok ? '#10b981' : 'var(--sov-border)'}`,
                  color: ok ? '#10b981' : 'var(--sov-muted)'
                }}
              >
                {k.toUpperCase()}: {ok ? 'KEY READY' : 'NOT SET'}
              </span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 700 }}>Provider</span>
              <input
                type="text"
                value={config.provider || ''}
                onChange={(e) => setConfig((p) => ({ ...p, provider: e.target.value }))}
                style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 700 }}>Model ID</span>
              <input
                type="text"
                value={config.modelId || ''}
                onChange={(e) => setConfig((p) => ({ ...p, modelId: e.target.value }))}
                style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 700 }}>Top-K Chunks (4–24)</span>
              <input
                type="number"
                min={4}
                max={24}
                value={config.topK ?? 12}
                onChange={(e) => setConfig((p) => ({ ...p, topK: Number(e.target.value) }))}
                style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 700 }}>Temperature (0.0–1.0)</span>
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={config.temperature ?? 0.15}
                onChange={(e) => setConfig((p) => ({ ...p, temperature: Number(e.target.value) }))}
                style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.strictCitationLock !== false}
                onChange={(e) => setConfig((p) => ({ ...p, strictCitationLock: e.target.checked }))}
              />
              <span>Enforce Strict Citation-Lock</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.allowWebAugmentation !== false}
                onChange={(e) => setConfig((p) => ({ ...p, allowWebAugmentation: e.target.checked }))}
              />
              <span>Enable OpenAlex + Wikipedia Gap Augmentation</span>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
            <span style={{ fontWeight: 700 }}>Custom OpenAI-Compatible Base URL (optional Ollama / vLLM / HuggingFace)</span>
            <input
              type="text"
              placeholder="https://..."
              value={config.customBaseUrl || ''}
              onChange={(e) => setConfig((p) => ({ ...p, customBaseUrl: e.target.value }))}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
            <span style={{ fontWeight: 700 }}>Admin System Prompt Addendum (optional)</span>
            <textarea
              rows={2}
              value={config.systemPromptAddon || ''}
              onChange={(e) => setConfig((p) => ({ ...p, systemPromptAddon: e.target.value }))}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)' }}
            />
          </label>

          <button
            type="button"
            disabled={busyAction === 'save_config'}
            onClick={handleSaveConfig}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '7px',
              border: 'none',
              background: 'var(--sov-accent)',
              color: '#020617',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Save size={13} />
            <span>{busyAction === 'save_config' ? 'Saving...' : 'Save Live Model Configuration'}</span>
          </button>
        </div>
      )}

      {/* 3. PROMPT & AUDIT LOGS */}
      {subTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={logSearch}
                onChange={(e) => { setLogPage(1); setLogSearch(e.target.value); }}
                placeholder="Search user email, prompt, model..."
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px', minWidth: '210px' }}
              />
              {['all', 'PASS', 'REVIEW', 'FLAGGED'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setLogPage(1); setGradeFilter(g); }}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '6px',
                    border: gradeFilter === g ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                    background: gradeFilter === g ? 'var(--sov-accent-soft)' : 'transparent',
                    color: gradeFilter === g ? 'var(--sov-accent)' : 'var(--sov-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => handleExportLogs('csv')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '11px', cursor: 'pointer' }}>
                <Download size={12} /> CSV
              </button>
              <button type="button" onClick={() => handleExportLogs('json')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '11px', cursor: 'pointer' }}>
                <Download size={12} /> JSON
              </button>
            </div>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--sov-muted)', border: '1px dashed var(--sov-border)', borderRadius: '8px' }}>
              No logged AI turns match the current filter ({totalLogs} total).
            </div>
          ) : (
            logs.map((row) => {
              const isOpen = expandedLogId === row.id;
              const gradeColor = row.hallucination_grade === 'PASS' ? '#10b981' : row.hallucination_grade === 'REVIEW' ? '#f59e0b' : '#ef4444';
              return (
                <div key={row.id} style={{ border: '1px solid var(--sov-border)', borderRadius: '8px', background: 'var(--sov-card-bg)', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setExpandedLogId(isOpen ? null : row.id)}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.prompt}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '2px' }}>
                        {row.user_email} · {row.model_used} · {row.latency_ms}ms · {new Date(row.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {row.user_feedback && <span style={{ fontSize: '11px' }}>{row.user_feedback === 'up' ? '👍' : '👎'}</span>}
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', border: `1px solid ${gradeColor}`, color: gradeColor }}>
                        {row.hallucination_grade}
                      </span>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--sov-border)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <strong style={{ color: 'var(--sov-accent)' }}>Response:</strong>
                        <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', lineHeight: 1.5 }}>{row.answer}</div>
                      </div>
                      {row.reasoning && (
                        <div>
                          <strong style={{ color: 'var(--sov-muted)' }}>Reasoning Trace:</strong>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '11px', color: 'var(--sov-muted)', marginTop: '3px' }}>{row.reasoning}</div>
                        </div>
                      )}
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)' }}>
                        Metrics: {JSON.stringify(row.grounding_metrics || {})}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Add admin quality review note..."
                          value={noteDrafts[row.id] ?? row.admin_notes ?? ''}
                          onChange={(e) => setNoteDrafts((p) => ({ ...p, [row.id]: e.target.value }))}
                          style={{ flex: 1, padding: '6px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)', fontSize: '11.5px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNote(row.id)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'var(--sov-accent)', color: '#020617', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. HALLUCINATION EVALS */}
      {subTab === 'evals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>16-Case Groundedness &amp; Adversarial Trap Benchmark</div>
              <div style={{ fontSize: '11.5px', color: 'var(--sov-muted)' }}>Tests statutory cross-comparisons, ethics layers, lab frameworks, and 4 unanswerable hallucination traps.</div>
            </div>
            <button
              type="button"
              disabled={busyAction === 'run_eval'}
              onClick={handleRunEval}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '7px',
                border: 'none',
                background: 'var(--sov-accent)',
                color: '#020617',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {busyAction === 'run_eval' ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              <span>{busyAction === 'run_eval' ? 'Running 16 Evals...' : 'Run Automated Benchmark'}</span>
            </button>
          </div>

          {evalRuns.map((run) => (
            <div key={run.id} style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                <div>
                  <strong>{run.model_used}</strong> ({run.provider_used}) · <span style={{ color: 'var(--sov-muted)' }}>{new Date(run.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700 }}>
                  <span style={{ color: '#10b981' }}>PASS {run.pass_rate}%</span>
                  <span style={{ color: '#38bdf8' }}>CITED {run.citation_coverage_avg}%</span>
                  <span style={{ color: '#a855f7' }}>TRAP ABSTENTION {run.abstention_accuracy}%</span>
                  <span style={{ color: run.phantom_citation_count === 0 ? '#10b981' : '#ef4444' }}>PHANTOM {run.phantom_citation_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
