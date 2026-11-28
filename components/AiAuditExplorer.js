'use client';

import { useState, useMemo } from 'react';

const PAGE_SIZE = 25;

export default function AiAuditExplorer({
  results = [],
  strataSummary = [],
  failureTaxonomy = {},
  totalTests = 0
}) {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pass' | 'fail' | 'traps'
  const [stratumFilter, setStratumFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (results || []).filter((r) => {
      if (statusFilter === 'pass' && !r.passed) return false;
      if (statusFilter === 'fail' && r.passed) return false;
      if (statusFilter === 'traps' && !r.isTrap) return false;
      if (stratumFilter !== 'ALL' && (r.stratum || r.category) !== stratumFilter) return false;
      if (q) {
        const hay = `${r.id || ''} ${r.stratum || r.category || ''} ${r.prompt || ''} ${r.answerPreview || ''} ${r.failureMode || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [results, statusFilter, stratumFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const failEntries = Object.entries(failureTaxonomy || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 10-Stratum Stratified Breakdown */}
      {strataSummary.length > 0 && (
        <section style={{ padding: '18px', borderRadius: '10px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--sov-text)' }}>
                Stratified Accuracy Across {strataSummary.length} Academic Domains ({totalTests.toLocaleString()} Cases)
              </h2>
              <div style={{ fontSize: '11.5px', color: 'var(--sov-muted)', marginTop: '3px' }}>
                Click any domain row below to filter the interactive case explorer. Confidence intervals use exact 95% Wilson Score bounds.
              </div>
            </div>
            {stratumFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => { setStratumFilter('ALL'); setPage(1); }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--sov-accent)',
                  background: 'var(--sov-accent-soft)',
                  color: 'var(--sov-accent)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Clear Domain Filter ×
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {strataSummary.map((st) => {
              const active = stratumFilter === st.stratum;
              const barColor = st.passRate >= 95 ? '#10b981' : st.passRate >= 85 ? '#38bdf8' : '#f59e0b';
              return (
                <button
                  key={st.stratum}
                  type="button"
                  onClick={() => {
                    setStratumFilter(active ? 'ALL' : st.stratum);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${active ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                    background: active ? 'var(--sov-accent-soft)' : 'var(--sov-panel-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--sov-text)' }}>
                      {st.stratum}
                    </span>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                      <span style={{ fontWeight: 800, color: barColor }}>
                        {st.passed}/{st.total} ({st.passRate}%)
                      </span>
                      {st.wilsonCI95 && (
                        <span style={{ color: 'var(--sov-muted)' }}>
                          95% CI [{st.wilsonCI95.low}%–{st.wilsonCI95.high}%]
                        </span>
                      )}
                      <span style={{ color: '#38bdf8' }}>Cited {st.citationCoverageAvg}%</span>
                      <span style={{ color: '#a855f7' }}>Gnd {st.groundingAvg}%</span>
                      <span style={{ color: st.phantomCitations === 0 ? '#10b981' : '#ef4444' }}>
                        Phantoms: {st.phantomCitations}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '6px', width: '100%', borderRadius: '999px', background: 'rgba(148,163,184,0.16)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(2, st.passRate)}%`, background: barColor, borderRadius: '999px' }} />
                  </div>
                </button>
              );
            })}
          </div>

          {failEntries.length > 0 && (
            <div style={{ marginTop: '14px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.06)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-jetbrains-fallback)', marginBottom: '6px' }}>
                DIAGNOSTIC FAILURE-MODE TAXONOMY (OPEN ENGINEERING TARGETS)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {failEntries.map(([mode, count]) => (
                  <span
                    key={mode}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      border: '1px solid rgba(245,158,11,0.35)',
                      background: 'var(--sov-panel-bg)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-jetbrains-fallback)',
                      color: 'var(--sov-text)'
                    }}
                  >
                    <strong>{mode}</strong>: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Interactive Searchable & Filterable Case Explorer */}
      <section style={{ padding: '18px', borderRadius: '10px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Interactive Evaluation Case Inspector ({filtered.length.toLocaleString()} / {results.length.toLocaleString()} shown)
            </h2>
            <div style={{ fontSize: '11.5px', color: 'var(--sov-muted)', marginTop: '2px' }}>
              Inspect every evaluated prompt, answer preview, grounding score, and abstention decision.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <a
              href="/api/ai-report?format=csv"
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(16,185,129,0.45)',
                background: 'rgba(16,185,129,0.12)',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-fallback)',
                textDecoration: 'none'
              }}
            >
              ⬇ Download Full CSV
            </a>
            <a
              href="/api/ai-report?format=jsonl"
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(56,189,248,0.45)',
                background: 'rgba(56,189,248,0.12)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-fallback)',
                textDecoration: 'none'
              }}
            >
              ⬇ Download JSONL
            </a>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${results.length})` },
              { id: 'pass', label: `PASS (${results.filter((r) => r.passed).length})` },
              { id: 'fail', label: `FAIL (${results.filter((r) => !r.passed).length})` },
              { id: 'traps', label: `Adversarial Traps (${results.filter((r) => r.isTrap).length})` }
            ].map((pill) => {
              const on = statusFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => { setStatusFilter(pill.id); setPage(1); }}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '6px',
                    border: `1px solid ${on ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                    background: on ? 'var(--sov-accent-soft)' : 'var(--sov-panel-bg)',
                    color: on ? 'var(--sov-accent)' : 'var(--sov-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-jetbrains-fallback)',
                    cursor: 'pointer'
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search prompts, countries, failure modes, answers..."
            style={{
              flex: '1 1 220px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-panel-bg)',
              color: 'var(--sov-text)',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>

        {/* Paginated Results Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sov-border)', textAlign: 'left', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '10.5px' }}>
                <th style={{ padding: '8px' }}>ID &amp; STRATUM</th>
                <th style={{ padding: '8px' }}>PROMPT &amp; ANSWER EXCERPT</th>
                <th style={{ padding: '8px' }}>RESULT</th>
                <th style={{ padding: '8px' }}>CITED</th>
                <th style={{ padding: '8px' }}>GROUNDING</th>
                <th style={{ padding: '8px' }}>PHANTOMS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '18px', textAlign: 'center', color: 'var(--sov-muted)' }}>
                    No evaluated cases match the active filter.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                    <td style={{ padding: '8px', verticalAlign: 'top', minWidth: '175px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--sov-text)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px' }}>{r.id}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)', marginTop: '2px' }}>{r.stratum || r.category}</div>
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top', maxWidth: '460px' }}>
                      <div style={{ color: 'var(--sov-text)', fontWeight: 600, lineHeight: 1.45 }}>{r.prompt}</div>
                      {r.answerPreview && (
                        <div style={{ fontSize: '11px', color: 'var(--sov-muted)', marginTop: '4px', lineHeight: 1.45 }}>
                          {r.answerPreview}{r.answerPreview.length >= 255 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, color: r.passed ? '#10b981' : '#ef4444', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                        {r.passed ? 'PASS' : 'FAIL'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--sov-muted)', marginTop: '2px' }}>
                        {r.isTrap ? (r.abstained ? 'Abstained ✓' : 'Trap Leak') : (r.failureMode || r.hallucinationGrade || 'Verified')}
                      </div>
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                      {Math.round((r.citationCoverage ?? 1) * 100)}%
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                      {Math.round((r.entityNumericGrounding ?? 1) * 100)}%
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top', fontFamily: 'var(--font-jetbrains-fallback)', color: (r.phantomCount || 0) === 0 ? '#10b981' : '#ef4444' }}>
                      {r.phantomCount || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11.5px', color: 'var(--sov-muted)' }}>
            <span>
              Page <strong>{safePage}</strong> of <strong>{totalPages}</strong> ({filtered.length.toLocaleString()} cases)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--sov-border)',
                  background: 'var(--sov-panel-bg)',
                  color: safePage <= 1 ? 'var(--sov-muted)' : 'var(--sov-text)',
                  cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--sov-border)',
                  background: 'var(--sov-panel-bg)',
                  color: safePage >= totalPages ? 'var(--sov-muted)' : 'var(--sov-text)',
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
