'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Edit3,
  X,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Save,
  Archive,
  Trash2,
  Loader2,
  Check,
  Search,
  Server,
  Scale,
  Database,
  Building2,
  ShieldAlert
} from 'lucide-react';
import CitationProvenanceCard from './CitationProvenanceCard';
import { computeAdmiraltyGrade, normalizeSignalId } from '@/lib/provenance';
import { classifyMitRiskDomain } from '@/lib/mitRiskTaxonomy';

const CAT_COLORS = {
  Conflict: '#ff2d55',
  Surveillance: '#00f0ff',
  Political: '#a855f7',
  Humanitarian: '#22c55e',
  Economic: '#facc15',
  Disaster: '#ff6b35'
};

const SEV_COLORS = { 1: '#38bdf8', 2: '#22c55e', 3: '#facc15', 4: '#ff6b35', 5: '#ff2d55' };

const ETHICS_HEADER = {
  censorship: { label: 'Internet Censorship', color: '#f43f5e' },
  environmental: { label: 'Environmental Justice', color: '#38bdf8' },
  supply_chain: { label: 'AI Supply Chain', color: '#f59e0b' },
  biometric_welfare: { label: 'Biometrics & Welfare', color: '#a855f7' },
  ai_labor: { label: 'AI Labor & RLHF', color: '#ec4899' }
};

