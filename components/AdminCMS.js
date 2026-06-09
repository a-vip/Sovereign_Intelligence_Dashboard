'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Archive, RotateCcw, Trash2, Edit3, Save, MapPin, Loader2 } from 'lucide-react';

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
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', category: 'Political', severity: 1, location: '', lat: '', lon: '', url: '', summary: '', status: 'draft' });
  const [correctingCoordsItem, setCorrectingCoordsItem] = useState(null);
  const [coordsForm, setCoordsForm] = useState({ targetId: '', title: '', newLocation: '', newLat: '', newLon: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Geocoding & Autocomplete states
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState(null); // 'edit' | 'correct'
  const limit = 50;

  // Diagnostics and Bulk selection states
  const [selectedAnomalyIds, setSelectedAnomalyIds] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [anomalyFilter, setAnomalyFilter] = useState('all');
  const [moderationFilter, setModerationFilter] = useState('all');
  const [runningEngine, setRunningEngine] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

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
      else if (activeTab === 'diagnostics') url = `/api/admin/diagnostics`;
      else if (activeTab === 'accounts') url = `/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      else url = `/api/admin/archive?page=${page}&limit=${limit}`;

      const res = await fetch(url, { headers });
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
    setData([]);   // Clear stale data immediately on tab switch to prevent cross-tab render pollution
    setTotal(0);
  }, [activeTab, search]);

  useEffect(() => {
    setSelectedAnomalyIds(new Set());
  }, [activeTab]);

  // Debounced Nominatim suggestion geocoder search
  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&addressdetails=1&limit=6`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Sovereign-Intelligence-Dashboard/1.0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Nominatim suggestion fetch failed:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [addressQuery]);


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
        latitude: item.lat ?? '',
        longitude: item.lon ?? '',
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
      showToast('Item updated successfully');
      setEditingItem(null);
      fetchData();
      if (typeof window !== 'undefined') {
        const savedEvent = {
          id: editingItem.id,
          title: editForm.title,
          category: editForm.category,
          severity: parseInt(editForm.severity),
          location: editForm.location,
          lat: parseFloat(isRss ? editForm.latitude : editForm.lat),
          lon: parseFloat(isRss ? editForm.longitude : editForm.lon),
          url: editForm.url,
          preventFocus: true,
          details: {
            ...editingItem.details,
            isRssItem: isRss,
            summary: editForm.summary
          },
          summary: editForm.summary
        };
        window.dispatchEvent(new CustomEvent('event_updated', { detail: savedEvent }));
      }
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRunEngine = async () => {
    setRunningEngine(true);
    try {
      const res = await fetch('/api/admin/ingest', { method: 'POST', headers });
      if (!res.ok) throw new Error('OSINT Ingestion failed. See logs.');
      const d = await res.json();
      if (d.success) {
        showToast('Intel Engine completed successfully! Hard refresh to see new points.', 'success');
        fetchData();
      } else {
        throw new Error(d.error || 'Failed');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setRunningEngine(false);
    }
  };

  const handleUpdateUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'analyst' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: userId, role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      showToast('User role updated successfully');
      fetchData();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('WARNING: Are you sure you want to completely delete this user account? This cannot be undone.')) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: userId })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to delete user');
      showToast('User deleted successfully');
      fetchData();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleBulkMarkCoordinates = async () => {
    if (selectedAnomalyIds.size === 0) return;
    if (!confirm(`Are you sure you want to mark ${selectedAnomalyIds.size} missing coordinate anomalies as resolved?`)) return;
    setIsBulkOperating(true);
    try {
      let successCount = 0;
      for (const id of selectedAnomalyIds) {
        const item = data.find(i => i.id === id);
        if (!item) continue;
        const isRss = item.source_table === 'rss_items';
        const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ id: item.id, lat: 0.0, lon: 0.0, location: item.location || 'Global (Resolved)' })
        });
        if (res.ok) successCount++;
      }
      showToast(`Successfully resolved ${successCount} coordinates`, 'success');
      setSelectedAnomalyIds(new Set());
      fetchData();
    } catch (e) {
      showToast('Bulk operation encountered errors', 'error');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleCreateSave = async () => {
    if (!createForm.title) {
      showToast('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const generatedId = 'evt-' + Date.now();
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: generatedId, ...createForm })
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }
      showToast('Signal created successfully');
      setCreatingEvent(false);
      setCreateForm({ title: '', category: 'Political', severity: 1, location: '', lat: '', lon: '', url: '', summary: '', status: 'draft' });
      fetchData();
      
      // Hot-reload target live components if published
      if (typeof window !== 'undefined' && createForm.status === 'published') {
        const savedEvent = {
          id: generatedId,
          title: createForm.title,
          category: createForm.category,
          severity: parseInt(createForm.severity),
          location: createForm.location,
          lat: parseFloat(createForm.lat) || 0.0,
          lon: parseFloat(createForm.lon) || 0.0,
          url: createForm.url,
          details: {
            isRssItem: false,
            summary: createForm.summary
          },
          summary: createForm.summary
        };
        window.dispatchEvent(new CustomEvent('event_updated', { detail: savedEvent }));
      }
    } catch (err) {
      showToast('Failed to create: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (item) => {
    if (!confirm(`Archive "${item.title?.substring(0, 60)}..."?`)) return;
    try {
      const isRss = activeTab === 'rss' || item.source_table === 'rss_items';
      const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id, title: item.title || '', url: item.url || '' })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Item archived');
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('event_updated', { detail: { id: item.id, archived: true, title: item.title, url: item.url } }));
      }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('event_updated'));
      }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('event_updated'));
      }
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

  const handlePurge = async (item) => {
    if (!confirm(`PERMANENTLY PURGE "${item.title?.substring(0, 60)}..."? This will completely delete the record from the active database tables.`)) return;
    try {
      const isRss = item.source_table === 'rss_items';
      const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: item.id, permanent: true, title: item.title || '', url: item.url || '' })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Item permanently purged');
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('event_updated', { detail: { id: item.id, archived: true, title: item.title, url: item.url } }));
      }
    } catch (err) {
      showToast('Purge failed: ' + err.message, 'error');
    }
  };

  const getHashHue = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
  };

  const getRowStyle = (item) => {
    if (activeTab !== 'diagnostics') return {};
    
    const anomalyStr = (item.anomalyType || '').toLowerCase();
    const isDuplicate = anomalyStr.includes('duplicate');
    if (!isDuplicate) return { borderLeft: '4px solid rgba(255, 255, 255, 0.05)' };
    
    const normKey = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const hue = getHashHue(normKey);
    return {
      borderLeft: `4px solid hsl(${hue}, 85%, 55%)`,
      background: `hsla(${hue}, 85%, 50%, 0.03)`
    };
  };

  const toggleSelectAnomaly = (id) => {
    setSelectedAnomalyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFilteredAnomalies = (filteredAnomaliesOnPage) => {
    setSelectedAnomalyIds(prev => {
      const next = new Set(prev);
      const allSelectedOnPage = filteredAnomaliesOnPage.every(item => next.has(item.id));
      
      filteredAnomaliesOnPage.forEach(item => {
        if (allSelectedOnPage) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
      });
      return next;
    });
  };

  const handleBulkAction = async (actionType) => {
    const totalSelected = selectedAnomalyIds.size;
    if (totalSelected === 0) return;
    
    const confirmMsg = actionType === 'archive'
      ? `Are you sure you want to ARCHIVE all ${totalSelected} selected anomalies?`
      : `CRITICAL ACTION: Are you sure you want to PERMANENTLY PURGE all ${totalSelected} selected anomalies? This cannot be undone.`;
      
    if (!confirm(confirmMsg)) return;
    
    setIsBulkOperating(true);
    const successfullyProcessedItems = [];
    try {
      let successCount = 0;
      let failCount = 0;
      const selectedItems = data.filter(item => selectedAnomalyIds.has(item.id));
      
      for (const item of selectedItems) {
        try {
          const isRss = item.source_table === 'rss_items';
          const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
          const res = await fetch(endpoint, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({
              id: item.id,
              permanent: actionType === 'purge',
              title: item.title || '',
              url: item.url || ''
            })
          });
          if (res.ok) {
            successCount++;
            successfullyProcessedItems.push(item);
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Bulk action failed for item ${item.id}:`, err);
          failCount++;
        }
      }
      
      showToast(`Bulk operation complete: ${successCount} processed successfully. ${failCount > 0 ? `${failCount} failed.` : ''}`);
      setSelectedAnomalyIds(new Set());
      fetchData();
      
      if (typeof window !== 'undefined') {
        successfullyProcessedItems.forEach(item => {
          window.dispatchEvent(new CustomEvent('event_updated', { detail: { id: item.id, archived: true, title: item.title, url: item.url } }));
        });
      }
    } catch (err) {
      showToast('Bulk operation encountered an error: ' + err.message, 'error');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleCorrectCoordsClick = (item) => {
    const rawTitle = (item.subject || '').replace('Incorrect Coordinates for: ', '').trim();
    const detailsStr = typeof item.details === 'string' ? item.details : (item.details?.details || '');
    
    let detailsLat = '';
    let detailsLon = '';
    let detailsLocation = '';
    
    // Parse latitude & longitude (e.g. "51.5074, -0.1278")
    const coordsMatch = detailsStr.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordsMatch) {
      detailsLat = coordsMatch[1];
      detailsLon = coordsMatch[2];
      
      // Parse location name if trailing coordinate string: e.g. "51.5074, -0.1278, London"
      const afterCoordsPart = detailsStr.split(coordsMatch[0])[1] || '';
      const lineEndMatch = afterCoordsPart.match(/^\s*,\s*([^/\n\r\t]+)/);
      if (lineEndMatch) {
        detailsLocation = lineEndMatch[1].trim();
      }
    }
    
    setCoordsForm({
      targetId: item.targetId || item.target_id || '',
      title: rawTitle || 'Threat Marker Event',
      newLocation: detailsLocation || '',
      newLat: detailsLat || '',
      newLon: detailsLon || ''
    });
    
    setCorrectingCoordsItem(item);
  };

  const handleSaveCoordsCorrection = async () => {
    if (!coordsForm.newLocation || coordsForm.newLocation.trim() === '') {
      showToast('Location name is required', 'error');
      return;
    }
    
    setSaving(true);
    try {
      let targetId = coordsForm.targetId;
      let isNewNode = false;
      if (!targetId) {
        targetId = 'evt-' + Date.now();
        isNewNode = true;
      }

      let primaryEndpoint, primaryPayload;
      if (isNewNode) {
        primaryEndpoint = '/api/admin/events';
        const rawDetails = typeof correctingCoordsItem.details === 'string' 
          ? correctingCoordsItem.details 
          : (correctingCoordsItem.details?.details || correctingCoordsItem.details?.summary || '');
        primaryPayload = {
          id: targetId,
          title: coordsForm.title || correctingCoordsItem.subject || 'Suggested Threat Marker',
          category: correctingCoordsItem.category || 'Political',
          severity: parseInt(correctingCoordsItem.severity) || 3,
          location: coordsForm.newLocation || 'Global',
          lat: parseFloat(coordsForm.newLat),
          lon: parseFloat(coordsForm.newLon),
          summary: rawDetails || 'Created via suggestion coordinates correction.',
          url: correctingCoordsItem.url || ''
        };
      } else {
        const isRss = targetId.startsWith('rss-') || targetId.includes('http');
        primaryEndpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
        primaryPayload = isRss 
          ? { id: targetId, location: coordsForm.newLocation || undefined, latitude: parseFloat(coordsForm.newLat), longitude: parseFloat(coordsForm.newLon) }
          : { id: targetId, location: coordsForm.newLocation || undefined, lat: parseFloat(coordsForm.newLat), lon: parseFloat(coordsForm.newLon) };
      }

      // 1. Try to update coordinates on database
      let updateRes = await fetch(primaryEndpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(primaryPayload)
      });
      
      if (!updateRes.ok && !isNewNode) {
        // Fallback endpoint
        const isRss = targetId.startsWith('rss-') || targetId.includes('http');
        const fallbackEndpoint = isRss ? '/api/admin/events' : '/api/admin/rss';
        const fallbackPayload = isRss
          ? { id: targetId, location: coordsForm.newLocation || undefined, lat: parseFloat(coordsForm.newLat), lon: parseFloat(coordsForm.newLon) }
          : { id: targetId, location: coordsForm.newLocation || undefined, latitude: parseFloat(coordsForm.newLat), longitude: parseFloat(coordsForm.newLon) };

        updateRes = await fetch(fallbackEndpoint, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(fallbackPayload)
        });
      }
      
      if (!updateRes.ok) {
        throw new Error(isNewNode ? 'Failed to generate a new event node from suggestion.' : 'Target event/RSS node not found or failed to update in database.');
      }
      
      // 2. Automatically delete/resolve feedback suggeestion
      const deleteRes = await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: correctingCoordsItem.id })
      });
      
      if (!deleteRes.ok) {
        throw new Error('Coordinates successfully corrected, but failed to automatically resolve feedback report.');
      }
      
      showToast('Coordinates corrected & report resolved successfully!');
      setCorrectingCoordsItem(null);
      fetchData();
      
      // Dispatch refresh event to update the live globe instantly
      if (typeof window !== 'undefined') {
        const isRss = targetId.startsWith('rss-') || targetId.includes('http');
        const savedEvent = {
          id: targetId,
          location: coordsForm.newLocation || undefined,
          lat: parseFloat(coordsForm.newLat),
          lon: parseFloat(coordsForm.newLon),
          title: coordsForm.title || correctingCoordsItem.subject || 'Suggested Threat Marker',
          preventFocus: true,
          details: {
            isRssItem: isRss
          }
        };
        window.dispatchEvent(new CustomEvent('event_updated', { detail: savedEvent }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };


  const isNewItem = (item) => {
    const ageHours = (Date.now() - new Date(item.created_at || item.published_at || item.createdAt).getTime()) / (1000 * 60 * 60);
    return ageHours < 48 && !item.edited;
  };

  const isStaleItem = (item) => {
    const ageDays = (Date.now() - new Date(item.created_at || item.published_at || item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays > 30;
  };

  const getFilteredAnomalies = () => {
    return data.filter(item => {
      const matchesSearch = !search || 
        (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.id || '').toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      if (anomalyFilter === 'all') return true;
      if (anomalyFilter === 'coords') {
        return (item.anomalyType || '').toLowerCase().includes('coord') || (item.anomalyType || '').toLowerCase().includes('out of bounds');
      }
      if (anomalyFilter === 'duplicates') {
        return (item.anomalyType || '').toLowerCase().includes('duplicate');
      }
      if (anomalyFilter === 'missing') {
        return (item.anomalyType || '').toLowerCase().includes('missing') || (item.anomalyType || '').toLowerCase().includes('placeholder') || (item.anomalyType || '').toLowerCase().includes('too short');
      }
      if (anomalyFilter === 'broken') {
        return (item.anomalyType || '').toLowerCase().includes('broken') || (item.anomalyType || '').toLowerCase().includes('dead');
      }
      return true;
    });
  };

  const currentFilteredData = activeTab === 'diagnostics' 
    ? getFilteredAnomalies() 
    : data.filter(item => {
        if (moderationFilter === 'new') return isNewItem(item);
        if (moderationFilter === 'stale') return isStaleItem(item);
        return true;
      });

  const totalItems = (activeTab === 'diagnostics' || moderationFilter !== 'all') ? currentFilteredData.length : total;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const displayedItems = (activeTab === 'diagnostics' || moderationFilter !== 'all')
    ? currentFilteredData.slice((page - 1) * limit, page * limit)
    : data;

  const s = {
    overlay: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '8px' : '20px' },
    panel: { width: '100%', maxWidth: '1200px', height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100vh' : '90vh', background: '#0a0f1a', border: '1px solid rgba(0,240,255,0.2)', borderRadius: isMobile ? '0' : '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 60px rgba(0,240,255,0.08)', position: 'relative' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
    title: { fontSize: '16px', fontWeight: 800, letterSpacing: '1px', color: '#00f0ff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' },
    closeBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#8892a4', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    tabBar: { display: 'flex', gap: '4px', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, overflowX: isMobile ? 'auto' : 'visible', whiteSpace: isMobile ? 'nowrap' : 'normal', scrollbarWidth: 'none' },
    tab: (active) => ({ padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', background: active ? 'rgba(0,240,255,0.12)' : 'transparent', color: active ? '#00f0ff' : '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'all 0.15s ease', flexShrink: 0 }),
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
    editOverlay: { position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '20px' },
    editPanel: { width: '100%', maxWidth: '560px', maxHeight: isMobile ? '100vh' : '85vh', height: isMobile ? '100%' : 'auto', background: '#0c1220', border: '1px solid rgba(0,240,255,0.25)', borderRadius: isMobile ? '0' : '14px', overflowY: 'auto', boxShadow: '0 0 50px rgba(0,240,255,0.1)' },
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
          <div style={s.title}>
            <span style={{ fontSize: '18px' }}>⚙️</span> Sovereign CMS
            <button
              onClick={handleRunEngine}
              disabled={runningEngine}
              style={{
                marginLeft: '12px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '6px',
                color: '#38bdf8',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: runningEngine ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: runningEngine ? 0.6 : 1,
                textTransform: 'uppercase'
              }}
            >
              {runningEngine ? <Loader2 size={12} className="spin" /> : <RotateCcw size={12} />}
              {runningEngine ? 'Running...' : 'Run OSINT Engine'}
            </button>
          </div>
          <button style={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={s.tabBar}>
          <button style={s.tab(activeTab === 'events')} onClick={() => setActiveTab('events')}>Live Events</button>
          <button style={s.tab(activeTab === 'rss')} onClick={() => setActiveTab('rss')}>RSS Feed</button>
          <button style={s.tab(activeTab === 'archive')} onClick={() => setActiveTab('archive')}>Archive</button>
          <button style={s.tab(activeTab === 'feedback')} onClick={() => setActiveTab('feedback')}>Feedback</button>
          <button style={s.tab(activeTab === 'diagnostics')} onClick={() => setActiveTab('diagnostics')}>🚨 Anomalies</button>
          <button style={s.tab(activeTab === 'accounts')} onClick={() => setActiveTab('accounts')}>👥 Accounts</button>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            {totalItems} items
          </div>
        </div>

        {/* Search */}
        {activeTab !== 'archive' && activeTab !== 'feedback' && (
          <div style={s.searchBar}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <input
                style={s.searchInput}
                placeholder={activeTab === 'diagnostics' ? "Search anomalies by title, location, or ID..." : "Search by title..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {activeTab === 'events' && (
              <button 
                onClick={() => setCreatingEvent(true)}
                style={{
                  background: 'rgba(0, 240, 255, 0.15)',
                  border: '1px solid rgba(0, 240, 255, 0.4)',
                  borderRadius: '8px',
                  color: '#00f0ff',
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#00f0ff';
                  e.currentTarget.style.color = '#000000';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)';
                  e.currentTarget.style.color = '#00f0ff';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                + Create Signal
              </button>
            )}
            {(activeTab === 'events' || activeTab === 'rss') && (
              <select 
                style={{
                  background: '#0c1220',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  borderRadius: '8px',
                  color: '#00f0ff',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
                value={moderationFilter}
                onChange={e => { setModerationFilter(e.target.value); setPage(1); }}
              >
                <option value="all">🟢 All Statuses</option>
                <option value="new">🆕 New (Needs Review)</option>
                <option value="stale">⏳ Stale (Archive Candidates)</option>
              </select>
            )}
            {activeTab === 'diagnostics' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  style={{
                    background: '#0c1220',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '8px',
                    color: '#00f0ff',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  value={anomalyFilter}
                  onChange={e => { setAnomalyFilter(e.target.value); setPage(1); }}
                >
                  <option value="all">🚨 All Anomalies</option>
                  <option value="coords">📍 Coordinate Violations</option>
                  <option value="duplicates">👯 Fuzzy Duplicates</option>
                  <option value="missing">📝 Missing / Placeholder Info</option>
                  <option value="broken">🔗 Dead Source Links</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Table body */}
        <div style={s.body}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Loading data...
            </div>
          ) : displayedItems.length === 0 ? (
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
                ) : activeTab === 'accounts' ? (
                  <tr>
                    <th style={s.th}>Email</th>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Role</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Joined</th>
                    <th style={{...s.th, textAlign: 'right'}}>Actions</th>
                  </tr>
                ) : activeTab === 'diagnostics' ? (
                  <tr>
                    <th style={{...s.th, width: '40px', textAlign: 'center'}}>
                      <input 
                        type="checkbox"
                        checked={displayedItems.length > 0 && displayedItems.every(item => selectedAnomalyIds.has(item.id))}
                        onChange={() => selectAllFilteredAnomalies(displayedItems)}
                        style={{ cursor: 'pointer', accentColor: '#00f0ff' }}
                      />
                    </th>
                    <th style={s.th}>Origin</th>
                    <th style={{...s.th, maxWidth: '350px'}}>Telemetry details & Issues</th>
                    <th style={s.th}>Cat/Sev</th>
                    <th style={s.th}>Location / Coordinates</th>
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
                {displayedItems.map(item => (
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
                        {true && (
                          <button 
                            style={{ 
                              background: 'rgba(0, 240, 255, 0.1)', 
                              border: '1px solid rgba(0, 240, 255, 0.3)', 
                              borderRadius: '6px', 
                              color: '#00f0ff', 
                              cursor: 'pointer', 
                              padding: '5px 10px', 
                              fontSize: '9px', 
                              fontWeight: 'bold', 
                              fontFamily: 'monospace', 
                              marginRight: '8px', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }} 
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#00f0ff';
                              e.currentTarget.style.color = '#000000';
                              e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.4)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                              e.currentTarget.style.color = '#00f0ff';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => handleCorrectCoordsClick(item)} 
                            title="Correct coordinates and resolve"
                          >
                            <MapPin size={10} /> CORRECT LOCATION
                          </button>
                        )}
                        <button style={s.actionBtn('#ff2d55')} onClick={() => handleFeedbackDelete(item)} title="Delete / Resolve"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ) : activeTab === 'accounts' ? (
                    <tr key={item.id} style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,240,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{...s.td, color: '#e8edf5', fontWeight: 600}}>{item.email}</td>
                      <td style={s.td}>{item.full_name}</td>
                      <td style={s.td}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          letterSpacing: '0.5px',
                          background: item.role === 'admin' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: item.role === 'admin' ? '#38bdf8' : '#8892a4'
                        }}>
                          {(item.role || 'user').toUpperCase()}
                        </span>
                      </td>
                      <td style={{...s.td, fontSize: '11px', color: item.is_verified ? '#22c55e' : '#f59e0b'}}>
                        {item.is_verified ? 'VERIFIED' : 'PENDING'}
                      </td>
                      <td style={{...s.td, fontSize: '11px', color: '#64748b'}}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{...s.td, textAlign: 'right', whiteSpace: 'nowrap'}}>
                        <button style={s.actionBtn('#00f0ff')} onClick={() => handleUpdateUserRole(item.id, item.role)} title="Toggle Role (Admin / Analyst)">🛡️</button>
                        <button style={s.actionBtn('#ff2d55')} onClick={() => handleDeleteUser(item.id)} title="Delete User Account Permanently"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ) : activeTab === 'diagnostics' ? (
                    <tr key={item.id} style={{ 
                      transition: 'background 0.15s',
                      ...getRowStyle(item)
                    }}
                        onMouseEnter={e => {
                          const normKey = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                          const isDuplicate = (item.anomalyType || '').toLowerCase().includes('duplicate');
                          if (isDuplicate) {
                            const hue = getHashHue(normKey);
                            e.currentTarget.style.background = `hsla(${hue}, 85%, 50%, 0.08)`;
                          } else {
                            e.currentTarget.style.background = 'rgba(0,240,255,0.03)';
                          }
                        }}
                        onMouseLeave={e => {
                          const normKey = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                          const isDuplicate = (item.anomalyType || '').toLowerCase().includes('duplicate');
                          if (isDuplicate) {
                            const hue = getHashHue(normKey);
                            e.currentTarget.style.background = `hsla(${hue}, 85%, 50%, 0.03)`;
                          } else {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}>
                      <td style={{...s.td, textAlign: 'center', verticalAlign: 'middle', width: '40px'}}>
                        <input 
                          type="checkbox"
                          checked={selectedAnomalyIds.has(item.id)}
                          onChange={() => toggleSelectAnomaly(item.id)}
                          style={{ cursor: 'pointer', accentColor: '#00f0ff' }}
                        />
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 800,
                            textAlign: 'center',
                            background: item.source_table === 'rss_items' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                            color: item.source_table === 'rss_items' ? '#38bdf8' : '#00f0ff',
                            letterSpacing: '0.5px'
                          }}>
                            {item.source_table === 'rss_items' ? 'RSS WIRE' : 'LIVE SIGNAL'}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#64748b' }}>
                            {item.id?.substring(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td style={{...s.td, maxWidth: '400px', whiteSpace: 'normal'}}>
                        <div style={{ fontWeight: 700, color: '#e8edf5', fontSize: '13px', marginBottom: '6px' }}>
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                          {(item.anomalyType || '').split(/;\s*/).map((issue, idx) => {
                            if (!issue) return null;
                            const isCritical = issue.toLowerCase().includes('nan') || issue.toLowerCase().includes('default') || issue.toLowerCase().includes('out of bounds') || issue.toLowerCase().includes('broken');
                            return (
                              <span key={idx} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: 700,
                                background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: isCritical ? '#ef4444' : '#facc15',
                                border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                              }}>
                                ⚠️ {issue}
                              </span>
                            );
                          })}
                        </div>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: '#38bdf8', textDecoration: 'none', display: 'inline-block', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                             onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                             onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            🔗 {item.url}
                          </a>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600 }}>{item.category || '—'}</span>
                          <span style={s.sevBadge(item.severity || 1)}>{SEV_LABELS[item.severity] || 'LOW'}</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#e8edf5' }}>{item.location || '—'}</span>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            color: (parseFloat(item.lat) === 0.0 && parseFloat(item.lon) === 0.0) || isNaN(parseFloat(item.lat)) ? '#ef4444' : '#64748b'
                          }}>
                            {isNaN(parseFloat(item.lat)) ? 'NaN, NaN' : `${parseFloat(item.lat).toFixed(4)}, ${parseFloat(item.lon).toFixed(4)}`}
                          </span>
                        </div>
                      </td>
                      <td style={{...s.td, textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle'}}>
                        <button style={s.actionBtn('#00f0ff')} onClick={() => handleEdit(item)} title="Edit & Geocode"><Edit3 size={14} /></button>
                        <button style={s.actionBtn('#facc15')} onClick={() => handleArchive(item)} title="Archive Record"><Archive size={14} /></button>
                        <button style={s.actionBtn('#ff2d55')} onClick={() => handlePurge(item)} title="Purge Record Permanently"><Trash2 size={14} /></button>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.status === 'draft' && (
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: 800,
                              background: 'rgba(250, 204, 21, 0.15)',
                              color: '#facc15',
                              border: '1px solid rgba(250, 204, 21, 0.3)',
                              letterSpacing: '0.5px',
                              flexShrink: 0
                            }}>DRAFT</span>
                          )}
                          <span>{item.title?.substring(0, 80)}{item.title?.length > 80 ? '...' : ''}</span>
                          {isNewItem(item) && <span style={{ marginLeft: '6px', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800, background: '#38bdf8', color: '#000', flexShrink: 0 }}>NEW</span>}
                          {isStaleItem(item) && <span style={{ marginLeft: '6px', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800, background: '#f59e0b', color: '#000', flexShrink: 0 }}>STALE</span>}
                        </div>
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

        {/* Bulk Action Overlay Panel */}
        {activeTab === 'diagnostics' && selectedAnomalyIds.size > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(12, 18, 32, 0.95)',
            border: '2px dashed #00f0ff',
            borderRadius: '12px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 0 30px rgba(0,240,255,0.25)',
            zIndex: 100,
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#e8edf5', letterSpacing: '0.5px' }}>
              ⚡ {selectedAnomalyIds.size} {selectedAnomalyIds.size === 1 ? 'ANOMALY' : 'ANOMALIES'} SELECTED
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                disabled={isBulkOperating}
                onClick={() => handleBulkAction('archive')}
                style={{
                  background: 'rgba(250, 204, 21, 0.15)',
                  border: '1px solid rgba(250, 204, 21, 0.4)',
                  borderRadius: '6px',
                  color: '#facc15',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(250, 204, 21, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(250, 204, 21, 0.15)'}
              >
                📦 BULK ARCHIVE
              </button>
              <button 
                disabled={isBulkOperating}
                onClick={() => handleBulkAction('purge')}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
              >
                🗑️ BULK PURGE
              </button>
              <button 
                onClick={() => setSelectedAnomalyIds(new Set())}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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

            {activeTab !== 'rss' && editingItem?.source_table !== 'rss_items' && (
              <div style={s.fieldGroup}>
                <div style={s.fieldLabel}>Status</div>
                <select style={s.fieldSelect} value={editForm.status || 'published'} onChange={e => setEditForm(f => ({...f, status: e.target.value}))}>
                  <option value="draft">📁 DRAFT (Invisible on Dashboard)</option>
                  <option value="published">🟢 PUBLISHED (Live on Dashboard)</option>
                </select>
              </div>
            )}

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

            <div style={{...s.fieldGroup, position: 'relative'}}>
              <div style={s.fieldLabel}><MapPin size={10} style={{ display: 'inline', marginRight: '4px' }} />Location</div>
              <div style={{ position: 'relative' }}>
                <input 
                  style={s.fieldInput} 
                  value={editForm.location || ''} 
                  onChange={e => {
                    const val = e.target.value;
                    setEditForm(f => ({...f, location: val}));
                    setAddressQuery(val);
                    setActiveSearchField('edit');
                  }} 
                />
                {isLoadingSuggestions && activeSearchField === 'edit' && (
                  <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#00f0ff' }} />
                )}
              </div>

              {suggestions.length > 0 && activeSearchField === 'edit' && (
                <div style={{
                  position: 'absolute',
                  top: '55px',
                  left: 0,
                  right: 0,
                  backgroundColor: '#0f141e',
                  border: '1px solid rgba(0,240,255,0.25)',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                  zIndex: 10000,
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {suggestions.map((item, idx) => {
                    const nameSegments = item.display_name.split(',');
                    const cleanName = nameSegments.length > 3 
                      ? `${nameSegments[0].trim()}, ${nameSegments[1].trim()}, ${nameSegments[nameSegments.length - 1].trim()}` 
                      : item.display_name;

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          setEditForm(f => {
                            const next = { ...f, location: cleanName };
                            if (activeTab === 'rss') {
                              next.latitude = parseFloat(item.lat);
                              next.longitude = parseFloat(item.lon);
                            } else {
                              next.lat = parseFloat(item.lat);
                              next.lon = parseFloat(item.lon);
                            }
                            return next;
                          });
                          setAddressQuery('');
                          setSuggestions([]);
                          setActiveSearchField(null);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background-color 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{cleanName}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.display_name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#00f0ff', fontFamily: 'monospace', marginTop: '2px' }}>
                          COORD: {parseFloat(item.lat).toFixed(4)}N, {parseFloat(item.lon).toFixed(4)}E
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>



            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {creatingEvent && (
        <div style={s.editOverlay} onClick={(e) => { if (e.target === e.currentTarget) setCreatingEvent(false); }}>
          <div style={{...s.editPanel, border: '1px solid rgba(0, 240, 255, 0.4)', boxShadow: '0 0 50px rgba(0, 240, 255, 0.15)'}}>
            <div style={{...s.editHeader, background: 'rgba(0, 240, 255, 0.03)'}}>
              <div style={{...s.editTitle, color: '#00f0ff'}}><span style={{ marginRight: '6px' }}>➕</span> Create New Threat Signal</div>
              <button style={s.closeBtn} onClick={() => setCreatingEvent(false)}><X size={16} /></button>
            </div>

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>Title</div>
              <input style={s.fieldInput} placeholder="e.g. IDF Lavender AI targeting system deployment" value={createForm.title || ''} onChange={e => setCreateForm(f => ({...f, title: e.target.value}))} />
            </div>

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>Summary</div>
              <textarea style={s.fieldTextarea} placeholder="Enter a comprehensive intelligence brief of the event..." value={createForm.summary || ''} onChange={e => setCreateForm(f => ({...f, summary: e.target.value}))} />
            </div>

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>URL / Reference Source</div>
              <input style={s.fieldInput} placeholder="e.g. https://www.972mag.com/lavender-ai-israeli-army-gaza/" value={createForm.url || ''} onChange={e => setCreateForm(f => ({...f, url: e.target.value}))} />
            </div>

            <div style={s.coordRow}>
              <div>
                <div style={s.fieldLabel}>Category</div>
                <select style={s.fieldSelect} value={createForm.category || 'Political'} onChange={e => setCreateForm(f => ({...f, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={s.fieldLabel}>Severity</div>
                <select style={s.fieldSelect} value={createForm.severity || 1} onChange={e => setCreateForm(f => ({...f, severity: parseInt(e.target.value)}))}>
                  {SEVERITIES.map(sv => <option key={sv} value={sv}>{sv} — {SEV_LABELS[sv]}</option>)}
                </select>
              </div>
            </div>

            <div style={{...s.fieldGroup, position: 'relative'}}>
              <div style={s.fieldLabel}><MapPin size={10} style={{ display: 'inline', marginRight: '4px' }} />Location Search & Autocomplete</div>
              <div style={{ position: 'relative' }}>
                <input 
                  style={s.fieldInput} 
                  placeholder="Type an address or city to search via OpenStreetMap Nominatim..."
                  value={createForm.location || ''} 
                  onChange={e => {
                    const val = e.target.value;
                    setCreateForm(f => ({...f, location: val}));
                    setAddressQuery(val);
                    setActiveSearchField('create');
                  }} 
                />
                {isLoadingSuggestions && activeSearchField === 'create' && (
                  <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#00f0ff' }} />
                )}
              </div>

              {suggestions.length > 0 && activeSearchField === 'create' && (
                <div style={{
                  position: 'absolute',
                  top: '55px',
                  left: 0,
                  right: 0,
                  backgroundColor: '#0f141e',
                  border: '1px solid rgba(0,240,255,0.25)',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                  zIndex: 10000,
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {suggestions.map((item, idx) => {
                    const nameSegments = item.display_name.split(',');
                    const cleanName = nameSegments.length > 3 
                      ? `${nameSegments[0].trim()}, ${nameSegments[1].trim()}, ${nameSegments[nameSegments.length - 1].trim()}` 
                      : item.display_name;

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          setCreateForm(f => ({
                            ...f,
                            location: cleanName,
                            lat: parseFloat(item.lat),
                            lon: parseFloat(item.lon)
                          }));
                          setAddressQuery('');
                          setSuggestions([]);
                          setActiveSearchField(null);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background-color 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{cleanName}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.display_name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#00f0ff', fontFamily: 'monospace', marginTop: '2px' }}>
                          COORD: {parseFloat(item.lat).toFixed(4)}N, {parseFloat(item.lon).toFixed(4)}E
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={s.coordRow}>
              <div>
                <div style={s.fieldLabel}>Latitude</div>
                <input style={s.fieldInput} placeholder="0.0" value={createForm.lat ?? ''} onChange={e => setCreateForm(f => ({...f, lat: e.target.value}))} />
              </div>
              <div>
                <div style={s.fieldLabel}>Longitude</div>
                <input style={s.fieldInput} placeholder="0.0" value={createForm.lon ?? ''} onChange={e => setCreateForm(f => ({...f, lon: e.target.value}))} />
              </div>
            </div>

            <div style={s.fieldGroup}>
              <div style={s.fieldLabel}>Operational Feed Status</div>
              <select style={s.fieldSelect} value={createForm.status || 'draft'} onChange={e => setCreateForm(f => ({...f, status: e.target.value}))}>
                <option value="draft">📁 KEEP AS DRAFT (Invisible on Dashboard)</option>
                <option value="published">🟢 PUBLISH LIVE (Instant Overlay sync)</option>
              </select>
            </div>

            <button 
              style={{
                ...s.saveBtn,
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: '#00f0ff',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)',
                marginTop: '24px',
                transition: 'all 0.2s',
                width: 'calc(100% - 40px)',
                margin: '16px auto',
                display: 'flex'
              }} 
              onMouseEnter={e => {
                e.currentTarget.style.background = '#00f0ff';
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)';
                e.currentTarget.style.color = '#00f0ff';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={handleCreateSave} 
              disabled={saving}
            >
              <Save size={14} /> {saving ? 'SAVING SIGNAL...' : 'SAVE TACTICAL SIGNAL'}
            </button>
          </div>
        </div>
      )}

      {/* Coordinate Correction Modal */}
      {correctingCoordsItem && (
        <div style={s.editOverlay} onClick={(e) => { if (e.target === e.currentTarget) setCorrectingCoordsItem(null); }}>
          <div style={{...s.editPanel, border: '1px solid rgba(0, 240, 255, 0.45)', boxShadow: '0 0 50px rgba(0, 240, 255, 0.2)'}}>
            {/* Header */}
            <div style={{...s.editHeader, background: 'rgba(0, 240, 255, 0.03)'}}>
              <div style={{...s.editTitle, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <MapPin size={16} /> Coordinate Correction Hub
              </div>
              <button style={s.closeBtn} onClick={() => setCorrectingCoordsItem(null)}><X size={16} /></button>
            </div>

            {/* Event Context Box */}
            <div style={{ margin: '16px 20px', padding: '12px 16px', background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.15)', borderRadius: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(0, 240, 255, 0.6)', letterSpacing: '0.5px', marginBottom: '4px', textTransform: 'uppercase' }}>
                TARGET DOSSIER
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8edf5', lineHeight: 1.4 }}>
                {coordsForm.title}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', marginTop: '6px' }}>
                NODE ID: {coordsForm.targetId}
              </div>
            </div>

            {/* Instruction Warning */}
            <div style={{ margin: '0 20px 16px 20px', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', fontSize: '11px', color: '#facc15', lineHeight: 1.4 }}>
              <strong>Operational Command:</strong> Entering new coordinates below will instantly update the persistent database record and hot-reload the tactical globe feed.
            </div>

            {/* Form Fields */}
            <div style={{...s.fieldGroup, position: 'relative'}}>
              <div style={s.fieldLabel}>Corrected Location Name</div>
              <div style={{ position: 'relative' }}>
                <input 
                  style={s.fieldInput} 
                  placeholder="e.g. London, United Kingdom" 
                  value={coordsForm.newLocation} 
                  onChange={e => {
                    const val = e.target.value;
                    setCoordsForm(f => ({...f, newLocation: val}));
                    setAddressQuery(val);
                    setActiveSearchField('correct');
                  }} 
                />
                {isLoadingSuggestions && activeSearchField === 'correct' && (
                  <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#00f0ff' }} />
                )}
              </div>

              {suggestions.length > 0 && activeSearchField === 'correct' && (
                <div style={{
                  position: 'absolute',
                  top: '55px',
                  left: 0,
                  right: 0,
                  backgroundColor: '#0f141e',
                  border: '1px solid rgba(0,240,255,0.25)',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                  zIndex: 10000,
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {suggestions.map((item, idx) => {
                    const nameSegments = item.display_name.split(',');
                    const cleanName = nameSegments.length > 3 
                      ? `${nameSegments[0].trim()}, ${nameSegments[1].trim()}, ${nameSegments[nameSegments.length - 1].trim()}` 
                      : item.display_name;

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          setCoordsForm(f => ({
                            ...f,
                            newLocation: cleanName,
                            newLat: parseFloat(item.lat),
                            newLon: parseFloat(item.lon)
                          }));
                          setAddressQuery('');
                          setSuggestions([]);
                          setActiveSearchField(null);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background-color 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{cleanName}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.display_name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#00f0ff', fontFamily: 'monospace', marginTop: '2px' }}>
                          COORD: {parseFloat(item.lat).toFixed(4)}N, {parseFloat(item.lon).toFixed(4)}E
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>



            {/* Submit Action */}
            <button 
              style={{
                ...s.saveBtn,
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: '#00f0ff',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)',
                marginTop: '24px',
                transition: 'all 0.2s'
              }} 
              onMouseEnter={e => {
                e.currentTarget.style.background = '#00f0ff';
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)';
                e.currentTarget.style.color = '#00f0ff';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.1)';
              }}
              onClick={handleSaveCoordsCorrection} 
              disabled={saving}
            >
              <Save size={14} /> {saving ? 'APPLYING CORRECTION...' : 'APPLY CORRECTION & RESOLVE'}
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

