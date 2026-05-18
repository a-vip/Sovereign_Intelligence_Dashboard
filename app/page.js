'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, User, LogOut, Heart } from 'lucide-react';
import LiveMapWrapper from '@/components/LiveMapWrapper';
import AsciiGlobe from '@/components/AsciiGlobe';
import AuthModal from '@/components/AuthModal';
import AccountModal from '@/components/AccountModal';

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
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState('profile');
  const [prefilledSuggestion, setPrefilledSuggestion] = useState(null);
  const [showSupportDropdown, setShowSupportDropdown] = useState(false);

  const openAccountModal = (tab = 'profile', prefill = null) => {
    setPrefilledSuggestion(prefill);
    setAccountModalTab(tab);
    setShowAccountModal(true);
  };

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
        <div className="loading-globe-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
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
    <main className="dashboard dashboard-fullbleed" style={{ height: '100vh', width: '100vw', padding: 0, overflow: 'hidden' }}>
      {/* SIGINT Map (Directly rendered fullscreen) */}
      <LiveMapWrapper 
        currentUser={currentUser}
        handleLogout={handleLogout}
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        handleAuthSuccess={handleAuthSuccess}
        onAvatarClick={openAccountModal}
      />

      {/* Access Control HUD Overlay */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onAuthSuccess={handleAuthSuccess} 
        />
      )}

      {/* Operator Account Settings Overlay */}
      {showAccountModal && (
        <AccountModal 
          onClose={() => setShowAccountModal(false)} 
          currentUser={currentUser}
          onAuthSuccess={handleAuthSuccess}
          handleLogout={handleLogout}
          initialTab={accountModalTab}
          prefilledSuggestion={prefilledSuggestion}
        />
      )}
    </main>
  );
}
