'use client';
import { useState, useEffect } from 'react';
import { Shield, Key, Mail, User, ShieldAlert, X, ChevronRight, Check, LogOut, Settings, Eye, EyeOff, MessageSquare, Globe } from 'lucide-react';

export default function AccountModal({ onClose, currentUser, onAuthSuccess, handleLogout, initialTab = 'profile', prefilledSuggestion = null, onOpenAuth = null }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (!currentUser && (initialTab === 'profile' || initialTab === 'security')) {
      return 'system';
    }
    return initialTab;
  }); // 'profile', 'security', 'system', 'suggestions'

  // Guest inputs for anonymous suggestion submissions
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  
  // Step-by-step wizard states
  const [wizardType, setWizardType] = useState(''); // '', 'name', 'email', 'password'
  const [wizardStep, setWizardStep] = useState(1); // 1: Verify Password, 2: Input Details / Set Password
  const [authPassword, setAuthPassword] = useState('');
  
  // Input fields for wizards
  const [newName, setNewName] = useState(currentUser?.fullName || '');
  const [newEmail, setNewEmail] = useState(currentUser?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference fields
  const [mapStyle, setMapStyle] = useState('dark');
  const [mapMode, setMapMode] = useState('2d');
  const [autoRotate, setAutoRotate] = useState(true);
  const [tickerSpeed, setTickerSpeed] = useState('slow');
  const [minSeverity, setMinSeverity] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Suggestions & Bug Reports Form states
  const [suggestionType, setSuggestionType] = useState('general'); // 'general', 'bug', 'map', 'link'
  const [suggestionSubject, setSuggestionSubject] = useState('');
  const [suggestionDetails, setSuggestionDetails] = useState('');
  const [suggestionTargetId, setSuggestionTargetId] = useState('');
  const [suggestionScreenshot, setSuggestionScreenshot] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [successSuggestions, setSuccessSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 4.5MB base64 limit)
    if (file.size > 4.5 * 1024 * 1024) {
      setErrorSuggestions('File size exceeds the 4.5MB security limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSuggestionScreenshot(reader.result);
    };
    reader.onerror = () => {
      setErrorSuggestions('Failed to parse selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    setLoadingSuggestions(true);
    setErrorSuggestions(null);
    setSuccessSuggestions(false);

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: suggestionType,
          subject: suggestionSubject,
          details: suggestionDetails,
          targetId: suggestionTargetId,
          operatorEmail: currentUser?.email || guestEmail.trim() || 'unknown@sovereign.net',
          operatorName: currentUser?.fullName || guestName.trim() || 'Anonymous Operator',
          screenshot: suggestionScreenshot
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transmit suggestion report.');
      }

      setSuccessSuggestions(true);
    } catch (err) {
      setErrorSuggestions(err.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Prefill suggestions if passed from external buttons (e.g. Map Coordinates or Broken Link reports)
  useEffect(() => {
    if (prefilledSuggestion) {
      if (prefilledSuggestion.type) setSuggestionType(prefilledSuggestion.type);
      if (prefilledSuggestion.subject) setSuggestionSubject(prefilledSuggestion.subject);
      if (prefilledSuggestion.targetId) setSuggestionTargetId(prefilledSuggestion.targetId);
      if (prefilledSuggestion.details) setSuggestionDetails(prefilledSuggestion.details);
      
      // Auto-reset wizard/success states so the form is clean and visible
      setSuccessSuggestions(false);
      setErrorSuggestions(null);
    }
  }, [prefilledSuggestion]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMapStyle(localStorage.getItem('operator_pref_mapStyle') || 'dark');
    setMapMode(localStorage.getItem('operator_pref_mapMode') || '2d');
    setAutoRotate(localStorage.getItem('operator_pref_autoRotate') !== 'false');
    setTickerSpeed(localStorage.getItem('operator_pref_tickerSpeed') || 'slow');
    setMinSeverity(parseInt(localStorage.getItem('operator_pref_minSeverity') || '1'));
  }, []);

  const handlePreferenceChange = (key, value) => {
    localStorage.setItem(`operator_pref_${key}`, value);
    window.dispatchEvent(new Event('operator_pref_changed'));
    
    // Update local state
    if (key === 'mapStyle') setMapStyle(value);
    if (key === 'mapMode') setMapMode(value);
    if (key === 'autoRotate') setAutoRotate(value);
    if (key === 'tickerSpeed') setTickerSpeed(value);
    if (key === 'minSeverity') setMinSeverity(value);
  };

  const startWizard = (type) => {
    setWizardType(type);
    setWizardStep(1);
    setAuthPassword('');
    setError(null);
    setSuccess(false);
    
    // Pre-fill existing credentials
    if (type === 'name') setNewName(currentUser?.fullName || '');
    if (type === 'email') setNewEmail(currentUser?.email || '');
    if (type === 'password') {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          password: authPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication check failed: invalid password.');
      }

      // Password verified successfully! Advance to configuration step.
      setWizardStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (wizardType === 'password') {
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        setLoading(false);
        return;
      }
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        userId: currentUser.id,
        currentPassword: authPassword
      };

      if (wizardType === 'name') payload.fullName = newName;
      if (wizardType === 'email') payload.email = newEmail;
      if (wizardType === 'password') payload.newPassword = newPassword;

      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration details.');
      }

      setSuccess(true);
      setSuccessMsg(
        wizardType === 'name' ? 'Operator handle updated successfully' :
        wizardType === 'email' ? 'Registered email address altered successfully' :
        'Operator credentials rotated successfully'
      );

      // Save updated operator in parent session
      onAuthSuccess(data.user);

      // Close wizard after brief success display
      setTimeout(() => {
        setWizardType('');
        setSuccess(false);
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      {/* Background Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none'
      }} />

      {/* Main Options Container */}
      <div style={{
        position: 'relative',
        width: 'calc(100% - 32px)',
        maxWidth: '680px',
        height: 'min(560px, 90vh)',
        background: 'rgba(8, 12, 24, 0.95)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '16px',
        boxShadow: '0 0 45px rgba(6, 182, 212, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* HUD Corners */}
        <div style={{ position: 'absolute', top: 12, left: 12, width: 14, height: 14, borderTop: '2px solid #06b6d4', borderLeft: '2px solid #06b6d4', opacity: 0.5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 12, right: 12, width: 14, height: 14, borderTop: '2px solid #06b6d4', borderRight: '2px solid #06b6d4', opacity: 0.5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 12, left: 12, width: 14, height: 14, borderBottom: '2px solid #06b6d4', borderLeft: '2px solid #06b6d4', opacity: 0.5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 12, right: 12, width: 14, height: 14, borderBottom: '2px solid #06b6d4', borderRight: '2px solid #06b6d4', opacity: 0.5, pointerEvents: 'none' }} />

        {/* Header Block */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(2, 6, 23, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} style={{ color: '#06b6d4' }} />
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
                OPERATOR PROFILE & SETTINGS
              </h2>
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#8892a4' }}>
                ID: {currentUser?.id?.substring(0, 8)} • SECURE CHANNEL ACTIVE
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: '50%',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body Grid */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="settings-body">
          {/* Navigation Sidebar */}
          <div style={{
            width: '180px',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(2, 6, 23, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 8px'
          }} className="settings-sidebar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {currentUser && (
                <>
                  <button
                    onClick={() => { setActiveTab('profile'); setWizardType(''); }}
                    style={{
                      width: '100%',
                      background: activeTab === 'profile' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                      border: activeTab === 'profile' ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                      color: activeTab === 'profile' ? '#06b6d4' : '#8892a4',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <User size={13} />
                    PROFILE
                  </button>
                  <button
                    onClick={() => { setActiveTab('security'); setWizardType(''); }}
                    style={{
                      width: '100%',
                      background: activeTab === 'security' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                      border: activeTab === 'security' ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                      color: activeTab === 'security' ? '#06b6d4' : '#8892a4',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Key size={13} />
                    SECURITY
                  </button>
                </>
              )}
              <button
                onClick={() => { setActiveTab('system'); setWizardType(''); }}
                style={{
                  width: '100%',
                  background: activeTab === 'system' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                  border: activeTab === 'system' ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                  color: activeTab === 'system' ? '#06b6d4' : '#8892a4',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Settings size={13} />
                PREFS
              </button>
              <button
                onClick={() => { setActiveTab('suggestions'); setWizardType(''); }}
                style={{
                  width: '100%',
                  background: activeTab === 'suggestions' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                  border: activeTab === 'suggestions' ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                  color: activeTab === 'suggestions' ? '#06b6d4' : '#8892a4',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <MessageSquare size={13} />
                FEEDBACK
              </button>
              
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
              
              <a
                href="https://sovdash.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  color: '#06b6d4',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                  e.currentTarget.style.color = '#06b6d4';
                }}
              >
                <Globe size={13} />
                SOVDASH SALES
              </a>
            </div>

            {/* Logout trigger */}
            {currentUser && (
              <button
                onClick={() => { handleLogout(); onClose(); }}
                className="logout-btn"
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
              >
                <LogOut size={13} />
                <span className="logout-text">LOGOUT</span>
              </button>
            )}
          </div>

          {/* Main Option Panel */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }} className="settings-content">
            
            {/* SUB-WIZARD DIALOG PANEL OVERLAY (DELIBERATE STEP-BY-STEP PROCESSOR) */}
            {wizardType ? (
              <div style={{ animation: 'fadeIn 0.25s' }}>
                {/* Wizard Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <button 
                    onClick={() => setWizardType('')}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#8892a4', borderRadius: '4px', padding: '3px 8px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ← CANCEL PROTOCOL
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    // ROTATION PROTOCOL: {wizardType}
                  </span>
                </div>

                {/* Progress Indicators */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, height: '4px', background: '#06b6d4', borderRadius: '2px' }} />
                  <div style={{ flex: 1, height: '4px', background: wizardStep >= 2 ? '#06b6d4' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background 0.3s' }} />
                  <div style={{ flex: 1, height: '4px', background: success ? '#10b981' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background 0.3s' }} />
                </div>

                {/* Feedback Messages */}
                {error && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '10px 12px', color: '#ef4444', fontSize: '11px', marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <ShieldAlert size={14} />
                    <span>{error}</span>
                  </div>
                )}

                {success ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
                    <Check size={28} style={{ color: '#10b981', marginBottom: '8px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', letterSpacing: '0.5px' }}>{successMsg}</span>
                    <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(16,185,129,0.6)', marginTop: '4px' }}>[ SYNC SUCCESSFUL ]</span>
                  </div>
                ) : (
                  <>
                    {/* STEP 1: Verify Current Password */}
                    {wizardStep === 1 && (
                      <form onSubmit={handleVerifyPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ border: '1px solid rgba(255,99,71,0.25)', background: 'rgba(255,99,71,0.02)', borderRadius: '8px', padding: '12px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff6b35', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
                            🔒 Identity Verification Check Required
                          </h4>
                          <p style={{ fontSize: '10px', color: '#8892a4', margin: 0, lineHeight: '1.4' }}>
                            You are about to modify sensitive credentials. To unlock config access, please input your current operator access code password.
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Current Password</label>
                          <div style={{ position: 'relative' }}>
                            <Key size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                              type="password"
                              placeholder="Enter password to authorize"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              required
                              autoFocus
                              style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px 8px 32px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          style={{ background: '#06b6d4', color: '#020617', border: 'none', borderRadius: '6px', padding: '10px 0', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          {loading ? 'VERIFYING...' : 'AUTHORIZE PROTOCOL'}
                          {!loading && <ChevronRight size={13} />}
                        </button>
                      </form>
                    )}

                    {/* STEP 2: Configure Details */}
                    {wizardStep === 2 && (
                      <form onSubmit={handleCommitChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        {/* 2A. Name configuration */}
                        {wizardType === 'name' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Configure New Full Name</label>
                            <div style={{ position: 'relative' }}>
                              <User size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                                autoFocus
                                style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px 8px 32px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* 2B. Email configuration */}
                        {wizardType === 'email' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Configure New Email Address</label>
                            <div style={{ position: 'relative' }}>
                              <Mail size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                              <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                required
                                autoFocus
                                style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px 8px 32px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* 2C. Password configuration */}
                        {wizardType === 'password' && (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>New Password</label>
                              <div style={{ position: 'relative' }}>
                                <Key size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                <input
                                  type="password"
                                  placeholder="Minimum 6 characters"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  required
                                  autoFocus
                                  style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px 8px 32px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Verify New Password</label>
                              <div style={{ position: 'relative' }}>
                                <Key size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                <input
                                  type="password"
                                  placeholder="Verify new access code"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  required
                                  style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px 8px 32px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          style={{ background: '#10b981', color: '#020617', border: 'none', borderRadius: '6px', padding: '10px 0', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 0 10px rgba(16,185,129,0.15)' }}
                        >
                          {loading ? 'COMMITTING CHANGE...' : 'CONFIRM & SAVE'}
                          {!loading && <ChevronRight size={13} />}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* 1. Profile Settings Tab */}
                {activeTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
                        Operator Information
                      </h3>
                      <p style={{ fontSize: '10px', color: '#8892a4', margin: 0 }}>
                        Configure secure handle and routing details below.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Name Card */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '2px' }}>OPERATOR HANDLE</div>
                          <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 'bold' }}>{currentUser?.fullName}</div>
                        </div>
                        <button
                          onClick={() => startWizard('name')}
                          style={{ background: 'transparent', border: '1px solid #06b6d4', color: '#06b6d4', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          EDIT HANDLE
                        </button>
                      </div>

                      {/* Email Card */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '2px' }}>REGISTERED EMAIL</div>
                          <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 'bold' }}>{currentUser?.email}</div>
                        </div>
                        <button
                          onClick={() => startWizard('email')}
                          style={{ background: 'transparent', border: '1px solid #06b6d4', color: '#06b6d4', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          EDIT EMAIL
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Security Tab */}
                {activeTab === 'security' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
                        Credentials & Access Keys
                      </h3>
                      <p style={{ fontSize: '10px', color: '#8892a4', margin: 0 }}>
                        Safeguard access codes and verify channel integrity.
                      </p>
                    </div>

                    <div style={{ background: 'rgba(6,182,212,0.02)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>ACCESS PASSWORD</div>
                        <div style={{ fontSize: '10px', color: '#8892a4', lineHeight: '1.4' }}>Rotate credentials regularly using secure, randomized codes.</div>
                      </div>
                      <button
                        onClick={() => startWizard('password')}
                        style={{ background: '#06b6d4', color: '#020617', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 10px rgba(6,182,212,0.2)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#22d3ee'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#06b6d4'}
                      >
                        ROTATE ACCESS PASSWORD
                      </button>
                    </div>

                    {/* Cyber Encryption Details Box */}
                    <div style={{ margin: '8px 0', padding: '12px', background: 'rgba(2, 6, 23, 0.4)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#10b981', fontFamily: 'Courier New, monospace' }}>
                        <Check size={9} style={{ strokeWidth: 3 }} /> DATABASE ENCRYPT CHANNEL... COMPLETED
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#10b981', fontFamily: 'Courier New, monospace' }}>
                        <Check size={9} style={{ strokeWidth: 3 }} /> CRYPTO SIGNATURE METHOD... PBKDF2-SHA512
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. System Preferences Tab (Our highly customized suggested features!) */}
                {activeTab === 'system' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
                        Tactical View Preferences
                      </h3>
                      <p style={{ fontSize: '10px', color: '#8892a4', margin: 0 }}>
                        Configure default behaviors to automatically trigger when the link loads.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="preferences-grid">
                      {/* Map Style Option */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 'bold' }}>Default Base Map Style</div>
                          <div style={{ fontSize: '9px', color: '#8892a4' }}>Google Satellite vs CartoDB Dark Matter.</div>
                        </div>
                        <select
                          value={mapStyle}
                          onChange={(e) => handlePreferenceChange('mapStyle', e.target.value)}
                          style={{ background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', padding: '4px 8px', color: '#ffffff', fontSize: '10px', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="satellite">Satellite (Hybrid)</option>
                          <option value="dark">Tactical Dark</option>
                        </select>
                      </div>

                      {/* Map Mode Option */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 'bold' }}>Default Map View Mode</div>
                          <div style={{ fontSize: '9px', color: '#8892a4' }}>Flat 2D Satellite vs 3D Buildings.</div>
                        </div>
                        <select
                          value={mapMode}
                          onChange={(e) => handlePreferenceChange('mapMode', e.target.value)}
                          style={{ background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', padding: '4px 8px', color: '#ffffff', fontSize: '10px', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="2d">2D Satellite Map</option>
                          <option value="3d">3D Google Buildings</option>
                        </select>
                      </div>

                      {/* Auto Rotation Default Option */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 'bold' }}>Globe Auto-Rotation</div>
                          <div style={{ fontSize: '9px', color: '#8892a4' }}>Enable earth rotation instantly on load.</div>
                        </div>
                        <select
                          value={autoRotate ? 'true' : 'false'}
                          onChange={(e) => handlePreferenceChange('autoRotate', e.target.value === 'true')}
                          style={{ background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', padding: '4px 8px', color: '#ffffff', fontSize: '10px', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="true">Active (ON)</option>
                          <option value="false">Static (OFF)</option>
                        </select>
                      </div>

                      {/* Marquee Speed Option */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 'bold' }}>Alert Marquee Ticker Speed</div>
                          <div style={{ fontSize: '9px', color: '#8892a4' }}>Speed configuration for headline ticker.</div>
                        </div>
                        <select
                          value={tickerSpeed}
                          onChange={(e) => handlePreferenceChange('tickerSpeed', e.target.value)}
                          style={{ background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', padding: '4px 8px', color: '#ffffff', fontSize: '10px', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="slow">Slow (110s) - Recommended</option>
                          <option value="normal">Normal (60s)</option>
                          <option value="fast">Fast (30s)</option>
                        </select>
                      </div>

                      {/* Severity Threshold Option */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: 'bold' }}>Startup Threat Severity filter</div>
                          <div style={{ fontSize: '9px', color: '#8892a4' }}>Filter out events with severities below limit.</div>
                        </div>
                        <select
                          value={minSeverity}
                          onChange={(e) => handlePreferenceChange('minSeverity', parseInt(e.target.value))}
                          style={{ background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', padding: '4px 8px', color: '#ffffff', fontSize: '10px', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value={1}>Severity 1+ (Show All)</option>
                          <option value={2}>Severity 2+ (Elevated)</option>
                          <option value={3}>Severity 3+ (High)</option>
                          <option value={4}>Severity 4+ (Critical)</option>
                          <option value={5}>Severity 5 (Catastrophic)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
                        FEEDBACK & SUGGESTIONS
                      </h3>
                      <p style={{ fontSize: '10px', color: '#8892a4', margin: 0 }}>
                        Submit suggestions, coordinates errors, or system bug reports directly to the developers.
                      </p>
                    </div>

                    {!currentUser && (
                      <div style={{
                        background: 'rgba(6, 182, 212, 0.05)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 0 15px rgba(6, 182, 212, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ShieldAlert size={14} style={{ color: '#06b6d4' }} />
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Anonymous Session Active
                          </span>
                        </div>
                        <p style={{ fontSize: '10px', color: '#8892a4', margin: 0, lineHeight: '1.4' }}>
                          You are currently submitting feedback anonymously. To track operator credentials, receive developer responses, and unlock all advanced features, consider registering a secure account.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenAuth) onOpenAuth();
                            else onClose();
                          }}
                          style={{
                            alignSelf: 'flex-start',
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid #06b6d4',
                            color: '#06b6d4',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'}
                        >
                          [⚡ Secure Sign Up]
                        </button>
                      </div>
                    )}

                    {successSuggestions ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                        <Check size={32} style={{ color: '#10b981', marginBottom: '12px' }} />
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', marginBottom: '8px' }}>Thank you for the feedback!</span>
                        <p style={{ fontSize: '11px', color: '#8892a4', margin: '0 0 16px 0', maxWidth: '320px', lineHeight: '1.5' }}>
                          Your report has been securely transmitted and logged to the developer console.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <a
                            href="/mock-email.html"
                            target="_blank"
                            style={{
                              background: 'rgba(234, 179, 8, 0.1)',
                              border: '1px solid rgba(234, 179, 8, 0.3)',
                              color: '#eab308',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.18)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(234, 179, 8, 0.1)'}
                          >
                            [📂 OPEN MOCK INBOX]
                          </a>

                          <button
                            onClick={() => {
                              setSuccessSuggestions(false);
                              setSuggestionSubject('');
                              setSuggestionDetails('');
                              setSuggestionTargetId('');
                              setSuggestionScreenshot(null);
                              setGuestName('');
                              setGuestEmail('');
                            }}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '6px', padding: '8px 16px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          >
                            SUBMIT MORE FEEDBACK
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSuggestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {errorSuggestions && (
                          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '10px 12px', color: '#ef4444', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <ShieldAlert size={14} />
                            <span>{errorSuggestions}</span>
                          </div>
                        )}

                        {!currentUser && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Your Name (Optional)</label>
                              <input
                                type="text"
                                placeholder="Anonymous Operator"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Your Email (Optional)</label>
                              <input
                                type="email"
                                placeholder="unknown@sovereign.net"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
                              />
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Report Type</label>
                            <select
                              value={suggestionType}
                              onChange={(e) => setSuggestionType(e.target.value)}
                              style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '11px', outline: 'none', cursor: 'pointer' }}
                            >
                              <option value="general">💡 General Suggestion</option>
                              <option value="bug">🐛 System Bug Report</option>
                              <option value="map">📍 Incorrect Map Coordinates</option>
                              <option value="link">🔗 Broken Intelligence Link</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Target Point / Link ID (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. event-105 or broken URL"
                              value={suggestionTargetId}
                              onChange={(e) => setSuggestionTargetId(e.target.value)}
                              style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Subject</label>
                          <input
                            type="text"
                            placeholder="Brief summary of suggestion/issue"
                            value={suggestionSubject}
                            onChange={(e) => setSuggestionSubject(e.target.value)}
                            required
                            style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '11px', outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Details & Description</label>
                          <textarea
                            rows={3}
                            placeholder="Please provide full contextual details..."
                            value={suggestionDetails}
                            onChange={(e) => setSuggestionDetails(e.target.value)}
                            required
                            style={{ width: '100%', background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#ffffff', fontSize: '11px', outline: 'none', resize: 'vertical', fontFamily: 'sans-serif' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '10px', color: '#8892a4', textTransform: 'uppercase', fontWeight: 600 }}>Attach Screenshot / Image (Optional)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px dashed rgba(6, 182, 212, 0.3)',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              color: '#06b6d4',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                            >
                              📁 SELECT IMAGE
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                              />
                            </label>
                            {suggestionScreenshot && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '4px', padding: '6px 10px' }}>
                                <span style={{ color: '#10b981', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>✓ ATTACHED</span>
                                <button 
                                  type="button" 
                                  onClick={() => setSuggestionScreenshot(null)} 
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', padding: 0 }}
                                >
                                  REMOVE
                                </button>
                              </div>
                            )}
                          </div>
                          {suggestionScreenshot && (
                            <img src={suggestionScreenshot} style={{ maxWidth: '120px', maxHeight: '80px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', marginTop: '6px' }} alt="Preview" />
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={loadingSuggestions}
                          style={{ background: '#06b6d4', color: '#020617', border: 'none', borderRadius: '6px', padding: '10px 0', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 0 10px rgba(6,182,212,0.15)', marginTop: '4px' }}
                        >
                          {loadingSuggestions ? 'TRANSMITTING FEEDBACK...' : 'SUBMIT FEEDBACK'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Styled Animations Injected */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @media (max-width: 600px) {
          .settings-body {
            flex-direction: column !important;
          }
          .settings-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 8px 12px !important;
          }
          .settings-sidebar > div {
            display: flex !important;
            flex-direction: row !important;
            flex: 1 !important;
            justify-content: space-around !important;
            gap: 4px !important;
          }
          .settings-sidebar button {
            padding: 8px 10px !important;
            font-size: 8.5px !important;
            justify-content: center !important;
            flex: 1 !important;
            gap: 4px !important;
          }
          .settings-sidebar .logout-btn {
            width: auto !important;
            margin-left: 8px !important;
            padding: 8px 12px !important;
          }
          @media (max-width: 480px) {
            .settings-sidebar button {
              font-size: 0px !important; /* Hide text, keep only icon */
              padding: 10px !important;
            }
            .settings-sidebar .logout-text {
              display: none !important;
            }
          }
        }
      `}</style>
    </div>
  );
}
