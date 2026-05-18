'use client';
import { useState, useMemo } from 'react';
import { Search, X, ExternalLink, FileText, Clock, Hash } from 'lucide-react';

export default function QualitativeExplorer({ documents, onTagFilter, activeTag }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [threatFilter, setThreatFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);

  const categories = useMemo(() => {
    if (!documents) return [];
    const cats = [...new Set(documents.map(d => d.categoryLabel))];
    return cats.sort();
  }, [documents]);

  const filtered = useMemo(() => {
    if (!documents) return [];
    return documents.filter(doc => {
      const matchesSearch = !search ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
        doc.preview.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || doc.categoryLabel === categoryFilter;
      const matchesThreat = threatFilter === 'all' || doc.threatLevel === threatFilter;
      const matchesTag = !activeTag || doc.tags.includes(activeTag);
      return matchesSearch && matchesCategory && matchesThreat && matchesTag;
    });
  }, [documents, search, categoryFilter, threatFilter, activeTag]);

  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">
          <FileText size={16} /> Qualitative Intelligence Explorer
        </span>
      </div>

      <div className="explorer-controls">
        <div className="search-wrapper">
          <Search size={16} />
          <input
            id="doc-search"
            className="search-input"
            type="text"
            placeholder="Search documents, tags, content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select id="category-filter" className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select id="threat-filter" className="filter-select" value={threatFilter} onChange={e => setThreatFilter(e.target.value)}>
          <option value="all">All Threats</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {activeTag && (
          <button className="tag-pill active" onClick={() => onTagFilter?.(null)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Hash size={12} /> {activeTag} <X size={12} />
          </button>
        )}
        <span className="doc-count">{filtered.length} / {documents?.length || 0}</span>
      </div>

      <div className="doc-list">
        {filtered.map(doc => (
          <div key={doc.id} className="doc-item" onClick={() => setSelectedDoc(doc)} tabIndex={0} role="button">
            <div className={`doc-threat ${doc.threatLevel}`} />
            <div className="doc-info">
              <div className="doc-title">{doc.title}</div>
              <div className="doc-meta">
                <span className="doc-category" style={{ background: `${doc.categoryColor}15`, color: doc.categoryColor }}>
                  {doc.categoryLabel}
                </span>
                <span className={`threat-badge ${doc.threatLevel}`}>{doc.threatLevel}</span>
                <div className="doc-tags">
                  {doc.tags.slice(0, 4).map(t => <span key={t} className="doc-tag">{t}</span>)}
                  {doc.tags.length > 4 && <span className="doc-tag">+{doc.tags.length - 4}</span>}
                </div>
              </div>
            </div>
            <div className="doc-stats">
              <span className="doc-words">{doc.wordCount.toLocaleString()} words</span>
              <span className="doc-date">{doc.relativePath.split('\\')[0]}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No documents match your filters.
          </div>
        )}
      </div>

      {selectedDoc && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedDoc(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <div className="modal-title">{selectedDoc.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: "var(--font-jetbrains-fallback)" }}>
                  {selectedDoc.relativePath}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedDoc(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-meta">
                <span className="modal-meta-tag" style={{ background: `${selectedDoc.categoryColor}15`, color: selectedDoc.categoryColor }}>
                  {selectedDoc.categoryLabel}
                </span>
                <span className={`threat-badge ${selectedDoc.threatLevel}`}>{selectedDoc.threatLevel}</span>
                {selectedDoc.hasEvidence && (
                  <span className="modal-meta-tag" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                    ✓ Verified Sources
                  </span>
                )}
                <span className="modal-meta-tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  {selectedDoc.wordCount.toLocaleString()} words
                </span>
              </div>

              {selectedDoc.frontmatter && Object.keys(selectedDoc.frontmatter).length > 0 && (
                <div className="modal-frontmatter">
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    YAML Frontmatter
                  </div>
                  {Object.entries(selectedDoc.frontmatter).map(([key, val]) => (
                    <div className="fm-row" key={key}>
                      <span className="fm-key">{key}:</span>
                      <span className="fm-value">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedDoc.tags.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Tags
                  </div>
                  <div className="tag-cloud">
                    {selectedDoc.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                  </div>
                </div>
              )}

              {selectedDoc.wikiLinks?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Document Links
                  </div>
                  <div className="tag-cloud">
                    {selectedDoc.wikiLinks.map(l => (
                      <span key={l} className="tag-pill" style={{ borderColor: 'rgba(56,189,248,0.2)', color: '#38bdf8' }}>
                        <ExternalLink size={10} style={{ marginRight: 4 }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Content Preview
                </div>
                <div className="modal-preview">{selectedDoc.preview || 'No preview available.'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
