import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Gmail via App Password — works for ANY recipient, no domain verification needed
const isGmailConfigured = () => !!(
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
);

// Generic SMTP environment variables
const isSmtpConfigured = () => !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD
);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendVerificationEmail(email, token, fullName, host) {
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const verificationLink = `${protocol}://${host}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
  const safeFullName = escapeHtml(fullName);
  
  // Tactical cyber-styled HTML email design
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authenticate Sovereign Account</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #020617;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #cbd5e1;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #080c18;
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.05);
        }
        .header {
          padding: 32px;
          text-align: center;
          background: linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, transparent 100%);
          border-bottom: 1px solid rgba(6, 182, 212, 0.1);
        }
        .logo-box {
          display: inline-block;
          width: 54px;
          height: 54px;
          line-height: 54px;
          border-radius: 50%;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: #06b6d4;
          font-size: 26px;
          font-weight: bold;
          margin-bottom: 16px;
        }
        .title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #ffffff;
          margin: 0 0 4px 0;
        }
        .subtitle {
          font-size: 11px;
          font-family: 'Courier New', Courier, monospace;
          color: #06b6d4;
          margin: 0;
          letter-spacing: 1px;
        }
        .content {
          padding: 36px 32px;
        }
        .welcome-text {
          font-size: 15px;
          line-height: 1.6;
          color: #e2e8f0;
          margin-top: 0;
          margin-bottom: 24px;
        }
        .info-box {
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .instructions {
          font-size: 14px;
          line-height: 1.5;
          color: #94a3b8;
          margin: 0 0 16px 0;
        }
        .cta-container {
          text-align: center;
          margin: 24px 0;
        }
        .btn-authenticate {
          display: inline-block;
          background-color: #06b6d4;
          color: #020617 !important;
          text-decoration: none !important;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 14px 36px;
          border-radius: 6px;
          box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);
          transition: all 0.2s ease;
        }
        .btn-authenticate:hover {
          background-color: #22d3ee;
          box-shadow: 0 6px 20px rgba(6, 182, 212, 0.5);
        }
        .raw-link-title {
          font-size: 11px;
          font-family: 'Courier New', Courier, monospace;
          color: #64748b;
          margin-top: 24px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .raw-link {
          font-size: 12px;
          font-family: 'Courier New', Courier, monospace;
          color: #06b6d4;
          word-break: break-all;
          text-decoration: none;
        }
        .telemetry-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
          font-size: 11px;
          font-family: 'Courier New', Courier, monospace;
          color: #475569;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          padding-top: 16px;
        }
        .telemetry-table td {
          padding: 4px 0;
        }
        .telemetry-label {
          color: #64748b;
          width: 120px;
        }
        .footer {
          padding: 24px 32px;
          background-color: #040814;
          border-top: 1px solid rgba(255, 255, 255, 0.02);
          text-align: center;
          font-size: 11px;
          color: #475569;
        }
        .footer p {
          margin: 4px 0;
        }
        .footer-warning {
          color: #64748b;
          font-style: italic;
          margin-top: 12px !important;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-box">🛡️</div>
          <h1 class="title">Let's get you signed in</h1>
          <p class="subtitle">SOVEREIGN INTELLIGENCE DASHBOARD</p>
        </div>
        
        <div class="content">
          <p class="welcome-text">
            Hi <strong>${safeFullName}</strong>, your account has been created. To complete sign-in, please verify your email.
          </p>
          
          <div class="info-box">
            <p class="instructions">
              Click the button below to securely authenticate your email address. This verification handshake link is time-locked and will expire in <strong>15 minutes</strong>.
            </p>
            
            <div class="cta-container">
              <a href="${verificationLink}" class="btn-authenticate">AUTHENTICATE EMAIL</a>
            </div>
            
            <div class="raw-link-title">Or copy this link into your browser:</div>
            <a href="${verificationLink}" class="raw-link">${verificationLink}</a>
            
            <table class="telemetry-table">
              <tr>
                <td class="telemetry-label">SECURITY PROTOCOL:</td>
                <td>SHA256-TOKENIZED-OTP</td>
              </tr>
              <tr>
                <td class="telemetry-label">GATEWAY ORIGIN:</td>
                <td>${host}</td>
              </tr>
              <tr>
                <td class="telemetry-label">TELEMETRY ID:</td>
                <td>${token.substring(0, 16)}...</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div class="footer">
          <p>If you did not request this, you can safely ignore this email.</p>
          <p class="footer-warning">© Sovereign Intelligence Dashboard // <a href="https://aviperera.com" style="color: #64748b; text-decoration: none;">Avi Perera</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  // ── Priority 1: Gmail SMTP via App Password ──────────────────────────────
  // Works for ANY recipient email with zero restrictions. No domain verification needed.
  if (isGmailConfigured()) {
    console.log(`[MAILER] Dispatching verification email to ${email} via Gmail SMTP...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    const mailOptions = {
      from: `"Sovereign Intelligence" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🛡️ Action Required: Authenticate your Sovereign account',
      html: htmlContent,
    };
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Gmail SMTP verification email successfully sent to ${email}`);
    return;
  }

  // ── Priority 2: Resend API ────────────────────────────────────────────────
  // NOTE: On the free tier, Resend only delivers to the account owner's email.
  // For arbitrary recipients you need a verified custom domain on Resend.
  if (process.env.RESEND_API_KEY) {
    console.log(`[MAILER] Dispatching verification email to ${email} via Resend...`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: process.env.SMTP_FROM || 'Sovereign Security <onboarding@resend.dev>',
        to: email,
        subject: '🛡️ Action Required: Authenticate your Sovereign account',
        html: htmlContent
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      let parsedError = null;
      try { parsedError = JSON.parse(errText); } catch (e) { /* not JSON */ }

      let userFriendlyMessage = `Resend API Error (HTTP ${res.status})`;
      if (parsedError?.message) {
        const msg = parsedError.message;
        if (msg.includes('send emails to your own email address') || msg.includes('non-verified domain') || msg.includes('restricted_api_key')) {
          userFriendlyMessage = `Email delivery failed: Resend free-tier only delivers to your Resend account owner email. Add GMAIL_USER + GMAIL_APP_PASSWORD to your Vercel env vars to send to any address, or verify a custom domain on Resend.`;
        } else if (msg.includes('API key is invalid')) {
          userFriendlyMessage = `Invalid Resend API Key: Please verify the RESEND_API_KEY in your Vercel environment variables.`;
        } else {
          userFriendlyMessage = `Resend API Error: ${msg}`;
        }
      } else if (errText) {
        userFriendlyMessage = `Resend API Error: ${errText}`;
      }
      console.error(`[MAILER] ${userFriendlyMessage}`);
      throw new Error(userFriendlyMessage);
    }
    console.log(`[MAILER] Resend verification email successfully dispatched to ${email}`);
    return;
  }

  // ── Priority 3: Generic SMTP ──────────────────────────────────────────────
  if (isSmtpConfigured()) {
    console.log(`[MAILER] Dispatching verification email to ${email} via SMTP...`);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Monitor the Situation" <noreply@monitor-the-situation.com>',
      to: email,
      subject: '🛡️ Action Required: Authenticate your Sovereign account',
      html: htmlContent,
    });
    console.log(`[MAILER] SMTP verification email successfully sent to ${email}`);
    return;
  }

  // ── Priority 4: Local dev console log only (never write OTP tokens to public/!) ──
  console.warn('\n' + '='.repeat(80));
  console.warn('🛡️  [DEVELOPMENT EMAIL SIMULATOR]  🛡️');
  console.warn(`Verification email triggered for: ${email}`);
  console.warn(`Name: ${fullName}`);
  console.warn(`Verification Handshake URL:\n  ${verificationLink}`);
  console.warn('='.repeat(80) + '\n');
}