function formatTime(ts) {
  if (!ts) return '';
  let d;
  if (typeof ts === 'string') {
    const clean = ts.trim();
    if (/^\d{14}$/.test(clean)) {
      d = new Date(clean.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));
    } else if (/^\d{8}T\d{6}Z$/.test(clean)) {
      d = new Date(clean.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
    } else {
      d = new Date(clean);
    }
  } else {
    d = new Date(ts);
  }
  if (isNaN(d.getTime())) return String(ts);
  const diff = Date.now() - d.getTime();
  if (diff >= 0 && diff < 60000) return 'Just now';
  if (diff >= 0 && diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff >= 0 && diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function cleanRegulationDisplay(event) {
  const rawDesc = String(event?.description || '')
    .replace(/\u00a0/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, ' ');
  const urlMatch = rawDesc.match(/https?:\/\/[^\s"'<>)\]]+/i);
  const extractedUrl = urlMatch ? urlMatch[0].replace(/[.,;:'")]+$/, '') : null;
  const resolvedUrl = event?.url || extractedUrl || `https://oecd.ai/en/dashboards/policy-initiatives?q=${encodeURIComponent(String(event?.title || '').slice(0, 80))}`;
  const cleanExcerpt = rawDesc
    .replace(/This maps the AI regulation tracking for[\s\S]*$/i, '')
    .replace(/^Official Source \/ Legislation:\s*(?:Strategy:)?\s*/i, '')
    .replace(extractedUrl || '', '')
    .replace(/^[•:\-\s]+|[•:\-\s]+$/g, '')
    .trim();
  const cleanSummary = event?.summary || (cleanExcerpt.length >= 20 ? cleanExcerpt : `${event?.title || 'Regulation'} tracked under ${event?.jurisdiction || 'National'} governance (${event?.area || 'General'} · ${event?.status || 'Policy'}).`);
  return { resolvedUrl, cleanSummary, hasDirectUrl: Boolean(event?.urlType === 'direct' || extractedUrl) };
}

function InfoCell({ label, value, color = 'var(--sov-text)' }) {
  return (
    <div style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '6px', padding: '7px 9px', minWidth: 0 }}>
      <div style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-muted)', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '11.5px', fontWeight: 700, color, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(value || '')}>
        {value || '—'}
      </div>
    </div>
  );
}

export default function EventDetailsWindow({
  event,
  onClose,
  onReportIssue,
  currentUser,
  onEventUpdate,
  onFocusLocation,
  isBookmarked = false,
  onToggleBookmark = null
}) {
  const [activeUser, setActiveUser] = useState(currentUser || null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('operator_session');
      const parsed = stored ? JSON.parse(stored) : null;
      if (currentUser?.role === 'admin' || currentUser?.email === 'workwithavip@gmail.com') {
        setActiveUser(currentUser);
      } else if (parsed?.role === 'admin' || parsed?.email === 'workwithavip@gmail.com') {
        setActiveUser(parsed);
      } else {
        setActiveUser(currentUser || parsed);
      }
    } catch {
      setActiveUser(currentUser);
    }
  }, [currentUser]);

  const isAdmin = Boolean(
    currentUser?.role === 'admin' ||
      currentUser?.email === 'workwithavip@gmail.com' ||
      activeUser?.role === 'admin' ||
      activeUser?.email === 'workwithavip@gmail.com'
  );

  const [pos, setPos] = useState({ x: 100, y: 84 });
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const mobile = window.innerWidth < 680;
      setIsMobile(mobile);
      if (mobile) {
        setPos({
          x: 10,
          y: Math.max(58, Math.round(window.innerHeight * 0.22))
        });
      } else {
        setPos({
          x: Math.max(24, Math.min(window.innerWidth - 460, Math.round(window.innerWidth / 2 - 210))),
          y: 82
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target?.closest?.('button, a, input, select, textarea')) return;
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
  };

  const handleDragMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const panelW = vw < 680 ? Math.min(420, vw - 20) : 420;
      setPos({
        x: Math.max(6, Math.min(Math.max(6, vw - panelW - 6), dragRef.current.startPosX + (e.clientX - dragRef.current.startX))),
        y: Math.max(50, Math.min(Math.max(50, vh - 88), dragRef.current.startPosY + (e.clientY - dragRef.current.startY)))
      });
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('pointermove', handleDragMove, { passive: true });
    window.addEventListener('pointerup', handleDragEnd);
    window.addEventListener('pointercancel', handleDragEnd);
    return () => {
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('pointercancel', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const isDataCenter = Boolean(event?.isDataCenter);
  const isRegulation = Boolean(!isDataCenter && (event?.isAiRegulation || (event?.jurisdiction && event?.area && (event?.description || event?.summary))));
  const isEthicsOverlay = Boolean(!isDataCenter && !isRegulation && event?.isEthicsOverlay);
  const isTemporalMilestone = Boolean(!isDataCenter && !isRegulation && !isEthicsOverlay && event?.isTemporalMilestone);
  const isOsintSignal = !isDataCenter && !isRegulation && !isEthicsOverlay && !isTemporalMilestone;

  const [dcEnrich, setDcEnrich] = useState({ loading: false, data: null });

  useEffect(() => {
    if (!isDataCenter || event?.isFrontierCluster) {
      setDcEnrich({ loading: false, data: null });
      return;
    }
    const ctrl = new AbortController();
    setDcEnrich({ loading: true, data: null });
    const q = new URLSearchParams({
      enrich: '1',
      name: String(event?.title || event?.name || ''),
      lat: event?.lat != null ? String(event.lat) : '',
      lon: event?.lon != null ? String(event.lon) : '',
      operator: String(event?.operator || ''),
      country: String(event?.country || '')
    });
    fetch(`/api/datacenters?${q.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!ctrl.signal.aborted) {
          setDcEnrich({ loading: false, data: d?.enriched || null });
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setDcEnrich({ loading: false, data: null });
      });
    return () => ctrl.abort();
  }, [isDataCenter, event?.isFrontierCluster, event?.title, event?.name, event?.lat, event?.lon, event?.operator, event?.country]);

  const [showProvenance, setShowProvenance] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const [newRefTitle, setNewRefTitle] = useState('');
  const [newRefUrl, setNewRefUrl] = useState('');
  const [addingRef, setAddingRef] = useState(false);
  const [refAdded, setRefAdded] = useState(false);

  const [editDraft, setEditDraft] = useState({
    category: event.category || 'Political',
    severity: event.severity || 2,
    title: event.title || '',
    location: event.location || '',
    lat: event.lat ?? '',
    lon: event.lon ?? '',
    source: event.details?.source || event.source || '',
    url: event.url || '',
    summary: event.details?.summary || event.summary || event.description || '',
    references: event.details?.references || []
  });

  useEffect(() => {
    setEditDraft({
      category: event.category || 'Political',
      severity: event.severity || 2,
      title: event.title || '',
      location: event.location || '',
      lat: event.lat ?? '',
      lon: event.lon ?? '',
      source: event.details?.source || event.source || '',
      url: event.url || '',
      summary: event.details?.summary || event.summary || event.description || '',
      references: event.details?.references || []
    });
    setEditMode(false);
    setShowProvenance(false);
  }, [event]);

  const ethicsMeta = ETHICS_HEADER[event?.ethicsKind] || { label: 'Ethics & Society Node', color: '#a855f7' };
  const temporalTrackLabel = event?.track === 'law' ? 'Binding Law' : event?.track === 'institute' ? 'Safety Institute' : 'GW Compute';
  const temporalColor = event?.track === 'law' ? '#10b981' : event?.track === 'institute' ? '#a855f7' : '#f59e0b';

  const catColor = isDataCenter
    ? (event?.isFrontierCluster ? '#f59e0b' : '#0ea5e9')
    : isRegulation
      ? '#a855f7'
      : isEthicsOverlay
        ? ethicsMeta.color
        : isTemporalMilestone
          ? temporalColor
          : CAT_COLORS[event.category] || '#00f0ff';

  const sev = Number(event.severity) || 2;
  const sevColor = SEV_COLORS[sev] || '#38bdf8';
  const cleanId = normalizeSignalId(event.id);
  const adm = isOsintSignal ? computeAdmiraltyGrade(event) : null;
  const mit = isOsintSignal ? (event.details?.mitRisk || classifyMitRiskDomain(event.title || '', editDraft.summary || '', event.details?.domainPillar || '')) : null;
  const displaySource = event.details?.source || event.source || (isRegulation ? 'AI Regulation Registry' : 'Sovereign OSINT');
  const displayDate = isRegulation || isTemporalMilestone ? event.date : formatTime(event.original_post_time || event.timestamp);

  const readableType = isDataCenter
    ? (event?.isFrontierCluster ? 'Frontier AI Cluster' : 'Data Center')
    : isRegulation
      ? 'AI Regulation'
      : isEthicsOverlay
        ? ethicsMeta.label
        : isTemporalMilestone
          ? 'Compute–Regulation Milestone'
          : event.details?.domainPillar || event.category || 'Policy Signal';

  const getOperatorId = () => {
    let userId = activeUser?.id || currentUser?.id;
    if (!userId && typeof window !== 'undefined') {
      try {
        userId = JSON.parse(localStorage.getItem('operator_session') || '{}')?.id;
      } catch {}
    }
    return userId || '';
  };

  const handleSearchAddress = async () => {
    if (!addressQuery.trim()) return;
    setLoadingGeo(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=5`);
      if (res.ok) setSuggestions(await res.json());
    } catch {}
    setLoadingGeo(false);
  };

  const handleSaveAdminEdit = async () => {
    setIsSaving(true);
    try {
      const isRss = Boolean(event.details?.isRssItem);
      const endpoint = isRss ? '/api/admin/rss' : '/api/admin/events';
      const payload = isRss
        ? {
            id: event.id,
            title: editDraft.title,
            category: editDraft.category,
            severity: parseInt(editDraft.severity, 10),
            location: editDraft.location,
            latitude: parseFloat(editDraft.lat),
            longitude: parseFloat(editDraft.lon),
            source: editDraft.source,
            summary: editDraft.summary
          }
        : {
            id: event.id,
            title: editDraft.title,
            category: editDraft.category,
            severity: parseInt(editDraft.severity, 10),
            location: editDraft.location,
            lat: parseFloat(editDraft.lat),
            lon: parseFloat(editDraft.lon),
            url: editDraft.url,
            summary: editDraft.summary
          };

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'x-user-id': getOperatorId(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update event');
      }

      const saved = {
        ...event,
        title: editDraft.title,
        category: editDraft.category,
        severity: parseInt(editDraft.severity, 10),
        location: editDraft.location,
        lat: parseFloat(editDraft.lat),
        lon: parseFloat(editDraft.lon),
        source: editDraft.source,
        url: editDraft.url,
        preventFocus: true,
        details: { ...(event.details || {}), summary: editDraft.summary }
      };
      if (onEventUpdate) onEventUpdate(saved);
      window.dispatchEvent(new CustomEvent('event_updated', { detail: saved }));
      setEditMode(false);
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveEvent = async (permanent = false) => {
    const msg = permanent
      ? 'Permanently purge this signal from the database?'
      : 'Archive this signal from the live globe?';
    if (!confirm(msg)) return;
    try {
      const endpoint = event.details?.isRssItem ? '/api/admin/rss' : '/api/admin/events';
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'x-user-id': getOperatorId(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id, permanent, title: event.title, url: event.url })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Action failed');
      }
      window.dispatchEvent(
        new CustomEvent('event_updated', { detail: { id: event.id, archived: true, title: event.title, url: event.url } })
      );
      if (onEventUpdate) onEventUpdate({ id: event.id, archived: true });
      onClose();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAddReference = async () => {
    if (!newRefUrl.trim()) return;
    setAddingRef(true);
    const newRef = { title: newRefTitle.trim() || 'Reference Link', url: newRefUrl.trim(), addedAt: new Date().toISOString() };
    const updatedRefs = [...(editDraft.references || []), newRef];
    setEditDraft((prev) => ({ ...prev, references: updatedRefs }));
    try {
      if (isAdmin) {
        await fetch('/api/admin/events', {
          method: 'PATCH',
          headers: { 'x-user-id': getOperatorId(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: event.id, details: { ...(event.details || {}), references: updatedRefs } })
        });
        if (onEventUpdate) onEventUpdate({ ...event, details: { ...(event.details || {}), references: updatedRefs } });
      } else {
        await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'suggestion',
            subject: `New Reference for: ${event.title}`,
            targetId: event.id,
            details: `${newRef.title} (${newRef.url})`
          })
        });
      }
      setRefAdded(true);
      setNewRefTitle('');
      setNewRefUrl('');
      setTimeout(() => setRefAdded(false), 2500);
    } catch {}
    setAddingRef(false);
  };

  const handleBookmarkClick = () => {
    if (!onToggleBookmark) return;
    onToggleBookmark({
      id: cleanId || event.id,
      title: event.title || event.name,
      category: event.category || (isDataCenter ? 'Economic' : 'Political'),
      severity: sev,
      location: event.location || event.jurisdiction || event.country || 'Global',
      lat: event.lat,
      lon: event.lon,
      source: isDataCenter ? (dcEnrich.data?.source || 'Infrastructure Registry') : displaySource,
      url: editDraft.url || event.url || event.website || '',
      summary: editDraft.summary || '',
      timestamp: event.original_post_time || event.timestamp || ''
    });
  };

  const regInfo = isRegulation ? cleanRegulationDisplay(event) : null;
  const summaryText = editDraft.summary
    ? String(editDraft.summary).replace(/\n{3,}/g, '\n\n').trim()
    : 'Primary signal captured from verified observatory wire.';

  // Data center resolved display fields
  const dcResolved = dcEnrich.data;
  const dcCity = dcResolved?.city || (event.city && !/^unknown$/i.test(event.city) ? event.city : '');
  const dcCountry = dcResolved?.country || event.country || 'Global';
  const dcAddress = dcResolved?.address || event.address || [dcCity, dcCountry].filter(Boolean).join(', ');
  const dcOperator = dcResolved?.operator || event.operator || 'Independent';
  const dcWebsite = dcResolved?.website || event.website || null;
  const dcPurpose = dcResolved?.facilityPurpose || event.facilityPurpose || `Operated by ${dcOperator} for regional compute and fiber interconnection.`;
  const dcProfile = dcResolved?.dataProfile || event.dataProfile || 'Enterprise cloud workloads, network peering, and distributed storage.';
  const rawLat = event.lat ?? event.latitude;
  const rawLon = event.lon ?? event.longitude;
  const hasLocateCoords = rawLat != null && rawLon != null && !isNaN(Number(rawLat)) && !isNaN(Number(rawLon));

  return (
    <div
      className="details-window"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        width: isMobile ? 'calc(100vw - 20px)' : '420px',
        maxWidth: '420px',
        maxHeight: isMobile ? 'calc(100dvh - 100px)' : 'calc(100vh - 110px)',
        background: 'var(--sov-panel-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '12px',
        boxShadow: 'var(--sov-shadow)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Top Category Accent Hairline */}
      <div style={{ height: '3px', width: '100%', backgroundColor: catColor, flexShrink: 0 }} />

      {/* Header / Universal Pointer Drag Handle */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: isMobile ? '10px 12px' : '10px 14px',
          borderBottom: '1px solid var(--sov-border)',
          background: 'var(--sov-card-bg)',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          position: 'relative'
        }}
      >
        {isMobile && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '36px',
              height: '3px',
              borderRadius: '99px',
              background: 'var(--sov-border)'
            }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
          {isDataCenter ? (
            <Server size={13} style={{ color: catColor, flexShrink: 0 }} />
          ) : isRegulation ? (
            <Scale size={13} style={{ color: catColor, flexShrink: 0 }} />
          ) : (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: catColor, flexShrink: 0 }} />
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--sov-text)',
              fontFamily: 'var(--font-jetbrains-fallback)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {readableType}
          </span>

          {isRegulation && event.status && (
            <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.16)', color: 'var(--sov-purple)', fontFamily: 'var(--font-jetbrains-fallback)' }}>
              {event.status}
            </span>
          )}

          {isTemporalMilestone && (
            <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: `${catColor}22`, color: catColor, fontFamily: 'var(--font-jetbrains-fallback)' }}>
              {temporalTrackLabel}
            </span>
          )}

          {(isOsintSignal || isEthicsOverlay) && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '4px',
                background: `${sevColor}22`,
                color: sevColor,
                fontFamily: 'var(--font-jetbrains-fallback)'
              }}
            >
              S{sev}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          {onToggleBookmark && (
            <button
              type="button"
              onClick={handleBookmarkClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${isBookmarked ? 'var(--sov-accent)' : 'var(--sov-border)'}`,
                background: isBookmarked ? 'var(--sov-accent-soft)' : 'transparent',
                color: isBookmarked ? 'var(--sov-accent)' : 'var(--sov-muted)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Signal to Profile'}
            >
              <Bookmark size={12} fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>
          )}

          {isAdmin && isOsintSignal && (
            <button
              type="button"
              onClick={() => setEditMode((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: `1px solid ${editMode ? '#ef4444' : 'var(--sov-border)'}`,
                background: editMode ? 'rgba(239,68,68,0.12)' : 'transparent',
                color: editMode ? '#ef4444' : 'var(--sov-muted)',
                cursor: 'pointer'
              }}
              title="Toggle Admin Editor"
            >
              <Edit3 size={12} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: '1px solid var(--sov-border)',
              background: 'transparent',
              color: 'var(--sov-muted)',
              cursor: 'pointer'
            }}
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!editMode ? (
          <>
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: 1.4,
                color: 'var(--sov-text)',
                fontFamily: 'var(--font-inter-fallback)'
              }}
            >
              {event.title || event.name}
            </h2>

            {/* Clean Contextual Subtitle */}
            {isDataCenter ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--sov-muted)' }}>
                <Building2 size={12} style={{ color: catColor }} />
                <strong style={{ color: 'var(--sov-text)' }}>{dcOperator}</strong>
                <span>· {[dcCity, dcCountry].filter(Boolean).join(', ')}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--sov-muted)' }}>
                <span>{isRegulation ? event.jurisdiction : event.location || event.country || 'Global'}</span>
                {displayDate && <span>· {displayDate}</span>}
                {!isRegulation && <span>· {displaySource}</span>}
              </div>
            )}

            {/* DATA CENTER STRUCTURED CARD */}
            {isDataCenter && (
              <>
                <div style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '8px', padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-muted)', letterSpacing: '0.05em' }}>
                      FACILITY LOCATION &amp; ADDRESS
                    </span>
                    {dcEnrich.loading && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9.5px', color: 'var(--sov-accent)' }}>
                        <Loader2 size={10} className="animate-spin" /> PeeringDB lookup…
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--sov-text)' }}>
                    {dcAddress || 'Regional Infrastructure Zone'}
                    {dcResolved?.zipcode ? ` (${dcResolved.zipcode})` : ''}
                  </div>
                  {event.lat != null && event.lon != null && (
                    <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)' }}>
                      {Number(event.lat).toFixed(4)}°, {Number(event.lon).toFixed(4)}°
                      {dcResolved?.clli ? ` · CLLI ${dcResolved.clli}` : ''}
                    </div>
                  )}
                </div>

                {event.isFrontierCluster ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    <InfoCell label="OWNER / OPERATOR" value={dcOperator} color="var(--sov-text)" />
                    <InfoCell label="POWER CAPACITY" value={event.powerMw ? `${Number(event.powerMw).toLocaleString()} MW` : 'Hyperscale'} color="var(--sov-amber)" />
                    <InfoCell label="CHIP HARDWARE" value={event.chipTypes || 'Frontier Accelerators'} color="var(--sov-sky)" />
                    <InfoCell
                      label="SCALE / CAPEX"
                      value={
                        [
                          event.h100Equivalents ? `${(Number(event.h100Equivalents) / 1000).toFixed(0)}k H100-eq` : null,
                          event.capexBillions ? `$${event.capexBillions}B` : null
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Frontier Build'
                      }
                      color="var(--sov-emerald)"
                    />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    <InfoCell label="OPERATOR / OWNER" value={dcOperator} color="var(--sov-text)" />
                    <InfoCell label="FACILITY STATUS" value={String(event.status || 'Active').toUpperCase()} color="var(--sov-emerald)" />
                    <InfoCell label="CONNECTED NETWORKS" value={dcResolved ? `${dcResolved.netCount} ASNs` : dcEnrich.loading ? 'Resolving…' : 'Carrier Hub'} color="var(--sov-sky)" />
                    <InfoCell label="IXs & FIBER CARRIERS" value={dcResolved ? `${dcResolved.ixCount} IXs · ${dcResolved.carrierCount} Carriers` : dcEnrich.loading ? 'Resolving…' : 'Interconnect'} color="var(--sov-accent)" />
                  </div>
                )}

                <div style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderLeft: `3px solid ${catColor}`, borderRadius: '7px', padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: catColor, letterSpacing: '0.04em' }}>
                      FACILITY PURPOSE &amp; CONTENTS
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--sov-text)', marginTop: '2px' }}>
                      {dcPurpose}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: 'var(--sov-muted)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Database size={10} /> WORKLOADS &amp; DATA PROFILE
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--sov-text)', marginTop: '2px' }}>
                      {dcProfile}
                    </div>
                  </div>
                  {dcResolved?.source && (
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)' }}>
                      Verified via {dcResolved.source}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '2px' }}>
                  {(dcWebsite || dcResolved?.peeringDbUrl) && (
                    <a
                      href={dcWebsite || dcResolved.peeringDbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: '1 1 auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-accent)',
                        background: 'var(--sov-accent-soft)',
                        color: 'var(--sov-accent)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <span>{event.isFrontierCluster ? 'Epoch AI Source' : dcWebsite ? 'Operator Site' : 'PeeringDB Record'}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {dcWebsite && dcResolved?.peeringDbUrl && (
                    <a
                      href={dcResolved.peeringDbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '8px 11px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-text)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <span>PeeringDB</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                  {event.jurisdictionSlug && (
                    <Link
                      href={`/jurisdiction/${encodeURIComponent(event.jurisdictionSlug)}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '8px 11px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-text)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      Atlas ↗
                    </Link>
                  )}
                  {onFocusLocation && hasLocateCoords && (
                    <button
                      type="button"
                      onClick={() => onFocusLocation(Number(rawLat), Number(rawLon))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <MapPin size={12} />
                      <span>Locate</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* AI REGULATION STRUCTURED CARD */}
            {isRegulation && regInfo && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                  <InfoCell label="JURISDICTION" value={event.jurisdiction} color="var(--sov-text)" />
                  <InfoCell label="POLICY FOCUS" value={event.area || 'General AI Governance'} color="var(--sov-sky)" />
                  <InfoCell label="LEGAL STATUS" value={event.status || 'Policy'} color="var(--sov-purple)" />
                  <InfoCell
                    label={event.sagriScore ? 'SAGRI INDEX / POSTURE' : 'TRACKED DATE'}
                    value={event.sagriScore ? `${event.sagriScore}/100 · ${event.bindingStatus || event.status}` : (event.date || 'Active')}
                    color="var(--sov-emerald)"
                  />
                </div>

                {event.regulator && (
                  <div style={{ fontSize: '11.5px', color: 'var(--sov-muted)', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '6px', padding: '7px 10px' }}>
                    <strong style={{ color: 'var(--sov-text)' }}>Competent Authority:</strong> {event.regulator}
                  </div>
                )}

                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: 'var(--sov-text)', whiteSpace: 'pre-wrap' }}>
                  {regInfo.cleanSummary}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '2px' }}>
                  <a
                    href={regInfo.resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: '1 1 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '7px',
                      border: '1px solid var(--sov-purple)',
                      background: 'rgba(168, 85, 247, 0.14)',
                      color: 'var(--sov-purple)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <span>{regInfo.hasDirectUrl ? 'Official Source / Legislation' : 'Search OECD.AI Registry'}</span>
                    <ExternalLink size={12} />
                  </a>

                  {event.jurisdictionSlug && (
                    <Link
                      href={`/jurisdiction/${encodeURIComponent(event.jurisdictionSlug)}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '8px 11px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-text)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      Jurisdiction Atlas ↗
                    </Link>
                  )}

                  {onFocusLocation && hasLocateCoords && (
                    <button
                      type="button"
                      onClick={() => onFocusLocation(Number(rawLat), Number(rawLon))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <MapPin size={12} />
                      <span>Locate</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* AI ETHICS & TEMPORAL OVERLAY STRUCTURED CARD */}
            {(isEthicsOverlay || isTemporalMilestone) && (
              <>
                {event.ethicsKind === 'censorship' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    <InfoCell label="CONFIRMED WEB BLOCKS" value={Number(event.confirmedBlocks || 0).toLocaleString()} color="#f43f5e" />
                    <InfoCell label="DISRUPTION RATE" value={`${event.blockRatePct || 0}% (${Number(event.measurements || 0).toLocaleString()} tests)`} color="var(--sov-amber)" />
                    <InfoCell label="IM / TOR ANOMALIES" value={Number(event.imAnomalies || 0).toLocaleString()} color="var(--sov-purple)" />
                    <InfoCell label="IODA OUTAGE ALERTS" value={event.iodaAlerts ? `${event.iodaAlerts} active (${(event.iodaDatasources || []).join(', ') || 'BGP'})` : '0 alerts (14d)'} color="var(--sov-sky)" />
                  </div>
                )}
                {event.ethicsKind === 'environmental' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    <InfoCell label="BASIN WATER STRESS" value={event.waterStress || 'Monitored'} color="#38bdf8" />
                    <InfoCell label="GRID CARBON INTENSITY" value={`${event.carbonIntensity || 0} gCO2/kWh`} color="var(--sov-amber)" />
                    <InfoCell label="COMPUTE LOAD" value={`${Number(event.powerLoadMw || 0).toLocaleString()} MW`} color="var(--sov-text)" />
                    <InfoCell label="EST. EVAPORATIVE DRAW" value={event.estWaterMlYr ? `${Number(event.estWaterMlYr).toLocaleString()} ML/yr` : 'Cluster Est.'} color="var(--sov-emerald)" />
                  </div>
                )}
                {event.ethicsKind === 'supply_chain' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    <InfoCell label="SUPPLY STAGE" value={String(event.stage || 'Node').toUpperCase()} color="#f59e0b" />
                    <InfoCell label="CRITICAL INPUT" value={event.mineral || 'Semiconductor Material'} color="var(--sov-sky)" />
                    <InfoCell label="GLOBAL SHARE" value={event.globalShare || 'Key Node'} color="var(--sov-emerald)" />
                    <InfoCell label="CHOKEPOINT & OPERATORS" value={`${event.chokepointRisk || 'Monitored'} · ${event.operators || ''}`} color="var(--sov-text)" />
                  </div>
                )}
                {event.ethicsKind === 'biometric_welfare' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    <InfoCell label="GOVERNANCE DOMAIN" value={event.domain || 'Biometric System'} color="var(--sov-purple)" />
                    <InfoCell label="LEGAL STATUS" value={event.status || 'Active'} color="var(--sov-amber)" />
                    <InfoCell label="DEPLOYING AUTHORITY" value={event.deployingAuthority || 'Public Agency'} color="var(--sov-text)" />
                    <InfoCell label="AFFECTED COHORT" value={event.affectedPopulation || 'Monitored'} color="var(--sov-sky)" />
                  </div>
                )}
                {event.ethicsKind === 'ai_labor' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    <InfoCell label="TYPICAL PAY BAND" value={event.typicalHourlyUsd || 'Verified'} color="#ec4899" />
                    <InfoCell label="WORKFORCE SCALE" value={event.workforceScale || 'Regional Hub'} color="var(--sov-sky)" />
                    <InfoCell label="KEY VENDORS" value={event.vendors || 'Outsourcing Firms'} color="var(--sov-text)" />
                    <InfoCell label="LABOR CONDITIONS" value={event.laborStatus || 'Monitored'} color="var(--sov-amber)" />
                  </div>
                )}
                {isTemporalMilestone && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    <InfoCell label="MILESTONE DATE" value={event.date} color="var(--sov-accent)" />
                    <InfoCell label="GOVERNANCE TRACK" value={temporalTrackLabel} color={catColor} />
                    {event.powerMw && <InfoCell label="CLUSTER LOAD" value={`${event.powerMw} MW`} color="var(--sov-amber)" />}
                    {event.country && <InfoCell label="JURISDICTION" value={event.country} color="var(--sov-text)" />}
                  </div>
                )}

                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: 'var(--sov-text)', whiteSpace: 'pre-wrap' }}>
                  {summaryText}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '2px' }}>
                  {(event.url || event.ooniExplorerUrl) && (
                    <a
                      href={event.url || event.ooniExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: '1 1 auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: `1px solid ${catColor}`,
                        background: `${catColor}1e`,
                        color: catColor,
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <span>{event.ethicsKind === 'censorship' ? 'OONI Live Chart' : 'Inspect Primary Source'}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {event.iodaUrl && (
                    <a
                      href={event.iodaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '8px 11px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-sky)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      IODA Outages ↗
                    </a>
                  )}
                  {onFocusLocation && hasLocateCoords && (
                    <button
                      type="button"
                      onClick={() => onFocusLocation(Number(rawLat), Number(rawLon))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <MapPin size={12} />
                      <span>Locate</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* STANDARD OSINT POLICY SIGNAL CARD */}
            {isOsintSignal && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(() => {
                    const vStatus = event.url ? (event.details?.verificationStatus || 'active') : 'unverified';
                    const isVer = vStatus === 'active' || vStatus === 'healed';
                    return (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-jetbrains-fallback)',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: isVer ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                          border: `1px solid ${isVer ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                          color: isVer ? 'var(--sov-emerald)' : 'var(--sov-amber)'
                        }}
                      >
                        {isVer ? '✓ Verified Source' : 'Unverified Link'}
                      </span>
                    );
                  })()}
                  {adm && (
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', color: 'var(--sov-accent)' }}>
                      Admiralty {adm.grade}
                    </span>
                  )}
                  {mit && (
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', color: 'var(--sov-muted)' }}>
                      {mit.code}: {mit.shortLabel || mit.domain}
                    </span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: 'var(--sov-text)', whiteSpace: 'pre-wrap' }}>
                  {summaryText}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '2px' }}>
                  {editDraft.url && (
                    <a
                      href={editDraft.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: '1 1 auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-accent)',
                        background: 'var(--sov-accent-soft)',
                        color: 'var(--sov-accent)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <span>Read Source</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  {cleanId && (
                    <Link
                      href={`/signal/${encodeURIComponent(cleanId)}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-text)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      Dossier ↗
                    </Link>
                  )}

                  {onFocusLocation && hasLocateCoords && (
                    <button
                      type="button"
                      onClick={() => onFocusLocation(Number(rawLat), Number(rawLon))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-card-bg)',
                        color: 'var(--sov-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Center map on coordinates"
                    >
                      <MapPin size={12} />
                      <span>Locate</span>
                    </button>
                  )}
                </div>

                {/* Collapsible Provenance, Citations & References */}
                <div style={{ borderTop: '1px solid var(--sov-border)', paddingTop: '10px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setShowProvenance((p) => !p)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--sov-muted)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-jetbrains-fallback)',
                      cursor: 'pointer',
                      padding: '2px 0'
                    }}
                  >
                    <span>CITATIONS &amp; REFERENCES</span>
                    {showProvenance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showProvenance && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <CitationProvenanceCard event={event} />

                      {editDraft.references?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {editDraft.references.map((ref, idx) => (
                            <a
                              key={idx}
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '12px', color: 'var(--sov-accent)', textDecoration: 'underline' }}
                            >
                              {ref.title || ref.url} ↗
                            </a>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={newRefTitle}
                          onChange={(e) => setNewRefTitle(e.target.value)}
                          placeholder="Ref title"
                          style={{ flex: 1, minWidth: '100px', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '11.5px' }}
                        />
                        <input
                          type="url"
                          value={newRefUrl}
                          onChange={(e) => setNewRefUrl(e.target.value)}
                          placeholder="https://..."
                          style={{ flex: 1.5, minWidth: '130px', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '11.5px' }}
                        />
                        <button
                          type="button"
                          onClick={handleAddReference}
                          disabled={addingRef || !newRefUrl.trim()}
                          style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid var(--sov-accent)', background: 'var(--sov-accent-soft)', color: 'var(--sov-accent)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {refAdded ? <Check size={12} /> : '+ Add'}
                        </button>
                      </div>

                      {onReportIssue && (
                        <button
                          type="button"
                          onClick={() =>
                            onReportIssue('suggestions', {
                              type: 'link',
                              subject: `Report Issue: ${event.title}`,
                              targetId: event.id,
                              details: `Signal URL: ${editDraft.url || 'None'}`
                            })
                          }
                          style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '11px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          Report broken link or wrong coordinates
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          /* Clean Compact Admin Editor */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              value={editDraft.title}
              onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="Title"
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '13px', fontWeight: 600 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select
                value={editDraft.category}
                onChange={(e) => setEditDraft((p) => ({ ...p, category: e.target.value }))}
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
              >
                {Object.keys(CAT_COLORS).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={editDraft.severity}
                onChange={(e) => setEditDraft((p) => ({ ...p, severity: e.target.value }))}
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>Severity S{s}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                placeholder="Lookup place / city..."
                style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
              />
              <button type="button" onClick={handleSearchAddress} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-accent)', cursor: 'pointer' }}>
                {loadingGeo ? <Loader2 size={13} /> : <Search size={13} />}
              </button>
            </div>
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '90px', overflowY: 'auto' }}>
                {suggestions.map((sg) => (
                  <button
                    key={sg.place_id}
                    type="button"
                    onClick={() => {
                      setEditDraft((p) => ({ ...p, location: sg.display_name.split(',')[0], lat: sg.lat, lon: sg.lon }));
                      setSuggestions([]);
                    }}
                    style={{ textAlign: 'left', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', cursor: 'pointer' }}
                  >
                    {sg.display_name}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '6px' }}>
              <input
                type="text"
                value={editDraft.location}
                onChange={(e) => setEditDraft((p) => ({ ...p, location: e.target.value }))}
                placeholder="Location"
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
              />
              <input
                type="text"
                value={editDraft.lat}
                onChange={(e) => setEditDraft((p) => ({ ...p, lat: e.target.value }))}
                placeholder="Lat"
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
              />
              <input
                type="text"
                value={editDraft.lon}
                onChange={(e) => setEditDraft((p) => ({ ...p, lon: e.target.value }))}
                placeholder="Lon"
                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12px' }}
              />
            </div>
            <textarea
              rows={4}
              value={editDraft.summary}
              onChange={(e) => setEditDraft((p) => ({ ...p, summary: e.target.value }))}
              style={{ padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '12.5px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSaveAdminEdit}
                disabled={isSaving}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: '#00f0ff', color: '#020617', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Save size={12} /> {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => handleArchiveEvent(false)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)', color: '#38bdf8', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Archive size={12} /> Archive
              </button>
              <button
                type="button"
                onClick={() => handleArchiveEvent(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Trash2 size={12} /> Purge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
