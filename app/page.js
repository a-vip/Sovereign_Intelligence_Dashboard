'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, BarChart3, FileSearch, Activity, Radar, Coffee, Heart } from 'lucide-react';
import MetricsOverview from '@/components/MetricsOverview';
import { CategoryChart, ThreatChart, CountryChart, SystemTypeChart, ProducerChart, TagCloud } from '@/components/IntelligenceCharts';
import QualitativeExplorer from '@/components/QualitativeExplorer';
import TerminalFeed from '@/components/TerminalFeed';
import LiveMapWrapper from '@/components/LiveMapWrapper';

const TABS = [
  { id: 'sigint', label: 'SIGINT Map', icon: Radar },
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'explorer', label: 'Explorer', icon: FileSearch },
];

const POLL_INTERVAL = 30000; // 30 seconds live update

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sigint');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/vault', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Live polling
  useEffect(() => {
    if (!isVisible) return; // Pause polling when hidden
    const interval = setInterval(() => fetchData(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData, isVisible]);

  const handleTagClick = (tag) => {
    setActiveTag(prev => prev === tag ? null : tag);
    if (tag) setActiveTab('explorer');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ring" />
        <div className="loading-text">Initializing Sovereign Intelligence</div>
        <div className="loading-sub">Parsing vault data streams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <div style={{ color: 'var(--crimson)', fontSize: 48 }}>⚠</div>
        <div className="loading-text" style={{ color: 'var(--crimson)' }}>Signal Lost</div>
        <div className="loading-sub">{error}</div>
        <button className="refresh-btn" onClick={() => fetchData(true)} style={{ marginTop: 16 }}>
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const isSigint = activeTab === 'sigint';

  return (
    <main className={isSigint ? 'dashboard dashboard-fullbleed' : 'dashboard'}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-icon"><Shield size={24} color="#fff" /></div>
          <div>
            <h1 className="header-title">Sovereign Intelligence</h1>
            <div className="header-subtitle">LAWS Tracking • State Violations • Corporate Complicity</div>
          </div>
        </div>
        <div className="header-right">
          <div className="support-links">
            <a href="https://patreon.com/aviperera?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" target="_blank" rel="noopener noreferrer" className="support-btn patreon">
              <Heart size={14} /> Patreon
            </a>
            <a href="https://buymeacoffee.com/avip" target="_blank" rel="noopener noreferrer" className="support-btn coffee">
              <Coffee size={14} /> Buy Me a Coffee
            </a>
          </div>
          <div className="live-indicator"><div className="live-dot" /> LIVE</div>
          <button id="refresh-btn" className={`refresh-btn${refreshing ? ' spinning' : ''}`} onClick={() => fetchData(true)}>
            <RefreshCw size={14} /> Refresh
          </button>
          <span className="last-updated">
            {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '—'}
          </span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </nav>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <MetricsOverview metrics={data?.metrics} />
          <div className="charts-grid">
            <CategoryChart data={data?.distributions?.categories} />
            <ThreatChart data={data?.distributions?.threats} />
          </div>
          <TerminalFeed />
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          <MetricsOverview metrics={data?.metrics} />
          <div className="charts-grid">
            <CountryChart data={data?.distributions?.countries} />
            <SystemTypeChart data={data?.distributions?.systemTypes} />
          </div>
          <div className="charts-grid">
            <ProducerChart data={data?.distributions?.producers} />
            <TagCloud data={data?.distributions?.tags} onTagClick={handleTagClick} activeTag={activeTag} />
          </div>
        </>
      )}

      {/* Explorer Tab */}
      {activeTab === 'explorer' && (
        <QualitativeExplorer documents={data?.documents} onTagFilter={handleTagClick} activeTag={activeTag} />
      )}

      {/* SIGINT Map Tab */}
      {activeTab === 'sigint' && <LiveMapWrapper />}
    </main>
  );
}
