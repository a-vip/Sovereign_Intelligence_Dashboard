'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  History,
  Plus,
  Lock,
  MapPin,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';

const STARTER_PROMPTS = [
  'What are the most recent AI related events which have happened in USA?',
  'Who is the national AI supervisory agency in Spain?',
  'Compare mandatory incident-reporting windows across EU AI Act, California SB 53, and South Korea AI Basic Act.',
  'How many data center facilities are tracked in the United States?'
];

function formatCitationUrl(c) {
  return c?.url || c?.permalink || 'https://app.sovdash.com/';
}

function renderInlineTokens(text, citations = [], onHighlightCitation) {
  const tokens = String(text || '').split(/(\*\*[^*]+\*\*|\[W?\d+\])/gi);
  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} style={{ color: 'var(--sov-text)', fontWeight: 700 }}>
          {tok.slice(2, -2)}
        </strong>
      );
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
          title={cit.title}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 2px',
            padding: '0 5px',
            height: '16px',
            borderRadius: '4px',
            border: '1px solid var(--sov-border)',
            background: 'var(--sov-accent-soft)',
            color: 'var(--sov-accent)',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'var(--font-jetbrains-fallback)',
            cursor: 'pointer',
            verticalAlign: 'middle'
          }}
        >
          {tag}
        </button>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

function renderFormattedText(text, citations = [], onHighlightCitation) {
  const rawLines = String(text || '').split('\n');
  const blocks = [];
  let tableBuffer = [];

  const flushTable = (keyPrefix) => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .filter((l) => !/^\|[\s\-:|]+\|$/.test(l.trim()))
      .map((l) =>
        l
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim())
      );
    tableBuffer = [];
    if (rows.length === 0) return;
    const [head, ...body] = rows;
    blocks.push(
      <div key={`${keyPrefix}-tbl`} style={{ overflowX: 'auto', margin: '4px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--sov-border)' }}>
              {head.map((h, hi) => (
                <th key={hi} style={{ textAlign: 'left', padding: '5px 7px', fontWeight: 700, color: 'var(--sov-accent)' }}>
                  {renderInlineTokens(h, citations, onHighlightCitation)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '5px 7px', color: 'var(--sov-text)', lineHeight: 1.45, verticalAlign: 'top' }}>
                    {renderInlineTokens(cell, citations, onHighlightCitation)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      tableBuffer.push(trimmed);
      return;
    }
    flushTable(`row-${idx}`);

    if (!trimmed) {
      blocks.push(<div key={idx} style={{ height: '5px' }} />);
      return;
    }

    const isH2 = trimmed.startsWith('## ');
    const isH3 = trimmed.startsWith('### ');
    const isBullet = /^[-*•]\s+/.test(trimmed);
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    const cleanContent = isH3
      ? trimmed.slice(4)
      : isH2
      ? trimmed.slice(3)
      : isBullet
      ? trimmed.replace(/^[-*•]\s+/, '')
      : numMatch
      ? numMatch[2]
      : trimmed;

    if (isH2 || isH3) {
      blocks.push(
        <div key={idx} style={{ fontSize: isH2 ? '13px' : '12.5px', fontWeight: 700, color: 'var(--sov-text)', marginTop: '4px' }}>
          {renderInlineTokens(cleanContent, citations, onHighlightCitation)}
        </div>
      );
      return;
    }

    if (isBullet || numMatch) {
      blocks.push(
        <div key={idx} style={{ display: 'flex', gap: '7px', paddingLeft: '2px', lineHeight: 1.5, fontSize: '12.5px' }}>
          <span style={{ color: 'var(--sov-accent)', fontWeight: 700, flexShrink: 0 }}>{numMatch ? `${numMatch[1]}.` : '•'}</span>
          <span>{renderInlineTokens(cleanContent, citations, onHighlightCitation)}</span>
        </div>
      );
      return;
    }

    blocks.push(
      <div key={idx} style={{ lineHeight: 1.55, fontSize: '12.5px' }}>
        {renderInlineTokens(cleanContent, citations, onHighlightCitation)}
      </div>
    );
  });

  flushTable('end');
  return blocks;
}

