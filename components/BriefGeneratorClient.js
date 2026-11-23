'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Download, Copy, Check, Sparkles, Pin, ExternalLink } from 'lucide-react';
import EditorialThemeToggle from './EditorialThemeToggle';
import { sha256Hex, generateCitations } from '@/lib/provenance';

const STARTER_PROMPTS = [
  'Compare EU AI Act systemic risk obligations with California SB 53',
  'Summarize frontier compute concentration vs binding AI laws',
  'What recent autonomous weapons and cyber-AI signals are tracked?'
];

const PILLAR_OPTIONS = [
  'all',
  'AI Governance & Policy',
  'Autonomous Weapons & Military AI',
  'Cyber & Espionage',
  'Compute, Chips & Infrastructure',
  'Digital Rights & Surveillance'
];

export default function BriefGeneratorClient({
  jurisdictions = [],
  sagriList = [],
  signals = [],
  clusters = [],
  initialJurisdiction = 'all'
}) {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(initialJurisdiction || 'all');
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [timeframe, setTimeframe] = useState('90d');
  const [minSeverity, setMinSeverity] = useState(2);
  const [copied, setCopied] = useState(false);

  // Citation-locked Copilot state
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [copilotError, setCopilotError] = useState(null);
  const [copilotResult, setCopilotResult] = useState(null);
  const [pinnedAnalyses, setPinnedAnalyses] = useState([]);

  const activeJurisdiction = useMemo(
    () => jurisdictions.find((j) => j.slug === selectedJurisdiction) || null,
    [jurisdictions, selectedJurisdiction]
  );

  const filteredSignals = useMemo(() => {
    const now = Date.now();
    const daysMs =
      timeframe === '7d' ? 7 * 86400000 : timeframe === '21d' ? 21 * 86400000 : timeframe === '90d' ? 90 * 86400000 : null;

    return (signals || []).filter((sig) => {
      if ((Number(sig.severity) || 1) < minSeverity) return false;

      if (daysMs) {
        const ts = new Date(sig.timestamp || sig.original_post_time || 0).getTime();
        if (!ts || now - ts > daysMs) return false;
      }

      if (selectedPillar !== 'all') {
        const p = String(sig.pillar || sig.category || '').toLowerCase();
        if (!p.includes(selectedPillar.toLowerCase().split('&')[0].trim())) return false;
      }

      if (activeJurisdiction) {
        const hay = `${sig.location || ''} ${sig.title || ''} ${sig.summary || ''}`.toLowerCase();
        const pats = activeJurisdiction.matchPatterns || [activeJurisdiction.name.toLowerCase()];
        const hit = pats.some((pat) => hay.includes(String(pat).toLowerCase()));
        if (!hit) return false;
      }

      return true;
    });
  }, [signals, timeframe, minSeverity, selectedPillar, activeJurisdiction]);

  const filteredClusters = useMemo(() => {
    if (!activeJurisdiction) return clusters;
    return (clusters || []).filter(
      (c) =>
        c.jurisdictionSlug === activeJurisdiction.slug ||
        `${c.country || ''} ${c.address || ''}`.toLowerCase().includes(activeJurisdiction.name.toLowerCase())
    );
  }, [clusters, activeJurisdiction]);

  const relevantSagri = useMemo(() => {
    if (activeJurisdiction) {
      return sagriList.filter((s) => s.slug === activeJurisdiction.slug);
    }
    return sagriList.slice(0, 6);
  }, [sagriList, activeJurisdiction]);

  const metrics = useMemo(() => {
    const total = filteredSignals.length;
    const highSev = filteredSignals.filter((s) => (Number(s.severity) || 1) >= 4).length;
    const highRel = filteredSignals.filter((s) => String(s.admiraltyGrade || '').startsWith('A')).length;
    const parityPct = total > 0 ? Math.round((highRel / total) * 100) : 0;
    const totalMw = Math.round(filteredClusters.reduce((acc, c) => acc + (Number(c.powerMw) || 0), 0));
    const avgSagri = relevantSagri.length
      ? Math.round(relevantSagri.reduce((acc, s) => acc + (Number(s.score ?? s.totalScore) || 0), 0) / relevantSagri.length)
      : 0;
    return { total, highSev, parityPct, totalMw, avgSagri };
  }, [filteredSignals, filteredClusters, relevantSagri]);

  const topSignals = useMemo(() => filteredSignals.slice(0, 20), [filteredSignals]);

  const oscolaRefs = useMemo(() => {
    return topSignals.slice(0, 12).map((s) => {
      const cit = generateCitations({
        id: s.id,
        title: s.title,
        source: s.source,
        location: s.location,
        timestamp: s.timestamp,
        url: s.url
      });
      return { id: s.id, oscola: cit.oscola };
    });
  }, [topSignals]);

  const briefDigest = useMemo(() => {
    const scopeStr = `${selectedJurisdiction}|${selectedPillar}|${timeframe}|${minSeverity}|${topSignals.map((s) => s.id).join(',')}`;
    return sha256Hex(scopeStr).slice(0, 16);
  }, [selectedJurisdiction, selectedPillar, timeframe, minSeverity, topSignals]);

  const buildMarkdownBrief = () => {
    const scopeLabel = activeJurisdiction ? activeJurisdiction.name : 'Global (24 Sovereign Jurisdictions)';
    const dateIso = new Date().toISOString().slice(0, 10);
    const lines = [
      `# Sovereign AI Safety & Policy Observatory — Executive Intelligence Brief`,
      ``,
      `- **Generated:** ${new Date().toISOString()}`,
      `- **Scope:** ${scopeLabel}`,
      `- **Pillar Filter:** ${selectedPillar === 'all' ? 'All 5 Policy Pillars' : selectedPillar}`,
      `- **Timeframe:** ${timeframe.toUpperCase()} | **Minimum Severity:** SEV-${minSeverity}`,
      `- **Cryptographic Digest (SHA-256 prefix):** \`${briefDigest}\``,
      ``,
      `## 1. Key Observatory Telemetry`,
      `- **Verified Signals:** ${metrics.total} (${metrics.highSev} at SEV-4+)`,
      `- **Admiralty A-Grade Reliability Share:** ${metrics.parityPct}%`,
      `- **Tracked Frontier Compute Power:** ${metrics.totalMw.toLocaleString()} MW (${filteredClusters.length} clusters)`,
      `- **Average SAGRI Readiness Score:** ${metrics.avgSagri}/100`,
      ``
    ];

    if (activeJurisdiction) {
      lines.push(
        `## 2. Statutory & Institutional Context — ${activeJurisdiction.name}`,
        `- **Governance Posture:** ${activeJurisdiction.posture}`,
        `- **Primary Regulator / Institute:** ${activeJurisdiction.regulator}`,
        `- **Treaty Status:** ${activeJurisdiction.treatyStatus}`,
        ``
      );
      if (activeJurisdiction.flagshipInstruments?.length) {
        lines.push(`### Flagship Instruments`);
        for (const inst of activeJurisdiction.flagshipInstruments) {
          lines.push(`- **${inst.name}** (${inst.status} · Effective ${inst.effectiveDate}): ${inst.summary}`);
        }
        lines.push('');
      }
    } else {
      lines.push(`## 2. Top Sovereign AI Governance Readiness (SAGRI) Leaders`);
      for (const s of relevantSagri) {
        lines.push(`- **${s.name}** (${s.iso}): **${s.score ?? s.totalScore ?? 0}/100** (${s.posture})`);
      }
      lines.push('');
    }

    if (pinnedAnalyses.length > 0) {
      lines.push(`## 3. Pinned Citation-Locked Research Analysis`);
      for (const item of pinnedAnalyses) {
        lines.push(`### Q: ${item.question}`, ``, item.answer, ``, `**Verified Sources:**`);
        for (const c of item.citations || []) {
          lines.push(`- [${c.index}] ${c.title} (Admiralty ${c.admiraltyGrade}) — ${c.permalink}`);
        }
        lines.push('');
      }
    }

    lines.push(`## ${pinnedAnalyses.length > 0 ? '4' : '3'}. Verified Signal Log (Top ${topSignals.length})`);
    for (const sig of topSignals) {
      const dateOnly = sig.timestamp ? String(sig.timestamp).slice(0, 10) : dateIso;
      lines.push(
        `- **[${sig.admiraltyGrade} · SEV-${sig.severity}] ${sig.title}** (${sig.location} · ${dateOnly})  `,
        `  MIT Risk: \`${sig.mitCode}\` · SHA-256: \`${String(sig.sha256 || '').slice(0, 12)}\` · [Signal Dossier](https://app.sovdash.com/signal/${encodeURIComponent(sig.id)})`
      );
    }
    lines.push('');

    lines.push(`## ${pinnedAnalyses.length > 0 ? '5' : '4'}. OSCOLA Academic References`);
    oscolaRefs.forEach((r, idx) => {
      lines.push(`${idx + 1}. ${r.oscola}`);
    });
    lines.push('');
    return lines.join('\n');
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdownBrief());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownloadMarkdown = () => {
    const md = buildMarkdownBrief();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `sovereign-ai-brief-${selectedJurisdiction}-${dateStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runCopilot = async (customPrompt = null) => {
    const q = String(customPrompt ?? question).trim();
    if (q.length < 4) return;
    if (customPrompt) setQuestion(customPrompt);
    setAsking(true);
    setCopilotError(null);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          jurisdiction: selectedJurisdiction,
          pillar: selectedPillar
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Copilot query failed.');
      }
      setCopilotResult(data);
    } catch (e) {
      setCopilotError(e.message);
    } finally {
      setAsking(false);
    }
  };

  const pinCurrentResult = () => {
    if (!copilotResult) return;
    setPinnedAnalyses((prev) => {
      if (prev.some((p) => p.question === copilotResult.question)) return prev;
      return [...prev, copilotResult];
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Interactive Filter & Export Control Bar */}
      <div className="no-print editorial-card" style={{ background: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(56, 189, 248, 0.28)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px', color: '#94a3b8' }}>
            <span>Jurisdiction Scope</span>
            <select
              value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value)}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(2, 6, 23, 0.85)', color: '#f8fafc', fontSize: '12.5px' }}
            >
              <option value="all">Global (All 24 Jurisdictions)</option>
              {jurisdictions.map((j) => (
                <option key={j.slug} value={j.slug}>{j.iso} — {j.name}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px', color: '#94a3b8' }}>
            <span>Policy Pillar</span>
            <select
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value)}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(2, 6, 23, 0.85)', color: '#f8fafc', fontSize: '12.5px' }}
            >
              {PILLAR_OPTIONS.map((p) => (
                <option key={p} value={p}>{p === 'all' ? 'All 5 Observatory Pillars' : p}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px', color: '#94a3b8' }}>
            <span>Time Window</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(2, 6, 23, 0.85)', color: '#f8fafc', fontSize: '12.5px' }}
            >
              <option value="7d">Last 7 Days</option>
              <option value="21d">Last 21 Days (Live Globe)</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">Complete Historical Archive</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px', color: '#94a3b8' }}>
            <span>Minimum Severity</span>
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(Number(e.target.value))}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(2, 6, 23, 0.85)', color: '#f8fafc', fontSize: '12.5px' }}
            >
              <option value={1}>SEV-1+ (All Verified)</option>
              <option value={2}>SEV-2+ (Standard Brief)</option>
              <option value={3}>SEV-3+ (Executive Escalation)</option>
              <option value={4}>SEV-4+ (Critical Enforcement Only)</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
          <EditorialThemeToggle />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'COPIED MARKDOWN' : 'COPY MARKDOWN'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.16)', color: '#34d399', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              <Download size={13} />
              <span>DOWNLOAD BRIEF (.MD)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Citation-Locked Observatory Copilot Panel */}
      <section className="no-print editorial-card" style={{ background: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: '#c084fc' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
              Citation-Locked Observatory Copilot
            </h2>
          </div>
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#c084fc' }}>
            ZERO HALLUCINATION MODE · EVERY CLAIM BOUND TO VERIFIED RECORD [1..8]
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runCopilot();
          }}
          style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask across Sovereign statutory dossiers, Epoch AI compute clusters, frontier labs, and verified signals..."
            style={{ flex: 1, minWidth: '250px', padding: '9px 12px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.4)', background: 'rgba(2, 6, 23, 0.85)', color: '#f8fafc', fontSize: '13px' }}
          />
          <button
            type="submit"
            disabled={asking || question.trim().length < 4}
            style={{ padding: '9px 16px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.6)', background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            {asking ? 'SYNTHESIZING...' : 'QUERY ARCHIVE'}
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {STARTER_PROMPTS.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => runCopilot(sp)}
              style={{ padding: '4px 9px', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15, 23, 42, 0.6)', color: '#cbd5e1', fontSize: '11px', cursor: 'pointer' }}
            >
              {sp}
            </button>
          ))}
        </div>

        {copilotError && (
          <div style={{ fontSize: '12.5px', color: '#fda4af' }}>{copilotError}</div>
        )}

        {copilotResult && (
          <div style={{ background: 'rgba(2, 6, 23, 0.72)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#34d399', fontWeight: 700 }}>
                GROUNDED VIA: {copilotResult.groundedBy.toUpperCase()} · {copilotResult.citations?.length || 0} VERIFIED SOURCES
              </span>
              <button
                type="button"
                onClick={pinCurrentResult}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '5px', border: '1px solid rgba(0, 240, 255, 0.45)', background: 'rgba(0, 240, 255, 0.14)', color: '#00f0ff', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Pin size={12} />
                <span>PIN TO PRINTABLE BRIEF</span>
              </button>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px', lineHeight: 1.6, color: '#e2e8f0' }}>
              {copilotResult.answer}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
              {(copilotResult.citations || []).map((c) => (
                <a
                  key={`${c.index}-${c.id}`}
                  href={c.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '11px', textDecoration: 'none' }}
                >
                  <span>[{c.index}] {c.title.slice(0, 46)}{c.title.length > 46 ? '…' : ''} ({c.admiraltyGrade})</span>
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Printable Executive Intelligence Brief Canvas */}
      <article className="editorial-card" style={{ background: 'rgba(11, 17, 32, 0.95)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <header style={{ borderBottom: '2px solid rgba(0, 240, 255, 0.3)', paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', color: '#00f0ff', fontWeight: 700 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} /> SOVEREIGN GLOBAL AI SAFETY &amp; POLICY OBSERVATORY
            </span>
            <span>DIGEST SHA-256: {briefDigest}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 800, color: '#ffffff' }}>
            Executive Intelligence Brief: {activeJurisdiction ? activeJurisdiction.name : 'Global Overview'}
          </h2>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-jetbrains-fallback)' }}>
            WINDOW: {timeframe.toUpperCase()} · PILLAR: {selectedPillar === 'all' ? 'ALL' : selectedPillar.toUpperCase()} · THRESHOLD: SEV-{minSeverity}+ · METHODOLOGY: NATO ADMIRALTY + MIT AI RISK TAXONOMY
          </div>
        </header>

        {/* Telemetry Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          {[
            { label: 'VERIFIED SIGNALS', value: metrics.total, color: '#00f0ff' },
            { label: 'HIGH-SEVERITY (SEV-4+)', value: metrics.highSev, color: '#f43f5e' },
            { label: 'ADMIRALTY A1/A2 SHARE', value: `${metrics.parityPct}%`, color: '#34d399' },
            { label: 'FRONTIER COMPUTE POWER', value: `${metrics.totalMw.toLocaleString()} MW`, color: '#facc15' },
            { label: 'AVG SAGRI READINESS', value: `${metrics.avgSagri}/100`, color: '#c084fc' }
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#94a3b8', fontWeight: 700 }}>{kpi.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, marginTop: '4px' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Statutory & Readiness Context */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
            {activeJurisdiction ? `Statutory & Institutional Context — ${activeJurisdiction.name}` : 'Top Sovereign AI Governance Readiness (SAGRI) Leaders'}
          </h3>
          {activeJurisdiction ? (
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: '#e2e8f0' }}>
                <strong>Posture:</strong> {activeJurisdiction.posture} · <strong>Primary Regulator:</strong> {activeJurisdiction.regulator}
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                <strong>Multilateral / Treaty Commitments:</strong> {activeJurisdiction.treatyStatus}
              </div>
              {activeJurisdiction.flagshipInstruments?.length > 0 && (
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px', color: '#cbd5e1' }}>
                  {activeJurisdiction.flagshipInstruments.map((inst) => (
                    <li key={inst.name}>
                      <strong>{inst.name}</strong> ({inst.status}, {inst.effectiveDate}): {inst.summary}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {relevantSagri.map((s) => (
                <Link key={s.slug} href={`/jurisdiction/${s.slug}`} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.68)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{s.posture}</div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-jetbrains-fallback)' }}>{s.score ?? s.totalScore ?? 0}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Pinned Citation-Locked Analyses */}
        {pinnedAnalyses.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Citation-Locked Analytical Syntheses</h3>
            {pinnedAnalyses.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#e9d5ff' }}>Inquiry: {item.question}</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.55, color: '#e2e8f0' }}>{item.answer}</div>
              </div>
            ))}
          </section>
        )}

        {/* Verified Signal Log */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
            Verified Signal Log (Showing {topSignals.length} of {filteredSignals.length})
          </h3>
          {topSignals.length === 0 ? (
            <div style={{ padding: '18px', borderRadius: '8px', border: '1px dashed rgba(148,163,184,0.25)', color: '#94a3b8', fontSize: '13px' }}>
              No signals match the active brief filters. Try expanding the time window to 90D/ALL or lowering minimum severity.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topSignals.map((sig) => (
                <div key={sig.id} style={{ padding: '11px 14px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                    <span style={{ color: '#00f0ff', fontWeight: 700 }}>
                      ADMIRALTY {sig.admiraltyGrade} · SEV-{sig.severity} · {sig.mitCode}
                    </span>
                    <span style={{ color: '#94a3b8' }}>
                      {sig.location} · {sig.timestamp ? String(sig.timestamp).slice(0, 10) : ''} · SHA256:{String(sig.sha256 || '').slice(0, 10)}
                    </span>
                  </div>
                  <Link href={`/signal/${encodeURIComponent(sig.id)}`} style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', textDecoration: 'none' }}>
                    {sig.title}
                  </Link>
                  {sig.summary && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.45 }}>
                      {sig.summary.slice(0, 200)}{sig.summary.length > 200 ? '…' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* OSCOLA References */}
        {oscolaRefs.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>OSCOLA Academic Citations</h3>
            <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              {oscolaRefs.map((ref) => (
                <li key={ref.id}>{ref.oscola}</li>
              ))}
            </ol>
          </section>
        )}
      </article>
    </div>
  );
}