export async function sendSuggestionEmail({ type, subject, details, targetId, operatorEmail, operatorName, screenshot, host }) {
  const safeType = escapeHtml(type || 'suggestion');
  const safeSubject = escapeHtml(subject);
  const safeDetails = escapeHtml(details);
  const safeOperatorName = escapeHtml(operatorName);
  const safeOperatorEmail = escapeHtml(operatorEmail);
  const safeTargetId = escapeHtml(targetId);
  // Tactical cyber-styled HTML suggestion email design
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sovereign Feedback Intelligence Report</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #020617;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #cbd5e1;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #080c18;
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.05);
        }
        .header {
          padding: 32px;
          text-align: center;
          background: linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, transparent 100%);
          border-bottom: 1px solid rgba(6, 182, 212, 0.1);
        }
        .logo-box {
          display: inline-block;
          width: 54px;
          height: 54px;
          line-height: 54px;
          border-radius: 50%;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: #06b6d4;
          font-size: 26px;
          font-weight: bold;
          margin-bottom: 16px;
        }
        .title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #ffffff;
          margin: 0 0 4px 0;
        }
        .subtitle {
          font-size: 11px;
          font-family: 'Courier New', Courier, monospace;
          color: #06b6d4;
          margin: 0;
          letter-spacing: 1px;
        }
        .content {
          padding: 36px 32px;
        }
        .feed-header {
          border-left: 4px solid #06b6d4;
          padding-left: 14px;
          margin-bottom: 24px;
        }
        .feed-type {
          font-size: 11px;
          font-family: 'Courier New', Courier, monospace;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
        }
        .feed-subject {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .info-box {
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .instructions {
          font-size: 14px;
          line-height: 1.6;
          color: #e2e8f0;
          white-space: pre-wrap;
          margin: 0;
        }
        .telemetry-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
          font-size: 11px;
          font-family: 'Courier New', Courier, monospace;
          color: #64748b;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 16px;
        }
        .telemetry-table td {
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
        }
        .telemetry-label {
          color: #94a3b8;
          font-weight: bold;
          width: 150px;
        }
        .footer {
          padding: 24px 32px;
          background-color: #040814;
          border-top: 1px solid rgba(255, 255, 255, 0.02);
          text-align: center;
          font-size: 11px;
          color: #475569;
        }
        .footer p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-box">💡</div>
          <h1 class="title">Sovereign Feedback Engine</h1>
          <p class="subtitle">[ SECURE INTELLIGENCE SUGGESTION REPORT ]</p>
        </div>
        
        <div class="content">
          <div class="feed-header">
            <div class="feed-type">${safeType.toUpperCase()} REPORT</div>
            <h2 class="feed-subject">${safeSubject}</h2>
          </div>
          
          <div class="info-box">
            <p class="instructions">${safeDetails}</p>
            ${screenshot ? `
            <div style="margin-top: 20px; border: 1px dashed rgba(6, 182, 212, 0.3); padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.4); text-align: center;">
              <div style="font-size: 10px; font-family: monospace; color: #06b6d4; margin-bottom: 8px; text-transform: uppercase;">[ Attached Screenshot / Image ]</div>
              <img src="${screenshot}" style="max-width: 100%; max-height: 300px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);" alt="Screenshot" />
            </div>` : ''}
          </div>
 
          <table class="telemetry-table">
            <tr>
              <td class="telemetry-label">SUBMITTER HANDLE:</td>
              <td style="color: #ffffff;">${safeOperatorName}</td>
            </tr>
            <tr>
              <td class="telemetry-label">SUBMITTER EMAIL:</td>
              <td style="color: #06b6d4;">${safeOperatorEmail}</td>
            </tr>
            ${safeTargetId ? `
            <tr>
              <td class="telemetry-label">TARGET POINT / LINK:</td>
              <td style="color: #f59e0b; font-weight: bold;">${safeTargetId}</td>
            </tr>` : ''}
            <tr>
              <td class="telemetry-label">TRANSMISSION TIME:</td>
              <td>${new Date().toISOString()}</td>
            </tr>
            <tr>
              <td class="telemetry-label">GATEWAY ORIGIN:</td>
              <td>${host}</td>
            </tr>
          </table>
        </div>
        
        <div class="footer">
          <p>This transmission is secure. Dispatched strictly to system administrator.</p>
          <p style="color: #64748b; font-style: italic;">© Sovereign Intelligence Dashboard // Monitor the Situation</p>
        </div>
      </div>
    </body>
    </html>
  `;

  let dispatched = false;

  // 1. Dispatch via Resend API (if RESEND_API_KEY is configured)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[MAILER] Dispatching feedback email to workwithavip@gmail.com via Resend...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'Sovereign Dashboard <onboarding@resend.dev>',
          to: 'workwithavip@gmail.com',
          subject: `💡 [SOVEREIGN FEEDBACK // ${type.toUpperCase()}] ${subject}`,
          html: htmlContent
        })
      });
      if (res.ok) {
        console.log(`[MAILER] Feedback email successfully sent to workwithavip@gmail.com via Resend`);
        dispatched = true;
      } else {
        const errText = await res.text();
        console.warn(`[MAILER] Resend API dispatch failed:`, errText);
      }
    } catch (e) {
      console.warn(`[MAILER] Resend API dispatch error:`, e.message);
    }
  }

  // 2. Dispatch via SMTP (if isSmtpConfigured() is true and not already sent via Resend)
  if (isSmtpConfigured() && !dispatched) {
    try {
      console.log(`[MAILER] Dispatching actual feedback email to workwithavip@gmail.com via SMTP...`);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Sovereign Feedback" <noreply@monitor-the-situation.com>',
        to: 'workwithavip@gmail.com',
        subject: `💡 [SOVEREIGN FEEDBACK // ${type.toUpperCase()}] ${subject}`,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[MAILER] Feedback email successfully sent to workwithavip@gmail.com via SMTP`);
      dispatched = true;
    } catch (e) {
      console.warn(`[MAILER] SMTP dispatch error:`, e.message);
    }
  }

  // 3. Dispatch via Discord Webhook (if DISCORD_WEBHOOK_URL is configured)
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      console.log(`[MAILER] Dispatching feedback alert to Discord Webhook...`);
      const res = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Sovereign Intel Bot',
          avatar_url: 'https://app.sovdash.com/icon.svg',
          embeds: [{
            title: `💡 sovereign feedback // ${type.toUpperCase()}`,
            description: `**Subject**: ${subject}\n\n**Details**:\n${details}`,
            color: type.toLowerCase() === 'bug' ? 16724821 : 5814783, // Red for bugs, Cyan for suggestions
            fields: [
              { name: 'Operator', value: `${operatorName} (${operatorEmail})`, inline: true },
              { name: 'Target ID', value: targetId || 'None', inline: true }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'Sovereign Intelligence Systems' }
          }]
        })
      });
      if (res.ok) {
        console.log(`[MAILER] Discord Webhook alert dispatched successfully!`);
        dispatched = true;
      } else {
        console.warn(`[MAILER] Discord Webhook response code: ${res.status}`);
      }
    } catch (e) {
      console.warn(`[MAILER] Discord Webhook alert failed:`, e.message);
    }
  }

  // 4. Dispatch via Telegram Bot (if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are configured)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      console.log(`[MAILER] Dispatching feedback alert to Telegram Bot...`);
      const text = `💡 *[SOVEREIGN FEEDBACK // ${type.toUpperCase()}]*\n\n*Subject*: ${subject}\n*Operator*: ${operatorName} (${operatorEmail})\n\n*Details*:\n${details}`;
      const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'Markdown'
        })
      });
      if (res.ok) {
        console.log(`[MAILER] Telegram Bot alert dispatched successfully!`);
        dispatched = true;
      } else {
        console.warn(`[MAILER] Telegram Bot response code: ${res.status}`);
      }
    } catch (e) {
      console.warn(`[MAILER] Telegram Bot alert failed:`, e.message);
    }
  }

  // 5. Fallback to server console log if no external email/webhook is configured
  if (!dispatched) {
    console.warn('\n' + '='.repeat(80));
    console.warn('🛡️  [FEEDBACK LOGGED TO DATABASE]  🛡️');
    console.warn(`Subject: ${subject} | Type: ${type}`);
    console.warn('='.repeat(80) + '\n');
  }
}