export default function SovDashAiDrawer({ isOpen, onClose, currentUser, onRequestAuth, onFocusLocation }) {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [expandedReasoning, setExpandedReasoning] = useState({});
  const [expandedSources, setExpandedSources] = useState({});
  const [highlightedCitKey, setHighlightedCitKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const checkViewport = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    if (!isOpen || !currentUser?.email) return;
    let active = true;
    fetch('/api/sovdash-ai', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json?.success) return;
        setSessions(json.sessions || []);
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
            latencyMs: row.latency_ms,
            feedback: row.user_feedback
          });
        }
        setMessages(hydrated);
      }
    } catch (err) {
      setErrorMsg(`Could not load chat: ${err.message}`);
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
          latencyMs: json.latencyMs,
          feedback: null
        }
      ]);

      fetch('/api/sovdash-ai', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => s?.sessions && setSessions(s.sessions))
        .catch(() => {});
    } catch (err) {
      setErrorMsg(err.message || 'Unable to reach Ask SovDash right now.');
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

  const iconBtnStyle = (active = false) => ({
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: `1px solid ${active ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
    background: active ? 'var(--sov-accent-soft)' : 'transparent',
    color: active ? 'var(--sov-accent)' : 'var(--sov-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  // Non-blocking floating card on desktop (globe & left feed remain 100% visible & interactive!)
  const floatingFrameStyle = isMobile
    ? {
        position: 'fixed',
        left: '8px',
        right: '8px',
        bottom: '10px',
        height: '72dvh',
        maxHeight: 'calc(100dvh - 70px)',
        borderRadius: '16px'
      }
    : {
        position: 'fixed',
        top: '58px',
        right: '14px',
        width: isExpanded ? '540px' : '400px',
        maxWidth: 'calc(100vw - 28px)',
        height: 'min(640px, calc(100dvh - 104px))',
        borderRadius: '16px',
        transition: 'width 0.2s ease'
      };

  return (
    <aside
      role="dialog"
      aria-label="Ask SovDash AI Assistant"
      style={{
        ...floatingFrameStyle,
        zIndex: 10040,
        background: 'var(--sov-panel-bg)',
        color: 'var(--sov-text)',
        border: '1px solid var(--sov-border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--sov-shadow, 0 20px 56px rgba(0, 0, 0, 0.42))',
        backdropFilter: 'blur(18px)',
        fontFamily: 'var(--font-inter-fallback), system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Clean Compact Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '11px 14px',
          borderBottom: '1px solid var(--sov-border)',
          background: 'var(--sov-card-bg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: 'var(--sov-accent-soft)',
              border: '1px solid var(--sov-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sov-accent)'
            }}
          >
            <Sparkles size={13} />
          </div>
          <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Ask SovDash</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {currentUser && (
            <>
              <button
                type="button"
                onClick={() => setShowSessions((s) => !s)}
                title="Past Conversations"
                style={iconBtnStyle(showSessions)}
              >
                <History size={13} />
              </button>
              <button type="button" onClick={handleNewChat} title="New Chat" style={iconBtnStyle(false)}>
                <Plus size={14} />
              </button>
            </>
          )}
          {!isMobile && (
            <button
              type="button"
              onClick={() => setIsExpanded((e) => !e)}
              title={isExpanded ? 'Compact Window' : 'Expand Window'}
              style={iconBtnStyle(isExpanded)}
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask SovDash"
            style={iconBtnStyle(false)}
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Guest Sign-In Gate */}
      {!currentUser ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--sov-accent-soft)',
              border: '1px solid var(--sov-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sov-accent)'
            }}
          >
            <Lock size={19} />
          </div>
          <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Sign in to Ask SovDash</h2>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--sov-muted)', lineHeight: 1.55 }}>
              Ask questions across live global AI events, laws, frontier labs, and compute infrastructure.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestAuth?.();
            }}
            style={{
              padding: '9px 18px',
              borderRadius: '9px',
              border: 'none',
              background: 'var(--sov-accent)',
              color: '#020617',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign In / Create Account
          </button>
        </div>
      ) : (
        <>
          {/* Collapsible Past Conversations */}
          {showSessions && (
            <div
              style={{
                borderBottom: '1px solid var(--sov-border)',
                background: 'var(--sov-card-bg)',
                padding: '9px 12px',
                maxHeight: '175px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--sov-muted)' }}>
                Recent Conversations
              </div>
              {sessions.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--sov-muted)' }}>No saved chats yet.</div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => loadSession(s.id)}
                    style={{
                      textAlign: 'left',
                      padding: '6px 9px',
                      borderRadius: '7px',
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
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {s.title}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--sov-muted)', flexShrink: 0 }}>
                      {s.message_count || 1}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Conversation Scroll Area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.length === 0 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--sov-text)', marginBottom: '2px' }}>
                  What would you like to explore?
                </div>
                <div style={{ fontSize: '12px', color: 'var(--sov-muted)', lineHeight: 1.5, marginBottom: '4px' }}>
                  Ask about recent global events, national AI laws, regulators, or data centers.
                </div>

                {STARTER_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    style={{
                      textAlign: 'left',
                      padding: '9px 11px',
                      borderRadius: '10px',
                      border: '1px solid var(--sov-border)',
                      background: 'var(--sov-card-bg)',
                      color: 'var(--sov-text)',
                      fontSize: '12px',
                      lineHeight: 1.4,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{q}</span>
                    <span style={{ color: 'var(--sov-accent)', fontWeight: 700 }}>→</span>
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
                        maxWidth: '86%',
                        padding: '8px 12px',
                        borderRadius: '14px 14px 3px 14px',
                        background: 'var(--sov-accent-soft)',
                        border: '1px solid var(--sov-accent)',
                        color: 'var(--sov-text)',
                        fontSize: '12.5px',
                        lineHeight: 1.45,
                        fontWeight: 500
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              }

              const isReasonOpen = Boolean(expandedReasoning[m.id]);
              const isSourcesOpen = Boolean(expandedSources[m.id]);
              const secStr = m.latencyMs ? `${(m.latencyMs / 1000).toFixed(1)}s` : '1.0s';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--sov-border)',
                    background: 'var(--sov-card-bg)'
                  }}
                >
                  {/* Collapsible Reasoning Trace */}
                  {m.reasoning && (
                    <button
                      type="button"
                      onClick={() => setExpandedReasoning((p) => ({ ...p, [m.id]: !p[m.id] }))}
                      style={{
                        alignSelf: 'flex-start',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--sov-muted)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {isReasonOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span>
                        Thought for {secStr} · {(m.citations || []).length} sources
                      </span>
                    </button>
                  )}

                  {isReasonOpen && m.reasoning && (
                    <div
                      style={{
                        padding: '7px 10px',
                        borderRadius: '7px',
                        borderLeft: '2px solid var(--sov-accent)',
                        background: 'var(--sov-panel-bg)',
                        fontSize: '11px',
                        color: 'var(--sov-muted)',
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {m.reasoning}
                    </div>
                  )}

                  {/* Clean Concise Answer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {renderFormattedText(m.content, m.citations || [], (tag) => handleHighlightCitation(m.id, tag))}
                  </div>

                  {/* Minimal Footer */}
                  {(m.citations?.length > 0 || m.content) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        paddingTop: '6px',
                        borderTop: '1px solid var(--sov-border)'
                      }}
                    >
                      {(m.citations || []).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpandedSources((p) => ({ ...p, [m.id]: !p[m.id] }))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--sov-border)',
                            background: isSourcesOpen ? 'var(--sov-accent-soft)' : 'transparent',
                            color: isSourcesOpen ? 'var(--sov-accent)' : 'var(--sov-muted)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <span>Sources ({m.citations.length})</span>
                          {isSourcesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </button>
                      ) : (
                        <span />
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          title="Copy"
                          style={{ background: 'transparent', border: 'none', color: 'var(--sov-muted)', padding: '3px', cursor: 'pointer', display: 'flex' }}
                        >
                          {copiedId === m.id ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'up')}
                          title="Helpful"
                          style={{ background: 'transparent', border: 'none', color: m.feedback === 'up' ? '#10b981' : 'var(--sov-muted)', padding: '3px', cursor: 'pointer', display: 'flex' }}
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, 'down')}
                          title="Not helpful"
                          style={{ background: 'transparent', border: 'none', color: m.feedback === 'down' ? '#ef4444' : 'var(--sov-muted)', padding: '3px', cursor: 'pointer', display: 'flex' }}
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {isSourcesOpen && (m.citations || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '2px' }}>
                      {m.citations.map((c) => {
                        const isHighlighted = highlightedCitKey === `${m.id}:${String(c.tag).toUpperCase()}`;
                        const hasCoords = c.lat != null && c.lon != null && !Number.isNaN(Number(c.lat));
                        return (
                          <div
                            key={c.tag}
                            id={`sov-cit-${m.id}-${String(c.tag).toUpperCase()}`}
                            style={{
                              padding: '7px 9px',
                              borderRadius: '8px',
                              border: `1px solid ${isHighlighted ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                              background: isHighlighted ? 'var(--sov-accent-soft)' : 'var(--sov-panel-bg)',
                              fontSize: '11px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--sov-text)', lineHeight: 1.35 }}>
                              <span style={{ color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', marginRight: '5px' }}>
                                [{c.tag}]
                              </span>
                              {c.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', color: 'var(--sov-muted)', fontSize: '10.5px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    letterSpacing: '0.02em',
                                    background: c.isExternalWeb ? 'rgba(56,189,248,0.12)' : 'var(--sov-accent-soft)',
                                    color: c.isExternalWeb ? '#38bdf8' : 'var(--sov-accent)',
                                    border: `1px solid ${c.isExternalWeb ? 'rgba(56,189,248,0.3)' : 'var(--sov-border)'}`
                                  }}
                                >
                                  {c.isExternalWeb ? (c.sourceLabel || 'Web Verification') : 'SovDash'}
                                </span>
                                <span>{[c.location, c.dateStr].filter(Boolean).join(' · ')}</span>
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {hasCoords && onFocusLocation && (
                                  <button
                                    type="button"
                                    onClick={() => onFocusLocation(c.lat, c.lon)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '1px 6px',
                                      borderRadius: '5px',
                                      border: '1px solid var(--sov-border)',
                                      background: 'transparent',
                                      color: 'var(--sov-accent)',
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <MapPin size={10} /> Locate
                                  </button>
                                )}
                                <a
                                  href={formatCitationUrl(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--sov-accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                >
                                  Source <ExternalLink size={10} />
                                </a>
                              </div>
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
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--sov-border)',
                  background: 'var(--sov-card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--sov-accent)'
                }}
              >
                <Loader2 size={13} className="animate-spin" />
                <span>
                  {elapsedSec < 1.2
                    ? 'Scanning SovDash archive & live feeds'
                    : elapsedSec < 2.8
                      ? 'Cross-verifying global & web sources'
                      : 'Deliberating & formulating response'}{' '}
                  · {elapsedSec.toFixed(1)}s
                </span>
              </div>
            )}

            {errorMsg && (
              <div style={{ padding: '8px 11px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '12px' }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Clean Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--sov-border)',
              background: 'var(--sov-card-bg)',
              display: 'flex',
              gap: '7px',
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
              placeholder="Ask about events, laws, or infrastructure..."
              style={{
                flex: 1,
                resize: 'none',
                padding: '8px 10px',
                borderRadius: '9px',
                border: '1px solid var(--sov-border)',
                background: 'var(--sov-panel-bg)',
                color: 'var(--sov-text)',
                fontSize: '12.5px',
                lineHeight: 1.4,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || input.trim().length < 3}
              aria-label="Send message"
              style={{
                height: '36px',
                width: '36px',
                borderRadius: '9px',
                border: 'none',
                background: input.trim().length >= 3 && !loading ? 'var(--sov-accent)' : 'var(--sov-border)',
                color: '#020617',
                cursor: input.trim().length >= 3 && !loading ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </>
      )}
    </aside>
  );
}
