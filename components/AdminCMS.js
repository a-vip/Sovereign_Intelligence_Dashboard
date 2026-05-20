'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Archive, RotateCcw, Trash2, Edit3, Save, MapPin } from 'lucide-react';

const CATEGORIES = ['Conflict', 'Humanitarian', 'Disaster', 'Economic', 'Surveillance', 'Political'];
const SEVERITIES = [1, 2, 3, 4, 5];
const SEV_LABELS = { 1: 'LOW', 2: 'MODERATE', 3: 'ALERT', 4: 'HIGH', 5: 'CRITICAL' };
const SEV_COLORS = { 1: '#64748b', 2: '#38bdf8', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };

export default function AdminCMS({ currentUser, onClose }) {
  const [activeTab, setActiveTab] = useState('events');
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const limit = 50;

  const headers = { 'x-user-id': currentUser?.id || '', 'Content-Type': 'application/json' };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url;
      if (activeTab === 'events') url = `/api/admin/events?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      else if (activeTab === 'rss') url = `/api/admin/rss?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      else if (activeTab === 'feedback') url = `/api/admin/feedback?page=${page}&limit=${limit}`;
      else url = `/api/admin/archive?page=${page}&limit=${limit}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (activeTab === 'rss') {
        setData(json.items || []);
      } else if (activeTab === 'feedback') {
        setData(json.suggestions || []);
      } else {
        setData(json.events || []);
      }
      setTotal(json.total || 0);
    } catch (err) {
      console.error('CMS fetch error:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);


  const handleEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'events') {
      setEditForm({
        title: item.title || '',
        category: item.category || 'Political',
        severity: item.severity || 1,
        location: item.location || '',
        lat: item.lat ?? '',
        lon: item.lon ?? '',
        url: item.url || '',
        summary: item.details?.summary || ''
      });
    } else if (activeTab === 'rss') {
      setEditForm({
        title: item.title || '',
        category: item.category || 'Political',
        severity: item.severity || 1,
        location: item.location || '',
        latitude: item.latitude ?? '',
        longitude: item.longitude ?? '',
        source: item.source || '',
        summary: item.summary || '',
        url: item.url || ''
      });
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const endpoint = activeTab === 'events' ? '/api/admin/events' : '/api/admin/rss';
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: editingItem.id, ...editForm })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Item updated successfully');
      setEditingItem(null);
      fetchData();
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (item) => {
    if (!confirm(`Archive "${item.title?.substring(0, 60)}..."?`)) return;
    try {
      const endpoint = activeTab === 'events' ? '/api/admin/events' : '/api/admin/rss';
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Item archived');
      fetchData();
    } catch (err) {
      showToast('Archive failed: ' + err.message, 'error');
    }
  };

  const handleRestore = async (item) => {
    try {
      const res = await fetch('/api/admin/archive', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: item.id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Item restored to live feed');
      fetchData();
    } catch (err) {
      showToast('Restore failed: ' + err.message, 'error');
    }
  };

  const handlePermanentDelete = async (item) => {
    if (!confirm(`PERMANENTLY DELETE "${item.title?.substring(0, 60)}..."? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/archive', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Item permanently deleted');
      fetchData();
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  const handleFeedbackDelete = async (item) => {
    if (!confirm(`Delete/Resolve feedback: "${item.subject?.substring(0, 50)}..."?`)) return;
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Feedback deleted');
      fetchData();
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };


  const totalPages = Math.ceil(total / limit) || 1;

  const s = {
    overlay: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    panel: { width: '100%', maxWidth: '1200px', maxHeight: '90vh', background: '#0a0f1a', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 60px rgba(0,240,255,0.08)' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
    title: { fontSize: '16px', fontWeight: 800, letterSpacing: '1px', color: '#00f0ff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' },
    closeBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#8892a4', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    tabBar: { display: 'flex', gap: '4px', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
    tab: (active) => ({ padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', background: active ? 'rgba(0,240,255,0.12)' : 'transparent', color: active ? '#00f0ff' : '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'all 0.15s ease' }),
    searchBar: { display: 'flex', gap: '12px', padding: '12px 24px', alignItems: 'center', flexShrink: 0 },
    searchInput: { flex: 1, padding: '10px 16px 10px 38px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#e8edf5', fontSize: '13px', outline: 'none', fontFamily: 'inherit' },
    body: { flex: 1, overflowY: 'auto', padding: '0 24px 24px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,240,255,0.25) transparent' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
    th: { padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#0a0f1a', zIndex: 2 },
    td: { padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#c8d0df', verticalAlign: 'top', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    actionBtn: (color) => ({ background: 'none', border: 'none', color: color, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', transition: 'opacity 0.15s' }),
    sevBadge: (sev) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${SEV_COLORS[sev]}22`, color: SEV_COLORS[sev], letterSpacing: '0.5px' }),
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: '#64748b', flexShrink: 0 },
    pageBtn: (disabled) => ({ background: disabled ? 'transparent' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: disabled ? '#334155' : '#8892a4', cursor: disabled ? 'default' : 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center' }),
    toast: (type) => ({ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, zIndex: 10001, background: type === 'error' ? 'rgba(255,45,85,0.9)' : 'rgba(0,240,255,0.9)', color: type === 'error' ? '#fff' : '#000', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }),
    // Edit modal styles
    editOverlay: { position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    editPanel: { width: '100%', maxWidth: '560px', maxHeight: '85vh', background: '#0c1220', border: '1px solid rgba(0,240,255,0.25)', borderRadius: '14px', overflowY: 'auto', boxShadow: '0 0 50px rgba(0,240,255,0.1)' },
    editHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    editTitle: { fontSize: '14px', fontWeight: 700, color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '1px' },
    fieldGroup: { padding: '6px 20px' },
    fieldLabel: { fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
    fieldInput: { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e8edf5', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    fieldTextarea: { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e8edf5', fontSize: '13px', outline: 'none', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
    fieldSelect: { width: '100%', padding: '8px 12px', background: '#0c1220', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e8edf5', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    coordRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '6px 20px' },
    saveBtn: { display: 'flex', alignItems: 'center', gap: '6px', margin: '16px 20px', padding: '10px 20px', background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '8px', color: '#00f0ff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: 'calc(100% - 40px)', justifyContent: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }
  };

  return (
    <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.title}><span style={{ fontSize: '18px' }}>⚙️</span> Sovereign CMS</div>
          <button style={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={s.tabBar}>
          <button style={s.tab(activeTab === 'events')} onClick={() => setActiveTab('events')}>Live Events</button>
          <button style={s.tab(activeTab === 'rss')} onClick={() => setActiveTab('rss')}>RSS Feed</button>
          <button style={s.tab(activeTab === 'archive')} onClick={() => setActiveTab('archive')}>Archive</button>
          <button style={s.tab(activeTab === 'feedback')} onClick={() => setActiveTab('feedback')}>Feedback</button>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            {total} items
          </div>
        </div>

        {/* Search (not for archive/feedback) */}
        {activeTab !== 'archive' && activeTab !== 'feedback' && (

          <div style={s.searchBar}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <input
                style={s.searchInput}
                placeholder="Search by title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Table body */}
        <div style={s.body}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Loading data...
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No items found
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                {activeTab === 'feedback' ? (
                  <tr>
                    <th style={s.th}>Date</th>
                    <th style={s.th}>Type</th>
                    <th style={s.th}>Operator</th>
                    <th style={{...s.th, maxWidth: '200px'}}>Subject</th>
                    <th style={{...s.th, maxWidth: '300px'}}>Details</th>
                    <th style={s.th}>Screenshot</th>
                    <th style={{...s.th, textAlign: 'right'}}>Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th style={s.th}>ID</th>
                    <th style={{...s.th, maxWidth: '350px'}}>Title</th>
                    <th style={s.th}>Cat</th>
                    <th style={s.th}>Sev</th>
                    <th style={s.th}>Location</th>
                    {activeTab === 'archive' && <th style={s.th}>Archived</th>}
                    <th style={{...s.th, textAlign: 'right'}}>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {data.map(item => (
                  activeTab === 'feedback' ? (
                    <tr key={item.id} style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,240,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{...s.td, fontSize: '11px', color: '#64748b'}}>
                        {(item.createdAt || item.created_at) ? new Date(item.createdAt || item.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={s.td}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: (item.type || '').toLowerCase() === 'bug' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: (item.type || '').toLowerCase() === 'bug' ? '#ef4444' : '#22c55e',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          {item.type || 'SUGGESTION'}
                        </span>
                      </td>
                      <td style={{...s.td, fontSize: '11px', color: '#c8d0df'}}>
                        <div style={{ fontWeight: 600 }}>{item.operatorName || item.operator_name || 'Anonymous'}</div>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>{item.operatorEmail || item.operator_email || '—'}</div>
                      </td>
                      <td style={{...s.td, maxWidth: '200px', fontWeight: 500, color: '#e8edf5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {item.subject}
                      </td>
                      <td style={{...s.td, maxWidth: '300px', fontSize: '11px', color: '#8892a4', whiteSpace: 'normal', wordBreak: 'break-word'}}>
                        {typeof item.details === 'string' ? item.details : (item.details?.summary || JSON.stringify(item.details) || '—')}
                      </td>
                      <td style={s.td}>
                        {item.screenshot ? (
                          <img 
                            src={item.screenshot} 
                            alt="Screenshot" 
                            onClick={() => setLightboxImage(item.screenshot)}
                            style={{ width: '40px', height: '24px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'block', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        ) : (
                          <span style={{ color: '#475569', fontSize: '11px' }}>None</span>
                        )}
                      </td>
                      <td style={{...s.td, textAlign: 'right', whiteSpace: 'nowrap'}}>
                        <button style={s.actionBtn('#ff2d55')} onClick={() => handleFeedbackDelete(item)} title="Delete / Resolve"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id} style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,240,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{...s.td, fontFamily: 'var(--font-jetbrains-fallback, monospace)', fontSize: '10px', color: '#64748b', maxWidth: '60px'}}>
                        {item.id?.substring(0, 8)}
                      </td>
                      <td style={{...s.td, maxWidth: '350px', color: '#e8edf5', fontWeight: 500}}>
                        {item.title?.substring(0, 80)}{item.title?.length > 80 ? '...' : ''}
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: '11px', color: '#a78bfa' }}>{item.category || '—'}</span>
                      </td>
                      <td style={s.td}>
                        <span style={s.sevBadge(item.severity || 1)}>{SEV_LABELS[item.severity] || 'LOW'}</span>
                      </td>
                      <td style={{...s.td, fontSize: '11px', maxWidth: '120px'}}>
                        {item.location?.substring(0, 25) || '—'}
                      </td>
                      {activeTab === 'archive' && (
                        <td style={{...s.td, fontSize: '10px', color: '#64748b'}}>
                          {item.archived_at ? new Date(item.archived_at).toLocaleDateString() : '—'}
                        </td>
                      )}
                      <td style={{...s.td, textAlign: 'right', whiteSpace: 'nowrap'}}>
                        {activeTab === 'archive' ? (
                          <>
                            <button style={s.actionBtn('#22c55e')} onClick={() => handleRestore(item)} title="Restore to live"><RotateCcw size={14} /></button>
                            <button style={s.actionBtn('#ff2d55')} onClick={() => handlePermanentDelete(item)} title="Delete permanently"><Trash2 size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button style={s.actionBtn('#00f0ff')} onClick={() => handleEdit(item)} title="Edit"><Edit3 size={14} /></button>
                            <button style={s.actionBtn('#facc15')} onClick={() => handleArchive(item)} title="Archive"><Archive size={14} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>

          )}
        </div>

        {/* Footer / Pagination */}
        <div style={s.footer}>
          <span>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={s.pageBtn(page <= 1)} onClick={() => page > 1 && setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft size={14} /></button>
            <button style={s.pageBtn(page >= totalPages)} onClick={() => page < totalPages && setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div style={s.editOverlay} onClick={(e) => { if (e.target === e.currentTarget) setEditingItem(null); }}>
          <div style={s.editPanel}>
            <div style={s.editHeader}>
              <div style={s.editTitle}><Edit3 size={14} /> Edit Item</div>
              <button style={s.closeBtn} onClick={() => setEditingItem(null)}><X size={16} /></button>
            </div>

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>Title</div>
              <input style={s.fieldInput} value={editForm.title || ''} onChange={e => setEditForm(f => ({...f, title: e.target.value}))} />
            </div>

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>Summary</div>
              <textarea style={s.fieldTextarea} value={editForm.summary || ''} onChange={e => setEditForm(f => ({...f, summary: e.target.value}))} />
            </div>

            {activeTab === 'rss' && (
              <div style={s.fieldGroup}>
                <div style={s.fieldLabel}>Source</div>
                <input style={s.fieldInput} value={editForm.source || ''} onChange={e => setEditForm(f => ({...f, source: e.target.value}))} />
              </div>
            )}

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>URL</div>
              <input style={s.fieldInput} value={editForm.url || ''} onChange={e => setEditForm(f => ({...f, url: e.target.value}))} />
            </div>

            <div style={s.coordRow}>
              <div>
                <div style={s.fieldLabel}>Category</div>
                <select style={s.fieldSelect} value={editForm.category || 'Political'} onChange={e => setEditForm(f => ({...f, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={s.fieldLabel}>Severity</div>
                <select style={s.fieldSelect} value={editForm.severity || 1} onChange={e => setEditForm(f => ({...f, severity: parseInt(e.target.value)}))}>
                  {SEVERITIES.map(sv => <option key={sv} value={sv}>{sv} — {SEV_LABELS[sv]}</option>)}
                </select>
              </div>
            </div>

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}><MapPin size={10} style={{ display: 'inline', marginRight: '4px' }} />Location</div>
              <input style={s.fieldInput} value={editForm.location || ''} onChange={e => setEditForm(f => ({...f, location: e.target.value}))} />
            </div>

            <div style={s.coordRow}>
              <div>
                <div style={s.fieldLabel}>Latitude</div>
                <input style={s.fieldInput} type="number" step="0.0001" value={activeTab === 'rss' ? (editForm.latitude ?? '') : (editForm.lat ?? '')}
                  onChange={e => setEditForm(f => activeTab === 'rss' ? ({...f, latitude: e.target.value}) : ({...f, lat: e.target.value}))} />
              </div>
              <div>
                <div style={s.fieldLabel}>Longitude</div>
                <input style={s.fieldInput} type="number" step="0.0001" value={activeTab === 'rss' ? (editForm.longitude ?? '') : (editForm.lon ?? '')}
                  onChange={e => setEditForm(f => activeTab === 'rss' ? ({...f, longitude: e.target.value}) : ({...f, lon: e.target.value}))} />
              </div>
            </div>

            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={s.toast(toast.type)}>{toast.msg}</div>}

      {/* Lightbox for screenshots */}
      {lightboxImage && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
          onClick={() => setLightboxImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={lightboxImage} alt="Feedback Screenshot" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }} />
            <button 
              style={{ marginTop: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#00f0ff', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}
              onClick={() => setLightboxImage(null)}
            >
              Close Telemetry Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

