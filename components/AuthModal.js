'use client';
import { useState } from 'react';
import { Shield, Key, Mail, User, ShieldAlert, X, ChevronRight, Check } from 'lucide-react';

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('researcher');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister 
        ? { email, password, fullName, role }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccess(true);
      
      // Delay closing modal slightly to show premium success animation
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
        maxWidth: '460px',
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
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          margin: '0 0 8px 0'
        }}>
          System Access Control
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#8892a4',
          fontSize: '13px',
          margin: '0 0 24px 0',
          fontFamily: 'Courier New, monospace'
        }}>
          [ SOVEREIGN INTELLIGENCE PLATFORM ]
        </p>

        {/* Switch Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(2, 6, 23, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              background: !isRegister ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              border: 'none',
              color: !isRegister ? '#ffffff' : '#8892a4',
              borderRadius: '6px',
              padding: '8px 0',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              boxShadow: !isRegister ? '0 0 10px rgba(6, 182, 212, 0.1)' : 'none'
            }}
          >
            AUTHENTICATE
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              background: isRegister ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              border: 'none',
              color: isRegister ? '#ffffff' : '#8892a4',
              borderRadius: '6px',
              padding: '8px 0',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              boxShadow: isRegister ? '0 0 10px rgba(6, 182, 212, 0.1)' : 'none'
            }}
          >
            ACCESS REGISTRY
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            color: '#ef4444',
            fontSize: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            animation: 'shake 0.3s'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
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
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              margin: '0 0 8px 0',
              textTransform: 'uppercase'
            }}>
              Access Granted
            </p>
            <p style={{
              color: 'rgba(16, 185, 129, 0.6)',
              fontSize: '12px',
              fontFamily: 'Courier New, monospace',
              margin: 0
            }}>
              [ INITIALIZING SYSTEM PROFILE ]
            </p>
          </div>
        ) : (
          /* Form Block */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <>
                {/* Full Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(2, 6, 23, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '10px 12px 10px 36px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    />
                  </div>
                </div>

                {/* Role / Assignment */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(2, 6, 23, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  >
                    <option value="researcher">Researcher</option>
                    <option value="student">Student</option>
                    <option value="observer">Human Rights Observer</option>
                    <option value="civilian">Civilian</option>
                    <option value="military">Military/Government</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            {/* Email Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                <input
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px 10px 36px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#8892a4', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px 10px 36px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>
            </div>

            {/* Verification Checklist */}
            <div style={{
              margin: '8px 0',
              padding: '12px',
              background: 'rgba(2, 6, 23, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#10b981', fontFamily: 'Courier New, monospace' }}>
                <Check size={10} style={{ strokeWidth: 3 }} /> DATABASE CHANNEL... ONLINE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#10b981', fontFamily: 'Courier New, monospace' }}>
                <Check size={10} style={{ strokeWidth: 3 }} /> CRYPTO COMPATIBILITY... PBKDF2-SHA512
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#06b6d4',
                color: '#020617',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 0',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#22d3ee';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(6, 182, 212, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#06b6d4';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.2)';
                }
              }}
            >
              {loading ? 'PROCESSING...' : isRegister ? 'REGISTER' : 'AUTHENTICATE'}
              {!loading && <ChevronRight size={16} />}
            </button>
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
