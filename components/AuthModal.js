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
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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

      if (data.pending) {
        setRegisteredEmail(email);
        setIsPendingVerification(true);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--sov-bg)',
    border: '1px solid var(--sov-border)',
    borderRadius: '8px',
    padding: '10px 12px 10px 36px',
    color: 'var(--sov-text)',
    fontSize: '13.5px',
    outline: 'none'
  };

  const labelStyle = {
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--sov-muted)',
    letterSpacing: '0.02em'
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'var(--sov-backdrop)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div
        className="sov-modal-shell"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: 'var(--sov-panel-bg)',
          border: '1px solid var(--sov-border)',
          borderRadius: '14px',
          padding: '28px 24px',
          boxShadow: 'var(--sov-shadow)',
          color: 'var(--sov-text)'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Sign In"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            border: '1px solid var(--sov-border)',
            background: 'var(--sov-card-bg)',
            color: 'var(--sov-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={15} />
        </button>

        {/* Clean Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', textAlign: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--sov-accent-soft)',
              border: '1px solid var(--sov-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sov-accent)',
              marginBottom: '12px'
            }}
          >
            <Shield size={22} />
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '19px', fontWeight: 700, color: 'var(--sov-text)' }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--sov-muted)' }}>
            Sovereign Global AI Policy Observatory
          </p>
        </div>

        {/* Clean Sign In / Sign Up Switch */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            background: 'var(--sov-card-bg)',
            border: '1px solid var(--sov-border)',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '18px'
          }}
        >
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              background: !isRegister ? 'var(--sov-panel-bg)' : 'transparent',
              border: !isRegister ? '1px solid var(--sov-border)' : '1px solid transparent',
              color: !isRegister ? 'var(--sov-text)' : 'var(--sov-muted)',
              borderRadius: '6px',
              padding: '7px 0',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              background: isRegister ? 'var(--sov-panel-bg)' : 'transparent',
              border: isRegister ? '1px solid var(--sov-border)' : '1px solid transparent',
              color: isRegister ? 'var(--sov-text)' : 'var(--sov-muted)',
              borderRadius: '6px',
              padding: '7px 0',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: 'var(--sov-danger)',
              fontSize: '12.5px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', textAlign: 'center', gap: '10px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sov-emerald)'
              }}
            >
              <Check size={22} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--sov-text)' }}>Signed In</div>
            <div style={{ fontSize: '12.5px', color: 'var(--sov-muted)' }}>Syncing saved bookmarks and workspace preferences…</div>
          </div>
        ) : isPendingVerification ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'var(--sov-accent-soft)',
                  border: '1px solid var(--sov-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--sov-accent)'
                }}
              >
                <Mail size={22} />
              </div>
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--sov-text)' }}>Check Your Inbox</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--sov-muted)', lineHeight: 1.55 }}>
              We sent a verification link (valid for 15 minutes) to <strong style={{ color: 'var(--sov-text)' }}>{registeredEmail}</strong>. Check your spam folder if it does not arrive within two minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsPendingVerification(false);
                setIsRegister(false);
                setError(null);
              }}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: '8px',
                border: '1px solid var(--sov-border)',
                background: 'var(--sov-card-bg)',
                color: 'var(--sov-text)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={labelStyle}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sov-muted)' }} />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: '12px', cursor: 'pointer' }}
                  >
                    <option value="researcher">Researcher / Academic</option>
                    <option value="ethicist">AI Policy &amp; Ethics Specialist</option>
                    <option value="analyst">Policy Analyst</option>
                    <option value="observer">Human Rights / Civil Society Observer</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sov-muted)' }} />
                <input
                  type="email"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sov-muted)' }} />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="keep-light-text"
              style={{
                width: '100%',
                marginTop: '4px',
                background: 'var(--sov-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '11px 0',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>{loading ? 'Signing in…' : isRegister ? 'Create Account' : 'Sign In'}</span>
              {!loading && <ChevronRight size={15} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
