'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  Send,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  AlertTriangle,
  History,
  Plus,
  Lock,
  FileBarChart2,
  Loader2,
  Database,
  Globe
} from 'lucide-react';

const STARTER_PROMPTS = [
  'Compare mandatory incident-reporting windows across EU AI Act, California SB 53, and South Korea\'s AI Basic Act.',
  'Compare biometric and automated profiling enforcement in Brazil (ANPD) and Kenya (ODPC).',
  'What critical bottlenecks does SovDash track across the 7-stage AI semiconductor supply chain?',
  'How do Anthropic\'s Responsible Scaling Policy (RSP) and OpenAI\'s Preparedness Framework compare on external evaluations?'
];

function formatCitationUrl(c) {
  return c?.url || c?.permalink || 'https://app.sovdash.com/';
}

function renderFormattedText(text, citations = [], onHighlightCitation) {
  const lines = String(text || '').split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIdx} style={{ height: '7px' }} />;
    }

    const isH3 = trimmed.startsWith('### ');
    const isH2 = trimmed.startsWith('## ');
    const isBullet = /^[-*•]\s+/.test(trimmed);
    const contentLine = isH3
      ? trimmed.slice(4)
      : isH2
      ? trimmed.slice(3)
      : isBullet
      ? trimmed.replace(/^[-*•]\s+/, '')
      : trimmed;

    // Split inline **bold** and [1]/[W1] citation tokens
    const tokens = contentLine.split(/(\*\*[^*]+\*\*|\[W?\d+\])/gi);
    const renderedParts = tokens.map((tok, i) => {
      if (tok.startsWith('**') && tok.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--sov-text)', fontWeight: 700 }}>{tok.slice(2, -2)}</strong>;
      }
      const citMatch = tok.match(/^\[(W?\d+)\]$/i);
      if (citMatch) {
        const tag = citMatch[1].toUpperCase();
        const cit = citations.find((c) => String(c.tag).toUpperCase() === tag);
        if (!cit) return <span key={i}>{tok}</span>;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onHighlightCitation?.(tag)}
            title={`${cit.title} (${cit.sourceLabel})`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '2px',
              marginRight: '2px',
              padding: '0 5px',
              height: '17px',
              borderRadius: '4px',
              border: `1px solid ${cit.isExternalWeb ? 'rgba(245, 158, 11, 0.5)' : 'var(--sov-border)'}`,
              background: cit.isExternalWeb ? 'rgba(245, 158, 11, 0.14)' : 'var(--sov-accent-soft)',
              color: cit.isExternalWeb ? '#f59e0b' : 'var(--sov-accent)',
              fontSize: '10px',
              fontWeight: 800,
              fontFamily: 'var(--font-jetbrains-fallback)',
              cursor: 'pointer',
              verticalAlign: 'middle'
            }}
          >
            [{tag}]
          </button>
        );
      }
      return <React.Fragment key={i}>{tok}</React.Fragment>;
    });

    if (isH2 || isH3) {
      return (
        <div
          key={lineIdx}
          style={{
            fontSize: isH2 ? '13.5px' : '12.5px',
            fontWeight: 800,
            color: 'var(--sov-accent)',
            marginTop: '6px',
            marginBottom: '2px',
            letterSpacing: '0.01em'
          }}
        >
          {renderedParts}
        </div>
      );
    }

    if (isBullet) {
      return (
        <div key={lineIdx} style={{ display: 'flex', gap: '7px', paddingLeft: '4px', lineHeight: 1.55, fontSize: '12.5px' }}>
          <span style={{ color: 'var(--sov-accent)', fontWeight: 800, flexShrink: 0 }}>•</span>
          <span>{renderedParts}</span>
        </div>
      );
    }

    return (
      <div key={lineIdx} style={{ lineHeight: 1.6, fontSize: '12.5px' }}>
        {renderedParts}
      </div>
    );
  });
}

