'use client';
import { useState } from 'react';
import { Shield, Key, Mail, User, ShieldAlert, X, ChevronRight, Check, LogOut } from 'lucide-react';

export default function AccountModal({ onClose, currentUser, onAuthSuccess, handleLogout }) {
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (newPassword && newPassword !== confirmNewPassword) {
      setError('Password validation failed: new passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('Password validation failed: new password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          fullName,
          email,
          currentPassword,
          newPassword: newPassword || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Account update failed');
      }

      setSuccess(true);
      
      // Delay closing modal slightly to show success animation
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAction = () => {
    handleLogout();
    onClose();
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
      {/* Background Cyber-Grid Effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none'
      }} />

      {/* Main Glassmorphic Panel */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(8, 12, 24, 0.9)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 0 40px rgba(6, 182, 212, 0.15), inset 0 0 20px rgba(6, 182, 212, 0.05)',
        overflow: 'hidden',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* HUD Tactical Corners */}
        <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderTop: '2px solid #06b6d4', borderLeft: '2px solid #06b6d4', opacity: 0.6 }} />
        <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderTop: '2px solid #06b6d4', borderRight: '2px solid #06b6d4', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: 12, left: 12, width: 16, height: 16, borderBottom: '2px solid #06b6d4', borderLeft: '2px solid #06b6d4', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: 12, right: 12, width: 16, height: 16, borderBottom: '2px solid #06b6d4', borderRight: '2px solid #06b6d4', opacity: 0.6 }} />

        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: 'none',
            color: 'rgba(16, 185, 129, 0.6)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: '50%',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#10b981';
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(16, 185, 129, 0.6)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#06b6d4',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.1)',
          }}>
            <Shield size={32} />
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          textAlign: 'center',
          color: '#ffffff',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          margin: '0 0 4px 0'
        }}>
          Operator Profile Setup
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#8892a4',
          fontSize: '11px',
          margin: '0 0 20px 0',
          fontFamily: 'Courier New, monospace'
        }}>
          [ ID: {currentUser?.id?.substring(0, 8)} • ROLE: {currentUser?.role?.toUpperCase()} ]
        </p>

        {/* Error Notification */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: '#ef4444',
            fontSize: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            animation: 'shake 0.3s'
          }}>
            <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 0',
            animation: 'fadeIn 0.3s'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
              marginBottom: '16px',
              animation: 'scaleIn 0.3s'
            }}>
              <Check size={24} />
            </div>
            <p style={{
              color: '#10b981',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              margin: '0 0 8px 0',
              textTransform: 'uppercase'
            }}>
              Credentials Verified & Updated
            </p>
            <p style={{
              color: 'rgba(16, 185, 129, 0.6)',
              fontSize: '11px',
              fontFamily: 'Courier New, monospace',
              margin: 0
            }}>
              [ SYNCING SECURE TELEMETRY TO DATABASE ]
            </p>
          </div>
        ) : (
          /* Form Block */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Operator Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 10px 8px 32px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>
            </div>

            {/* Email Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 10px 8px 32px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

            {/* Current Password (Identity verification - always required to commit any edits!) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: '#ff6b35', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Current Password <span style={{ color: 'rgba(255,255,255,0.3)' }}>(Required to save changes)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                <input
                  type="password"
                  placeholder="Enter current password to authorize"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255, 99, 71, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 10px 8px 32px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 99, 71, 0.25)'}
                />
              </div>
            </div>

            {/* New Password (Optional) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                New Password <span style={{ color: 'rgba(255,255,255,0.3)' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 10px 8px 32px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>
            </div>

            {/* Confirm New Password (Optional) */}
            {newPassword && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', animation: 'fadeIn 0.2s' }}>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                  <input
                    type="password"
                    placeholder="Verify new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required={!!newPassword}
                    style={{
                      width: '100%',
                      background: 'rgba(2, 6, 23, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 10px 8px 32px',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogoutAction}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <LogOut size={14} />
                LOGOUT
              </button>

              {/* Submit Save Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: '#06b6d4',
                  color: '#020617',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#22d3ee';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#06b6d4';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(6, 182, 212, 0.2)';
                  }
                }}
              >
                {loading ? 'SAVING...' : 'SAVE CHANGES'}
                {!loading && <ChevronRight size={14} />}
              </button>
            </div>
          </form>
        )}
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
      `}</style>
    </div>
  );
}
