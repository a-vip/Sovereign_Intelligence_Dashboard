'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Archive,
  RotateCcw,
  Trash2,
  Edit3,
  Save,
  MapPin,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import AdminAiConsole from './AdminAiConsole';

const CATEGORIES = ['Conflict', 'Humanitarian', 'Disaster', 'Economic', 'Surveillance', 'Political'];
const SEVERITIES = [1, 2, 3, 4, 5];
const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };

const TABS = [
  { id: 'events', label: 'Map Events' },
  { id: 'rss', label: 'RSS Wire' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'archive', label: 'Archive' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'accounts', label: 'Users' },
  { id: 'ai', label: 'SovDash AI' }
];

export default function AdminCMS({ currentUser, onClose }) {
  const [activeTab, setActiveTab] = useState('events');
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'Political',
    severity: 2,
    location: '',
    lat: '',
    lon: '',
    url: '',
    summary: '',
    status: 'published'
  });

  const [correctingCoordsItem, setCorrectingCoordsItem] = useState(null);
  const [coordsForm, setCoordsForm] = useState({
    targetId: '',
    title: '',
    newLocation: '',
    newLat: '',
    newLon: ''
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [runningEngine, setRunningEngine] = useState(false);
  const [anomalyFilter, setAnomalyFilter] = useState('all');
  const [selectedAnomalyIds, setSelectedAnomalyIds] = useState(new Set());
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Nominatim Geocode Autocomplete
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState(null); // 'edit' | 'create' | 'correct'

  const limit = 40;
  const headers = { 'x-user-id': currentUser?.id || '', 'Content-Type': 'application/json' };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setData([]);
    setTotal(0);
    setSelectedAnomalyIds(new Set());
  }, [activeTab]);

  const fetchData = useCallback(async () => {
    if (activeTab === 'ai') return;
    setLoading(true);
    try {
      let url;
      if (activeTab === 'events') url = `/api/admin/events?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`;
      else if (activeTab === 'rss') url = `/api/admin/rss?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`;
      else if (activeTab === 'feedback') url = `/api/admin/feedback?page=${page}&limit=${limit}`;
      else if (activeTab === 'diagnostics') url = `/api/admin/diagnostics`;
      else if (activeTab === 'accounts') url = `/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`;
      else url = `/api/admin/archive?page=${page}&limit=${limit}`;

      const res = await fetch(url, { headers: { 'x-user-id': currentUser?.id || '' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (activeTab === 'rss') {
        setData(json.items || []);
        setTotal(json.total || 0);
      } else if (activeTab === 'feedback') {
        setData(json.suggestions || []);
        setTotal(json.total || 0);
      } else if (activeTab === 'diagnostics') {
        setData(json.anomalies || []);
        setTotal(json.anomalies?.length || 0);
      } else if (activeTab === 'accounts') {
        setData(json.users || []);
        setTotal(json.total || 0);
      } else {
        setData(json.events || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      showToast(`Load failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch, currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced Nominatim location lookup
  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&addressdetails=1&limit=5`,
          { headers: { Accept: 'application/json' } }
        );
        if (res.ok) {
          setSuggestions(await res.json());
        }
      } catch {}
      finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addressQuery]);

  const applySuggestion = (sug) => {
    const label = sug.display_name.split(',').slice(0, 2).join(', ');
    const lat = Number(parseFloat(sug.lat).toFixed(4));
    const lon = Number(parseFloat(sug.lon).toFixed(4));
    if (activeSearchField === 'edit') {
      const isRss = activeTab === 'rss' || editingItem?.source_table === 'rss_items';
      setEditForm((prev) => ({
        ...prev,
        location: label,
        ...(isRss ? { latitude: lat, longitude: lon } : { lat, lon })
      }));
    } else if (activeSearchField === 'create') {
      setCreateForm((prev) => ({ ...prev, location: label, lat, lon }));
    } else if (activeSearchField === 'correct') {
      setCoordsForm((prev) => ({ ...prev, newLocation: label, newLat: lat, newLon: lon }));
    }
    setSuggestions([]);
    setAddressQuery('');
    setActiveSearchField(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const isRss = activeTab === 'rss' || item.source_table === 'rss_items';
    if (!isRss) {
      setEditForm({
        title: item.title || '',
        category: item.category || 'Political',
        severity: item.severity || 1,
        location: item.location || '',
        lat: item.lat ?? '',
        lon: item.lon ?? '',
        url: item.url || '',
        summary: item.details?.summary || '',
        status: item.status || 'published'
      });
    } else {
      setEditForm({
        title: item.title || '',
        category: item.category || 'Political',
        severity: item.severity || 1,
        location: item.location || '',
        latitude: item.lat ?? item.latitude ?? '',
        longitude: item.lon ?? item.longitude ?? '',
        source: item.source || item.details?.source || '',
        summary: item.details?.summary || item.summary || '',
        url: item.url || ''
      });
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const isRss = activeTab === 'rss' || editingItem.source_table === 'rss_items';
      const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: editingItem.id, ...editForm })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Record updated cleanly');
      setEditingItem(null);
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('event_updated', {
            detail: {
              id: editingItem.id,
              title: editForm.title,
              category: editForm.category,
              severity: parseInt(editForm.severity),
              location: editForm.location,
              lat: parseFloat(isRss ? editForm.latitude : editForm.lat),
              lon: parseFloat(isRss ? editForm.longitude : editForm.lon),
              url: editForm.url,
              preventFocus: true,
              details: { ...editingItem.details, isRssItem: isRss, summary: editForm.summary },
              summary: editForm.summary
            }
          })
        );
      }
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSave = async () => {
    if (!createForm.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const generatedId = `evt-${Date.now()}`;
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: generatedId, ...createForm })
      });
      if (!res.ok) throw new Error(await res.text());
      showToast('Signal published cleanly');
      setCreatingEvent(false);
      setCreateForm({ title: '', category: 'Political', severity: 2, location: '', lat: '', lon: '', url: '', summary: '', status: 'published' });
      fetchData();
      if (typeof window !== 'undefined' && createForm.status === 'published') {
        window.dispatchEvent(
          new CustomEvent('event_updated', {
            detail: {
              id: generatedId,
              title: createForm.title,
              category: createForm.category,
              severity: parseInt(createForm.severity),
              location: createForm.location,
              lat: parseFloat(createForm.lat) || 0,
              lon: parseFloat(createForm.lon) || 0,
              url: createForm.url,
              details: { isRssItem: false, summary: createForm.summary },
              summary: createForm.summary
            }
          })
        );
      }
    } catch (err) {
      showToast(`Create failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRunEngine = async () => {
    setRunningEngine(true);
    try {
      const res = await fetch('/api/admin/ingest', { method: 'POST', headers });
      if (!res.ok) throw new Error('OSINT Ingest failed');
      const d = await res.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      showToast('OSINT ingestion run completed');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRunningEngine(false);
    }
  };

  const handleArchive = async (item) => {
    if (!confirm(`Archive "${(item.title || '').slice(0, 60)}"?`)) return;
    try {
      const isRss = activeTab === 'rss' || item.source_table === 'rss_items';
      const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id, title: item.title || '', url: item.url || '' })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Moved to archive');
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('event_updated', { detail: { id: item.id, archived: true, title: item.title, url: item.url } }));
      }
    } catch (err) {
      showToast(`Archive failed: ${err.message}`, 'error');
    }
  };

  const handlePurge = async (item) => {
    if (!confirm(`Permanently purge "${(item.title || '').slice(0, 60)}" from the active tables?`)) return;
    try {
      const isRss = item.source_table === 'rss_items';
      const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id, permanent: true, title: item.title || '', url: item.url || '' })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Record purged');
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('event_updated', { detail: { id: item.id, archived: true, title: item.title, url: item.url } }));
      }
    } catch (err) {
      showToast(`Purge failed: ${err.message}`, 'error');
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
      showToast('Restored to live feed');
      fetchData();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('event_updated'));
    } catch (err) {
      showToast(`Restore failed: ${err.message}`, 'error');
    }
  };

  const handlePermanentArchiveDelete = async (item) => {
    if (!confirm(`Permanently delete archived record "${(item.title || '').slice(0, 60)}"?`)) return;
    try {
      const res = await fetch('/api/admin/archive', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Archived item removed');
      fetchData();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleFeedbackDelete = async (item) => {
    if (!confirm(`Resolve & delete feedback "${(item.subject || '').slice(0, 50)}"?`)) return;
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Feedback resolved');
      fetchData();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleUpdateUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'analyst' : 'admin';
    if (!confirm(`Change user role to ${newRole}?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: userId, role: newRole })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Role updated to ${newRole}`);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Permanently delete this user account?')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: userId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('User account deleted');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkAction = async (actionType) => {
    if (selectedAnomalyIds.size === 0) return;
    if (!confirm(`${actionType === 'purge' ? 'Permanently purge' : 'Archive'} ${selectedAnomalyIds.size} selected records?`)) return;
    setIsBulkOperating(true);
    try {
      let okCount = 0;
      for (const item of data.filter((d) => selectedAnomalyIds.has(d.id))) {
        const isRss = item.source_table === 'rss_items';
        const res = await fetch(isRss ? '/api/admin/rss' : '/api/admin/events', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ id: item.id, permanent: actionType === 'purge', title: item.title || '', url: item.url || '' })
        });
        if (res.ok) okCount++;
      }
      showToast(`Processed ${okCount} anomalies`);
      setSelectedAnomalyIds(new Set());
      fetchData();
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkResolveCoords = async () => {
    if (selectedAnomalyIds.size === 0) return;
    if (!confirm(`Mark ${selectedAnomalyIds.size} missing-coordinate items as Global (0, 0)?`)) return;
    setIsBulkOperating(true);
    try {
      let okCount = 0;
      for (const item of data.filter((d) => selectedAnomalyIds.has(d.id))) {
        const isRss = item.source_table === 'rss_items';
        const res = await fetch(isRss ? '/api/admin/rss' : '/api/admin/events', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            id: item.id,
            ...(isRss ? { latitude: 0, longitude: 0 } : { lat: 0, lon: 0 }),
            location: item.location || 'Global (Resolved)'
          })
        });
        if (res.ok) okCount++;
      }
      showToast(`Resolved coordinates on ${okCount} items`);
      setSelectedAnomalyIds(new Set());
      fetchData();
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleCorrectCoordsClick = (item) => {
    const rawTitle = (item.subject || '').replace('Incorrect Coordinates for: ', '').trim();
    const detailsStr = typeof item.details === 'string' ? item.details : item.details?.details || '';
    const match = detailsStr.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    setCoordsForm({
      targetId: item.targetId || item.target_id || '',
      title: rawTitle || 'Reported Signal',
      newLocation: '',
      newLat: match ? match[1] : '',
      newLon: match ? match[2] : ''
    });
    setCorrectingCoordsItem(item);
  };

  const handleSaveCoordsCorrection = async () => {
    if (!coordsForm.newLocation.trim()) {
      showToast('Location label is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const targetId = coordsForm.targetId;
      const isRss = targetId && (targetId.startsWith('rss-') || targetId.includes('http'));
      const endpoint = targetId && isRss ? '/api/admin/rss' : '/api/admin/events';
      const method = targetId ? 'PATCH' : 'POST';
      const payload = targetId
        ? isRss
          ? { id: targetId, location: coordsForm.newLocation, latitude: parseFloat(coordsForm.newLat), longitude: parseFloat(coordsForm.newLon) }
          : { id: targetId, location: coordsForm.newLocation, lat: parseFloat(coordsForm.newLat), lon: parseFloat(coordsForm.newLon) }
        : {
            id: `evt-${Date.now()}`,
            title: coordsForm.title,
            category: 'Political',
            severity: 3,
            location: coordsForm.newLocation,
            lat: parseFloat(coordsForm.newLat) || 0,
            lon: parseFloat(coordsForm.newLon) || 0,
            summary: 'Coordinate correction published via CMS.'
          };
      const res = await fetch(endpoint, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Coordinates updated');
      setCorrectingCoordsItem(null);
      fetchData();
    } catch (err) {
      showToast(`Correction failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const visibleRows = data.filter((item) => {
    if (activeTab !== 'diagnostics') return true;
    const type = String(item.anomalyType || '').toLowerCase();
    if (anomalyFilter === 'duplicates') return type.includes('duplicate');
    if (anomalyFilter === 'missing_coords') return type.includes('coord') || type.includes('missing');
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div
      className="sov-modal-shell"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(2, 6, 23, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        color: 'var(--sov-text)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          height: 'min(90vh, 860px)',
          background: 'var(--sov-panel-bg)',
          border: '1px solid var(--sov-border)',
          borderRadius: '14px',
          boxShadow: 'var(--sov-shadow, 0 24px 60px rgba(0, 0, 0, 0.55))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Top Bar */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '14px 18px',
            borderBottom: '1px solid var(--sov-border)',
            background: 'var(--sov-card-bg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} style={{ color: 'var(--sov-accent)' }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--sov-text)', letterSpacing: '0.02em' }}>
                Sovereign Observatory CMS
              </div>
              <div style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>
                Verified Signal Registry, Diagnostics &amp; Moderation Console · {total.toLocaleString()} records
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setCreatingEvent(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                background: 'rgba(16, 185, 129, 0.14)',
                color: 'var(--sov-emerald)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={13} />
              <span>New Signal</span>
            </button>

            <button
              type="button"
              onClick={handleRunEngine}
              disabled={runningEngine}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid var(--sov-border)',
                background: 'var(--sov-panel-bg)',
                color: 'var(--sov-sky)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} className={runningEngine ? 'animate-spin' : ''} />
              <span>{runningEngine ? 'Ingesting...' : 'Run OSINT Ingest'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close CMS"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '7px',
                border: '1px solid var(--sov-border)',
                background: 'var(--sov-panel-bg)',
                color: 'var(--sov-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Navigation Tabs + Search Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '12px 18px',
            borderBottom: '1px solid var(--sov-border)'
          }}
        >
          <div className="sov-subnav-scroll" style={{ flex: '1 1 420px' }}>
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '7px',
                    border: active ? '1px solid var(--sov-accent)' : '1px solid var(--sov-border)',
                    background: active ? 'var(--sov-card-bg)' : 'transparent',
                    color: active ? 'var(--sov-accent)' : 'var(--sov-text)',
                    fontSize: '11.5px',
                    fontWeight: active ? 800 : 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {['events', 'rss', 'accounts'].includes(activeTab) && (
            <div style={{ position: 'relative', flex: '0 1 280px', minWidth: '200px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sov-muted)' }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search title, location, email..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  borderRadius: '7px',
                  border: '1px solid var(--sov-border)',
                  background: 'var(--sov-card-bg)',
                  color: 'var(--sov-text)',
                  fontSize: '12px'
                }}
              />
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'duplicates', label: 'Duplicates' },
                { id: 'missing_coords', label: 'Missing Coords' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAnomalyFilter(f.id)}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '6px',
                    border: anomalyFilter === f.id ? '1px solid var(--sov-amber)' : '1px solid var(--sov-border)',
                    background: anomalyFilter === f.id ? 'var(--sov-card-bg)' : 'transparent',
                    color: anomalyFilter === f.id ? 'var(--sov-amber)' : 'var(--sov-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
              {selectedAnomalyIds.size > 0 && (
                <>
                  <button
                    type="button"
                    disabled={isBulkOperating}
                    onClick={handleBulkResolveCoords}
                    style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.12)', color: 'var(--sov-sky)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Resolve Coords ({selectedAnomalyIds.size})
                  </button>
                  <button
                    type="button"
                    disabled={isBulkOperating}
                    onClick={() => handleBulkAction('archive')}
                    style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(250,204,21,0.4)', background: 'rgba(250,204,21,0.12)', color: 'var(--sov-amber)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Archive ({selectedAnomalyIds.size})
                  </button>
                  <button
                    type="button"
                    disabled={isBulkOperating}
                    onClick={() => handleBulkAction('purge')}
                    style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.45)', background: 'rgba(244,63,94,0.14)', color: 'var(--sov-danger)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Purge ({selectedAnomalyIds.size})
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Toast Banner */}
        {toast && (
          <div
            style={{
              margin: '10px 18px 0',
              padding: '8px 12px',
              borderRadius: '7px',
              border: `1px solid ${toast.type === 'error' ? 'rgba(244,63,94,0.5)' : 'rgba(16,185,129,0.5)'}`,
              background: toast.type === 'error' ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
              color: toast.type === 'error' ? 'var(--sov-danger)' : 'var(--sov-emerald)',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            {toast.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Scrollable Content List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeTab === 'ai' ? (
            <AdminAiConsole currentUser={currentUser} onToast={showToast} />
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '48px', color: 'var(--sov-muted)', fontSize: '13px' }}>
              <Loader2 size={16} className="animate-spin" />
              <span>Loading registry records...</span>
            </div>
          ) : visibleRows.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--sov-muted)', fontSize: '13px', border: '1px dashed var(--sov-border)', borderRadius: '10px' }}>
              No records found for this view.
            </div>
          ) : (
            visibleRows.map((item, idx) => {
              const rowKey = item.id || `${activeTab}-${idx}`;
              if (activeTab === 'accounts') {
                return (
                  <div
                    key={rowKey}
                    style={{
                      background: 'var(--sov-card-bg)',
                      border: '1px solid var(--sov-border)',
                      borderRadius: '8px',
                      padding: '11px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--sov-text)' }}>
                        {item.name || item.email} <span style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>({item.email})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--sov-muted)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                        Role: <strong style={{ color: item.role === 'admin' ? 'var(--sov-amber)' : 'var(--sov-sky)' }}>{item.role || 'analyst'}</strong> · Tier: {item.tier || 'free'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateUserRole(item.id, item.role)}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-sky)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Toggle Role
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(item.id)}
                        style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.1)', color: 'var(--sov-danger)', fontSize: '11px', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              }

              if (activeTab === 'feedback') {
                return (
                  <div
                    key={rowKey}
                    style={{
                      background: 'var(--sov-card-bg)',
                      border: '1px solid var(--sov-border)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--sov-text)' }}>{item.subject || 'User Report'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--sov-muted)', marginTop: '3px', lineHeight: 1.5 }}>
                        {typeof item.details === 'string' ? item.details : item.details?.details || 'No additional notes'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleCorrectCoordsClick(item)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-sky)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        <MapPin size={12} /> Fix Coords
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedbackDelete(item)}
                        style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.1)', color: 'var(--sov-danger)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                );
              }

              const sevColor = SEV_COLORS[item.severity] || '#38bdf8';
              const latVal = item.lat ?? item.latitude;
              const lonVal = item.lon ?? item.longitude;

              return (
                <div
                  key={rowKey}
                  style={{
                    background: 'var(--sov-card-bg)',
                    border: '1px solid var(--sov-border)',
                    borderRadius: '8px',
                    padding: '11px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: '1 1 420px', minWidth: 0 }}>
                    {activeTab === 'diagnostics' && (
                      <input
                        type="checkbox"
                        checked={selectedAnomalyIds.has(item.id)}
                        onChange={() =>
                          setSelectedAnomalyIds((prev) => {
                            const next = new Set(prev);
                            next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                            return next;
                          })
                        }
                        style={{ marginTop: '4px', cursor: 'pointer' }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: sevColor, border: `1px solid ${sevColor}55`, padding: '1px 6px', borderRadius: '4px' }}>
                          SEV-{item.severity || 1} · {item.category || 'Political'}
                        </span>
                        {item.anomalyType && (
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-amber)' }}>
                            [{item.anomalyType}]
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>
                          {item.location || 'Global'} {latVal != null && lonVal != null ? `(${Number(latVal).toFixed(2)}, ${Number(lonVal).toFixed(2)})` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sov-text)', lineHeight: 1.35 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--sov-muted)', marginTop: '2px' }}>
                        {item.source || item.details?.source || 'Observatory'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {activeTab === 'archive' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRestore(item)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.45)', background: 'rgba(16,185,129,0.12)', color: 'var(--sov-emerald)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <RotateCcw size={12} /> Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentArchiveDelete(item)}
                          style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.1)', color: 'var(--sov-danger)', fontSize: '11px', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-sky)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(item)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(250,204,21,0.4)', background: 'rgba(250,204,21,0.1)', color: 'var(--sov-amber)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Archive size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePurge(item)}
                          style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.1)', color: 'var(--sov-danger)', fontSize: '11px', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 18px',
            borderTop: '1px solid var(--sov-border)',
            background: 'var(--sov-card-bg)',
            fontSize: '11.5px',
            fontFamily: 'var(--font-jetbrains-fallback)'
          }}
        >
          <span style={{ color: 'var(--sov-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)', opacity: page <= 1 ? 0.45 : 1, cursor: 'pointer' }}
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-panel-bg)', color: 'var(--sov-text)', opacity: page >= totalPages ? 0.45 : 1, cursor: 'pointer' }}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </footer>
      </div>

      {/* Shared Edit / Create / Coordinate Fix Modal */}
      {(editingItem || creatingEvent || correctingCoordsItem) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100005,
            background: 'rgba(2, 6, 23, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--sov-panel-bg)',
              border: '1px solid var(--sov-border)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--sov-text)' }}>
                {correctingCoordsItem ? 'Correct Signal Coordinates' : creatingEvent ? 'Publish New Observatory Signal' : 'Edit Signal Record'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setCreatingEvent(false);
                  setCorrectingCoordsItem(null);
                  setSuggestions([]);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--sov-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {correctingCoordsItem ? (
              <>
                <div style={{ fontSize: '12px', color: 'var(--sov-muted)' }}>{coordsForm.title}</div>
                <input
                  type="text"
                  placeholder="Search city or country to geocode..."
                  value={addressQuery}
                  onChange={(e) => {
                    setActiveSearchField('correct');
                    setAddressQuery(e.target.value);
                  }}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px' }}
                />
                {suggestions.length > 0 && activeSearchField === 'correct' && (
                  <div style={{ border: '1px solid var(--sov-border)', borderRadius: '6px', background: 'var(--sov-card-bg)' }}>
                    {suggestions.map((s) => (
                      <button
                        key={s.place_id}
                        type="button"
                        onClick={() => applySuggestion(s)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', borderBottom: '1px solid var(--sov-border)', background: 'transparent', color: 'var(--sov-text)', fontSize: '11.5px', cursor: 'pointer' }}
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Location Name"
                  value={coordsForm.newLocation}
                  onChange={(e) => setCoordsForm((p) => ({ ...p, newLocation: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Latitude"
                    value={coordsForm.newLat}
                    onChange={(e) => setCoordsForm((p) => ({ ...p, newLat: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px' }}
                  />
                  <input
                    type="text"
                    placeholder="Longitude"
                    value={coordsForm.newLon}
                    onChange={(e) => setCoordsForm((p) => ({ ...p, newLon: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px' }}
                  />
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveCoordsCorrection}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '7px', border: 'none', background: 'var(--sov-accent)', color: '#020617', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Coordinates'}
                </button>
              </>
            ) : (
              (() => {
                const isCreate = creatingEvent;
                const form = isCreate ? createForm : editForm;
                const setForm = isCreate ? setCreateForm : setEditForm;
                const isRss = !isCreate && (activeTab === 'rss' || editingItem?.source_table === 'rss_items');
                const latKey = isRss ? 'latitude' : 'lat';
                const lonKey = isRss ? 'longitude' : 'lon';

                return (
                  <>
                    <input
                      type="text"
                      placeholder="Headline / Title"
                      value={form.title || ''}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <select
                        value={form.category || 'Political'}
                        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px' }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select
                        value={form.severity || 2}
                        onChange={(e) => setForm((p) => ({ ...p, severity: Number(e.target.value) }))}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px' }}
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>Severity {s}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Autocomplete city/country via Nominatim..."
                      value={addressQuery}
                      onChange={(e) => {
                        setActiveSearchField(isCreate ? 'create' : 'edit');
                        setAddressQuery(e.target.value);
                      }}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
                    />
                    {isLoadingSuggestions && <div style={{ fontSize: '11px', color: 'var(--sov-muted)' }}>Searching coordinates...</div>}
                    {suggestions.length > 0 && activeSearchField === (isCreate ? 'create' : 'edit') && (
                      <div style={{ border: '1px solid var(--sov-border)', borderRadius: '6px', background: 'var(--sov-card-bg)' }}>
                        {suggestions.map((s) => (
                          <button
                            key={s.place_id}
                            type="button"
                            onClick={() => applySuggestion(s)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', borderBottom: '1px solid var(--sov-border)', background: 'transparent', color: 'var(--sov-text)', fontSize: '11.5px', cursor: 'pointer' }}
                          >
                            {s.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Location"
                        value={form.location || ''}
                        onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Lat"
                        value={form[latKey] ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, [latKey]: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Lon"
                        value={form[lonKey] ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, [lonKey]: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Verified Source URL (https://...)"
                      value={form.url || ''}
                      onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
                    />
                    <textarea
                      rows={3}
                      placeholder="Brief intelligence summary..."
                      value={form.summary || ''}
                      onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px', resize: 'vertical' }}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={isCreate ? handleCreateSave : handleSave}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '7px', border: 'none', background: 'var(--sov-accent)', color: '#020617', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                    >
                      <Save size={14} /> {saving ? 'Saving...' : isCreate ? 'Publish Signal' : 'Save Changes'}
                    </button>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