export default function SovDashAiDrawer({ isOpen, onClose, currentUser, onRequestAuth }) {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [engineMeta, setEngineMeta] = useState(null);
  const [indexStats, setIndexStats] = useState(null);
  const [expandedReasoning, setExpandedReasoning] = useState({});
  const [expandedSources, setExpandedSources] = useState({});
  const [highlightedCitKey, setHighlightedCitKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !currentUser?.email) return;
    let active = true;
    fetch('/api/sovdash-ai', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json?.success) return;
        setSessions(json.sessions || []);
        setEngineMeta(json.activeEngine || null);
        setIndexStats(json.indexStats || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, currentUser?.email]);

  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Number(((Date.now() - started) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const loadSession = async (sid) => {
    setShowSessions(false);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/sovdash-ai?sessionId=${encodeURIComponent(sid)}`, { cache: 'no-store' });
      const json = await res.json();
      if (json?.success) {
        setSessionId(sid);
        const hydrated = [];
        for (const row of json.messages || []) {
          hydrated.push({ id: `${row.id}-u`, role: 'user', content: row.prompt });
          hydrated.push({
            id: row.id,
            role: 'assistant',
            content: row.answer,
            reasoning: row.reasoning,
            citations: row.citations || [],
            groundingMetrics: row.grounding_metrics || {},
            hallucinationGrade: row.hallucination_grade || 'PASS',
            providerUsed: row.provider_used,
            modelUsed: row.model_used,
            latencyMs: row.latency_ms,
            feedback: row.user_feedback
          });
        }
        setMessages(hydrated);
      }
    } catch (err) {
      setErrorMsg(`Failed to load session: ${err.message}`);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setShowSessions(false);
    setErrorMsg('');
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const handleSend = async (overridePrompt = null) => {
    const promptText = String(overridePrompt ?? input).trim();
    if (!promptText || loading) return;

    setErrorMsg('');
    if (!overridePrompt) setInput('');

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: promptText };
    const nextHistory = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/sovdash-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, sessionId, history: nextHistory })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      if (json.sessionId) setSessionId(json.sessionId);
      const aiMsgId = json.messageId || `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          content: json.answer,
          reasoning: json.reasoning,
          citations: json.citations || [],
          groundingMetrics: json.groundingMetrics || {},
          hallucinationGrade: json.hallucinationGrade || 'PASS',
          providerUsed: json.providerUsed,
          modelUsed: json.modelUsed,
          latencyMs: json.latencyMs,
          feedback: null
        }
      ]);
      // Open sources accordion automatically when helpful
      setExpandedSources((prev) => ({ ...prev, [aiMsgId]: false }));

      // Refresh session list quietly
      fetch('/api/sovdash-ai', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => s?.sessions && setSessions(s.sessions))
        .catch(() => {});
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reach SovDash AI');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId, val) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: m.feedback === val ? null : val } : m))
    );
    try {
      await fetch('/api/sovdash-ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback: val })
      });
    } catch {}
  };

  const handleCopy = (id, text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  const handleHighlightCitation = (msgId, tag) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: true }));
    setHighlightedCitKey(`${msgId}:${tag}`);
    setTimeout(() => {
      const el = document.getElementById(`sov-cit-${msgId}-${tag}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 11020,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(2, 6, 23, 0.56)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-label="SovDash AI Citation-Locked Research Copilot"
        style={{
          width: 'min(560px, 100vw)',
          height: '100dvh',
          background: 'var(--sov-panel-bg)',
          color: 'var(--sov-text)',
          borderLeft: '1px solid var(--sov-border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--sov-shadow, -16px 0 50px rgba(0,0,0,0.45))',
          fontFamily: 'var(--font-inter-fallback), system-ui, sans-serif',
          overflow: 'hidden'
        }}
      >
        {/* Top Drawer Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--sov-border)',
            background: 'var(--sov-card-bg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'var(--sov-accent-soft)',
                border: '1px solid var(--sov-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sov-accent)',
                flexShrink: 0
              }}
            >
              <Sparkles size={15} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 800, letterSpacing: '0.03em' }}>Ask SovDash</span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-jetbrains-fallback)',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    fontWeight: 700
                  }}
                >
                  CITATION-LOCKED
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {indexStats?.total ? `${indexStats.total} pgvector records` : 'Neon pgvector RAG'} · {engineMeta?.modelId || 'Open-Source Cascade'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <Link
              href="/ai-report"
              title="Public Architecture & Hallucination Audit Report"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid var(--sov-border)',
                background: 'transparent',
                color: 'var(--sov-muted)',
                fontSize: '10.5px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <FileBarChart2 size={12} />
              <span>Audit</span>
            </Link>

            {currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => setShowSessions((s) => !s)}
                  title="Chat History"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--sov-border)',
                    background: showSessions ? 'var(--sov-accent-soft)' : 'transparent',
                    color: showSessions ? 'var(--sov-accent)' : 'var(--sov-text)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700
                  }}
                >
                  <History size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleNewChat}
                  title="New Research Thread"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--sov-border)',
                    background: 'transparent',
                    color: 'var(--sov-text)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700
                  }}
                >
                  <Plus size={13} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Ask SovDash"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid var(--sov-border)',
                background: 'transparent',
                color: 'var(--sov-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {/* Auth Gate for Unauthenticated Guests */}
        {!currentUser ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px', textAlign: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--sov-accent-soft)', border: '1px solid var(--sov-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sov-accent)' }}>
              <Lock size={22} />
            </div>
            <div style={{ maxWidth: '390px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Sign in to Ask SovDash</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--sov-muted)', lineHeight: 1.6 }}>
                Query Sovereign Observatory&apos;s entire Neon <code style={{ color: 'var(--sov-accent)' }}>pgvector</code> archive—38 jurisdictions, 472 statutes, Frontier Labs, Epoch compute, PeeringDB facilities, OONI censorship, and live OSINT wires—with strict sentence-level primary-source citations.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestAuth?.();
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--sov-accent)',
                  color: '#020617',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-jetbrains-fallback)'
                }}
              >
                Sign In / Create Free Account
              </button>
              <Link
                href="/ai-report"
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--sov-border)',
                  background: 'var(--sov-card-bg)',
                  color: 'var(--sov-text)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Read AI Hallucination Audit →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Collapsible Session History Strip */}
            {showSessions && (
              <div style={{ borderBottom: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', padding: '10px 14px', maxHeight: '190px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                  YOUR RESEARCH SESSIONS ({sessions.length})
                </div>
                {sessions.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--sov-muted)' }}>No saved conversations yet.</div>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => loadSession(s.id)}
                      style={{
                        textAlign: 'left',
                        padding: '7px 9px',
                        borderRadius: '6px',
                        border: `1px solid ${s.id === sessionId ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                        background: s.id === sessionId ? 'var(--sov-accent-soft)' : 'transparent',
                        color: 'var(--sov-text)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{s.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--sov-muted)', flexShrink: 0 }}>{s.message_count || 1} turns</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Main Scrollable Thread */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {messages.length === 0 && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                  <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--sov-accent)', marginBottom: '4px' }}>
                      Citation-Locked Observatory Research Copilot
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--sov-muted)', lineHeight: 1.55 }}>
                      Every factual claim is cross-checked against Sovereign Observatory&apos;s Neon pgvector corpus and tagged scholarly lookups, audited sentence-by-sentence for hallucination risk.
                    </p>
                  </div>

                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', letterSpacing: '0.06em' }}>
                    TRY A VERIFIED RESEARCH QUERY:
                  </div>
                  {STARTER_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-text)',
                        fontSize: '12px',
                        lineHeight: 1.45,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span>{q}</span>
                      <span style={{ color: 'var(--sov-accent)', fontWeight: 800 }}>→</span>
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) => {
                if (m.role === 'user') {
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          maxWidth: '88%',
                          padding: '9px 13px',
                          borderRadius: '12px 12px 2px 12px',
                          background: 'var(--sov-accent-soft)',
                          border: '1px solid var(--sov-accent)',
                          color: 'var(--sov-text)',
                          fontSize: '12.5px',
                          lineHeight: 1.5,
                          fontWeight: 600
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                }

                const gm = m.groundingMetrics || {};
                const grade = m.hallucinationGrade || 'PASS';
                const gradeColor = grade === 'PASS' ? '#10b981' : grade === 'REVIEW' ? '#f59e0b' : '#ef4444';
                const covPct = Math.round((gm.citationCoverage ?? 1) * 100);
                const isReasonOpen = Boolean(expandedReasoning[m.id]);
                const isSourcesOpen = Boolean(expandedSources[m.id]);
                const secStr = m.latencyMs ? `${(m.latencyMs / 1000).toFixed(1)}s` : 'fast';

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--sov-border)',
                      background: 'var(--sov-card-bg)'
                    }}
                  >
                    {/* Collapsible Reasoning & Evidence Timeline (AskAvi style) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setExpandedReasoning((p) => ({ ...p, [m.id]: !p[m.id] }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--sov-border)',
                          background: 'transparent',
                          color: 'var(--sov-muted)',
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-jetbrains-fallback)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isReasonOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span>Thought for {secStr} · {(m.citations || []).length} sources</span>
                      </button>

                      <span
                        title={`Citation Coverage: ${covPct}% · Phantom Citations: ${gm.phantomCitationCount || 0}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          border: `1px solid ${gradeColor}`,
                          color: gradeColor,
                          fontSize: '9.5px',
                          fontFamily: 'var(--font-jetbrains-fallback)',
                          fontWeight: 800
                        }}
                      >
                        {grade === 'PASS' ? <ShieldCheck size={11} /> : <AlertTriangle size={11} />}
                        <span>{grade} · {covPct}% CITED</span>
                      </span>
                    </div>

                    {isReasonOpen && m.reasoning && (
                      <div
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          borderLeft: '2px solid var(--sov-accent)',
                          background: 'var(--sov-panel-bg)',
                          fontSize: '11.5px',
                          color: 'var(--sov-muted)',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {m.reasoning}
                      </div>
                    )}

                    {/* Assistant Response Body */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {renderFormattedText(m.content, m.citations || [], (tag) => handleHighlightCitation(m.id, tag))}
                    </div>

                    {/* Footer Controls + Expandable Sources */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '6px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--sov-border)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedSources((p) => ({ ...p, [m.id]: !p[m.id] }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          border: '1px solid var(--sov-border)',
                          background: isSourcesOpen ? 'var(--sov-accent-soft)' : 'transparent',
                          color: isSourcesOpen ? 'var(--sov-accent)' : 'var(--sov-text)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Database size={11} />
                        <span>Verified Sources ({(m.citations || []).length})</span>
                        {isSourcesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9.5px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                          {m.modelUsed || m.providerUsed}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          title="Copy Markdown"
                          style={{ background: 'transparent', border: '1px solid var(--sov-border)', borderRadius: '5px', color: 'var(--sov-muted)', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          {copiedId === m.id ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'up')}
                          title="Accurate & Grounded"
                          style={{ background: m.feedback === 'up' ? 'rgba(16,185,129,0.16)' : 'transparent', border: `1px solid ${m.feedback === 'up' ? '#10b981' : 'var(--sov-border)'}`, borderRadius: '5px', color: m.feedback === 'up' ? '#10b981' : 'var(--sov-muted)', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <ThumbsUp size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'down')}
                          title="Flag Inaccuracy"
                          style={{ background: m.feedback === 'down' ? 'rgba(239,68,68,0.16)' : 'transparent', border: `1px solid ${m.feedback === 'down' ? '#ef4444' : 'var(--sov-border)'}`, borderRadius: '5px', color: m.feedback === 'down' ? '#ef4444' : 'var(--sov-muted)', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <ThumbsDown size={11} />
                        </button>
                      </div>
                    </div>

                    {isSourcesOpen && (m.citations || []).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        {m.citations.map((c) => {
                          const isHighlighted = highlightedCitKey === `${m.id}:${String(c.tag).toUpperCase()}`;
                          return (
                            <div
                              key={c.tag}
                              id={`sov-cit-${m.id}-${String(c.tag).toUpperCase()}`}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '7px',
                                border: `1px solid ${isHighlighted ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                                background: isHighlighted ? 'var(--sov-accent-soft)' : 'var(--sov-panel-bg)',
                                fontSize: '11px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--sov-text)' }}>
                                  <span style={{ color: c.isExternalWeb ? '#f59e0b' : 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', marginRight: '5px' }}>
                                    [{c.tag}]
                                  </span>
                                  {c.title}
                                </div>
                                <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--sov-border)', color: 'var(--sov-muted)', flexShrink: 0 }}>
                                  {c.isExternalWeb ? <Globe size={9} style={{ display: 'inline', marginRight: '3px' }} /> : null}
                                  {c.sourceLabel}
                                </span>
                              </div>
                              <div style={{ color: 'var(--sov-muted)', lineHeight: 1.45 }}>
                                {String(c.snippet || '').slice(0, 180)}...
                              </div>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
                                <a
                                  href={formatCitationUrl(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--sov-accent)', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px' }}
                                >
                                  Primary Source <ExternalLink size={10} />
                                </a>
                                {c.permalink && c.permalink !== formatCitationUrl(c) && (
                                  <a
                                    href={c.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--sov-muted)', textDecoration: 'none', fontWeight: 600, fontSize: '10.5px' }}
                                  >
                                    SovDash Record →
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--sov-border)',
                    background: 'var(--sov-card-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    fontSize: '12px',
                    color: 'var(--sov-accent)',
                    fontFamily: 'var(--font-jetbrains-fallback)'
                  }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  <span>Thinking · {elapsedSec.toFixed(1)}s · Querying Neon pgvector & verifying citations...</span>
                </div>
              )}

              {errorMsg && (
                <div style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '12px' }}>
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Bottom Prompt Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                padding: '12px 14px',
                borderTop: '1px solid var(--sov-border)',
                background: 'var(--sov-card-bg)',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end'
              }}
            >
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask across EU AI Act, CA SB 53, KR AI Basic Act, compute, ethics, labs..."
                style={{
                  flex: 1,
                  resize: 'none',
                  padding: '9px 11px',
                  borderRadius: '8px',
                  border: '1px solid var(--sov-border)',
                  background: 'var(--sov-panel-bg)',
                  color: 'var(--sov-text)',
                  fontSize: '12.5px',
                  lineHeight: 1.45,
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading || input.trim().length < 3}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: input.trim().length >= 3 && !loading ? 'var(--sov-accent)' : 'var(--sov-border)',
                  color: '#020617',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: input.trim().length >= 3 && !loading ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0
                }}
              >
                <Send size={13} />
                <span>Ask</span>
              </button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
