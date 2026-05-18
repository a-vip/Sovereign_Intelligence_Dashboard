'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, User, LogOut, Heart } from 'lucide-react';
import LiveMapWrapper from '@/components/LiveMapWrapper';
import AsciiGlobe from '@/components/AsciiGlobe';
import AuthModal from '@/components/AuthModal';

const POLL_INTERVAL = 30000; // 30 seconds live update

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minLoaderFinished, setMinLoaderFinished] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupportDropdown, setShowSupportDropdown] = useState(false);

  // Read stored session on client boot
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoaderFinished(true);
    }, 2800); // 2.8s minimum loading display duration to appreciate cyber loader!

    const storedUser = localStorage.getItem('operator_session');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
    return () => clearTimeout(timer);
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('operator_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('operator_session');
  };

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
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    if (!isVisible) return;
    const interval = setInterval(() => fetchData(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData, isVisible]);

  if (loading || !minLoaderFinished) {
    return (
      <div className="loading-screen">
        <div className="loading-globe-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AsciiGlobe />
        </div>
        <div className="loading-text">
          Initializing Sovereign Intelligence
        </div>
        <div className="loading-sub">
          [ SIGNAL LOCK ACQUIRED // PARSING VAULT DATA STREAMS ]
        </div>
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

  return (
    <main className="dashboard dashboard-fullbleed">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-icon"><Shield size={18} color="#fff" /></div>
          <div>
            <h1 className="header-title">Sovereign Intelligence</h1>
            <div className="header-subtitle">LAWS Tracking • State Violations • Corporate Complicity</div>
          </div>
        </div>
        <div className="header-right">
          <div className="live-indicator"><div className="live-dot" /> LIVE SIGINT FEED</div>
          
          {currentUser ? (
            <div className="operator-profile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              fontFamily: 'Courier New, monospace',
              fontSize: '11px',
              color: '#10b981',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.05)',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                animation: 'pulse 2s infinite'
              }} />
              <span>
                USER: <strong style={{ color: '#ffffff' }}>{currentUser.fullName}</strong> ({
                  {
                    researcher: 'Researcher',
                    student: 'Student',
                    observer: 'Human Rights Observer',
                    journalist: 'Journalist',
                    government: 'Government Official',
                    military: 'Military Personnel',
                    advocate: 'NGO Advocate',
                    ethicist: 'Tech Policy Specialist',
                    civilian: 'Civilian Observer',
                    other: 'User'
                  }[currentUser.role] || (currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'User')
                })
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 0.7)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  marginLeft: '4px',
                  transition: 'all 0.2s'
                }}
                title="Logout Session"
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'}
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="refresh-btn"
              style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#06b6d4',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.05)',
              }}
            >
              <User size={13} /> ACCESS CONTROL
            </button>
          )}

          {/* Support Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowSupportDropdown(!showSupportDropdown)}
              onMouseEnter={() => setShowSupportDropdown(true)}
              onMouseLeave={() => setShowSupportDropdown(false)}
              className="refresh-btn"
              style={{
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#ec4899',
                boxShadow: '0 0 10px rgba(236, 72, 153, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Heart size={13} style={{ fill: '#ec4899' }} /> SUPPORT
            </button>
            
            {showSupportDropdown && (
              <div 
                onMouseEnter={() => setShowSupportDropdown(true)}
                onMouseLeave={() => setShowSupportDropdown(false)}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '180px',
                  background: 'rgba(8, 12, 24, 0.95)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '8px',
                  padding: '8px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(6, 182, 212, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  zIndex: 1000,
                  backdropFilter: 'blur(10px)',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <a 
                  href="https://www.patreon.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="support-btn patreon"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s',
                    background: 'rgba(255, 66, 77, 0.1)',
                    color: '#ff424d',
                    border: '1px solid rgba(255, 66, 77, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff424d';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 66, 77, 0.1)';
                    e.currentTarget.style.color = '#ff424d';
                  }}
                >
                  <span style={{ fontSize: '12px' }}>☕</span> Patreon
                </a>
                <a 
                  href="https://www.buymeacoffee.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="support-btn coffee"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s',
                    background: 'rgba(255, 221, 0, 0.1)',
                    color: '#ffdd00',
                    border: '1px solid rgba(255, 221, 0, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffdd00';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 221, 0, 0.1)';
                    e.currentTarget.style.color = '#ffdd00';
                  }}
                >
                  <span style={{ fontSize: '12px' }}>⚡</span> Buy Me A Coffee
                </a>
              </div>
            )}
          </div>

          <button id="refresh-btn" className={`refresh-btn${refreshing ? ' spinning' : ''}`} onClick={() => fetchData(true)}>
            <RefreshCw size={14} /> Refresh
          </button>
          <span className="last-updated">
            {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '—'}
          </span>
        </div>
      </header>

      {/* SIGINT Map (Directly rendered fullscreen) */}
      <LiveMapWrapper />

      {/* Access Control HUD Overlay */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuthSuccess={handleAuthSuccess} 
        />
      )}
    </main>
  );
}