export async function sendWatchlistAlertEmail({ toEmail, watchlistName, matchedEvents = [] } = {}) {
  const cleanEmail = String(toEmail || '').trim();
  if (!cleanEmail || !Array.isArray(matchedEvents) || matchedEvents.length === 0) {
    return { sent: false, reason: 'no_recipients_or_events' };
  }

  const safeName = escapeHtml(watchlistName || 'Sovereign Watchlist');
  const slice = matchedEvents.slice(0, 8);
  const rowsHtml = slice.map((ev) => {
    const cleanId = encodeURIComponent(String(ev.id || '').replace(/^event-/, ''));
    const permalink = `https://app.sovdash.com/signal/${cleanId}`;
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(56,189,248,0.12);">
          <div style="font-size:11px;font-family:'Courier New',monospace;color:#06b6d4;margin-bottom:4px;">
            SEV-${Number(ev.severity) || 2} &bull; ${escapeHtml(ev.location || 'Global')} &bull; ${escapeHtml(ev.details?.source || ev.source || 'OSINT')}
          </div>
          <a href="${permalink}" style="font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
            ${escapeHtml(ev.title || 'AI Governance Signal')} &rarr;
          </a>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="margin:0;padding:24px;background:#020617;color:#cbd5e1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:620px;margin:0 auto;background:#080c18;border:1px solid rgba(6,182,212,0.3);border-radius:12px;overflow:hidden;">
        <div style="padding:24px;border-bottom:1px solid rgba(6,182,212,0.15);background:rgba(6,182,212,0.06);">
          <div style="font-size:11px;font-family:'Courier New',monospace;color:#06b6d4;letter-spacing:1.5px;">SOVEREIGN OBSERVATORY // WATCHLIST ALERT</div>
          <h2 style="margin:8px 0 0;color:#ffffff;font-size:18px;">${safeName} (${matchedEvents.length} match${matchedEvents.length === 1 ? '' : 'es'})</h2>
        </div>
        <div style="padding:20px 24px;">
          <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
          <div style="margin-top:20px;font-size:12px;color:#94a3b8;">
            Manage rules &amp; webhooks at <a href="https://app.sovdash.com/watchlists" style="color:#06b6d4;">app.sovdash.com/watchlists</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `🛡️ [Sovereign Alert] ${watchlistName}: ${matchedEvents.length} new AI policy signal${matchedEvents.length === 1 ? '' : 's'}`;

  if (isGmailConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
      });
      await transporter.sendMail({
        from: `"Sovereign Observatory Alerts" <${process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject,
        html: htmlContent
      });
      return { sent: true, transport: 'gmail' };
    } catch (e) {
      console.warn('[MAILER] Watchlist Gmail dispatch error:', e.message);
    }
  }

  if (isSmtpConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Sovereign Observatory Alerts" <noreply@monitor-the-situation.com>',
        to: cleanEmail,
        subject,
        html: htmlContent
      });
      return { sent: true, transport: 'smtp' };
    } catch (e) {
      console.warn('[MAILER] Watchlist SMTP dispatch error:', e.message);
    }
  }

  console.warn(`[MAILER] Watchlist alert (dry-run) -> ${cleanEmail} | ${watchlistName} (${matchedEvents.length} events)`);
  return { sent: false, reason: 'smtp_unconfigured' };
}
