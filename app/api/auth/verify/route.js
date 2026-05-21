import { NextResponse } from 'next/server';
import { getUserByEmail, verifyUser, initDb } from '@/lib/db';

export async function GET(req) {
  try {
    await initDb();
    
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    // Cyberpunk-themed CSS & styles shared by both success and error screens
    const baseStyles = `
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #020617;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          overflow: hidden;
        }
        .cyber-grid {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), 
                      linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
          z-index: 1;
        }
        .main-panel {
          position: relative;
          width: 90%;
          max-width: 480px;
          background: rgba(8, 12, 24, 0.95);
          padding: 40px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
          z-index: 10;
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hud-corner {
          position: absolute;
          width: 16px;
          height: 16px;
          opacity: 0.6;
        }
        .top-left { top: 12px; left: 12px; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent); }
        .top-right { top: 12px; right: 12px; border-top: 2px solid var(--accent); border-right: 2px solid var(--accent); }
        .bottom-left { bottom: 12px; left: 12px; border-bottom: 2px solid var(--accent); border-left: 2px solid var(--accent); }
        .bottom-right { bottom: 12px; right: 12px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); }
        
        .icon-box {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px auto;
          font-size: 28px;
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.2);
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          background: rgba(var(--accent-rgb), 0.08);
        }
        h1 {
          color: #ffffff;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }
        .subtitle {
          color: #8892a4;
          font-size: 13px;
          font-family: 'Courier New', Courier, monospace;
          margin: 0 0 32px 0;
          letter-spacing: 1px;
        }
        .status-terminal {
          background: rgba(2, 6, 23, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 20px;
          text-align: left;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #cbd5e1;
          margin-bottom: 24px;
        }
        .terminal-line {
          margin: 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .terminal-line.success-text { color: #10b981; }
        .terminal-line.error-text { color: #ef4444; }
        
        .loader {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--accent);
          display: inline-block;
          animation: pulse 1.2s infinite ease-in-out;
        }
        
        .btn-redirect {
          display: inline-block;
          width: 100%;
          padding: 12px 0;
          background: var(--accent);
          color: #020617;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 8px;
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.2);
          transition: all 0.2s;
        }
        .btn-redirect:hover {
          background: var(--accent-hover);
          box-shadow: 0 0 25px rgba(var(--accent-rgb), 0.4);
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      </style>
    `;

    // 1. Validation Checks
    if (!token || !email) {
      return serveErrorHTML("ACCESS CODE EXPIRED / ERROR: INVALID HANDSHAKE", "Missing handshake verification parameters. Please initiate registration again.", baseStyles);
    }

    const cleanEmail = email.toLowerCase().trim();
    
    // Retrieve registered user
    const user = await getUserByEmail(cleanEmail);
    if (!user) {
      return serveErrorHTML("HANDSHAKE EXPIRED OR INVALID", "The operator email profile was not found. Please register again.", baseStyles);
    }

    // If user is already verified (resilience for double clicking)
    if (user.is_verified) {
      return serveSuccessHTML(user, baseStyles);
    }

    // Compare token
    if (!user.verification_token || user.verification_token !== token) {
      return serveErrorHTML("HANDSHAKE EXPIRED OR INVALID", "The secure auth token was not found or is misaligned with the operator email profile.", baseStyles);
    }

    // Check expiration
    if (user.verification_expires_at) {
      const expiryDate = new Date(user.verification_expires_at);
      if (new Date() > expiryDate) {
        return serveErrorHTML("ACCESS PROTOCOL TIME-LOCKED", "Security constraint violation: this verification handshake link has expired (15-minute validity reached).", baseStyles);
      }
    }

    // 2. Verify operator and update state
    let verifiedUser;
    try {
      verifiedUser = await verifyUser(user.id);
    } catch (dbErr) {
      console.error('Handshake db user verification error:', dbErr);
      return serveErrorHTML("DATABASE FAULT", "Could not verify operator profile due to an internal security storage conflict. Please contact support.", baseStyles);
    }

    // 3. Return success authentication response
    return serveSuccessHTML(verifiedUser, baseStyles);

  } catch (error) {
    console.error('Verify API Handshake Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Serves the elegant success authentication and local session write HTML page
function serveSuccessHTML(user, styles) {
  const userSession = {
    id: user.id,
    email: user.email,
    fullName: user.full_name || user.fullName,
    role: user.role,
    createdAt: user.created_at || user.createdAt
  };

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authentication Successful // Sovereign Dashboard</title>
      <meta name="theme-color" content="#020617">
      <style>
        :root {
          --accent: #06b6d4;
          --accent-hover: #22d3ee;
          --accent-rgb: 6, 182, 212;
        }
      </style>
      ${styles}
    </head>
    <body>
      <div class="cyber-grid"></div>
      
      <div class="main-panel">
        <div class="hud-corner top-left"></div>
        <div class="hud-corner top-right"></div>
        <div class="hud-corner bottom-left"></div>
        <div class="hud-corner bottom-right"></div>
        
        <div class="icon-box">🛡️</div>
        <h1>Access Authorized</h1>
        <p class="subtitle">[ SECURING PROTOCOL HANDSHAKE ]</p>
        
        <div class="status-terminal">
          <div class="terminal-line success-text">✔ DECRYPTING ENVELOPE SECRETS... OK</div>
          <div class="terminal-line success-text">✔ CREATING ENCRYPTED PROFILE... OK</div>
          <div class="terminal-line success-text">✔ REGISTERING TELEMETRY STATE... OK</div>
          <div class="terminal-line">
            <span class="loader"></span> INITIALIZING SECURE TERMINAL STATE...
          </div>
        </div>
        
        <a href="/" class="btn-redirect">ENTER OPERATIONAL HUD</a>
      </div>
      
      <script>
        // Securely write the credentials handshake token directly into the browser
        localStorage.setItem('operator_session', JSON.stringify(${JSON.stringify(userSession)}));
        
        // Auto-redirect to Sovereign Terminal Console
        setTimeout(() => {
          window.location.href = '/';
        }, 2200);
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Serves the custom error HTML page
function serveErrorHTML(title, description, styles) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authentication Failed // Sovereign Dashboard</title>
      <meta name="theme-color" content="#020617">
      <style>
        :root {
          --accent: #ef4444;
          --accent-hover: #f87171;
          --accent-rgb: 239, 68, 68;
        }
      </style>
      ${styles}
    </head>
    <body>
      <div class="cyber-grid"></div>
      
      <div class="main-panel" style="border: 1px solid rgba(239, 68, 68, 0.2);">
        <div class="hud-corner top-left"></div>
        <div class="hud-corner top-right"></div>
        <div class="hud-corner bottom-left"></div>
        <div class="hud-corner bottom-right"></div>
        
        <div class="icon-box">⚠️</div>
        <h1 style="color: #ef4444;">Handshake Denied</h1>
        <p class="subtitle" style="color: rgba(239, 68, 68, 0.6);">[ ACCESS PROTOCOL FAIL ]</p>
        
        <div class="status-terminal" style="border-color: rgba(239, 68, 68, 0.15);">
          <div class="terminal-line error-text">❌ STATUS: ACCESS_DENIED</div>
          <div class="terminal-line error-text" style="white-space: pre-wrap;">❌ DETAILS: ${description}</div>
        </div>
        
        <a href="/" class="btn-redirect" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444;">RETURN TO GATEWAY</a>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
