import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Check if SMTP environment variables are configured
const isSmtpConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
};

export async function sendVerificationEmail(email, token, fullName, host) {
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const verificationLink = `${protocol}://${host}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
  
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
          <h1 class="title">Monitor the Situation</h1>
          <p class="subtitle">[ SOVEREIGN COMMAND GATEWAY ]</p>
        </div>
        
        <div class="content">
          <p class="welcome-text">
            Greetings, <strong>${fullName}</strong>. An account registry request has been initialized for this address. Before access is fully authenticated, please verify your email connection.
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
          <p>If you did not request this registry handshake, you can safely ignore this email.</p>
          <p class="footer-warning">© Sovereign Intelligence Dashboard // Monitor the Situation</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (isSmtpConfigured()) {
    console.log(`[MAILER] Dispatching actual verification email to ${email} via SMTP...`);
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
      from: process.env.SMTP_FROM || '"Monitor the Situation" <noreply@monitor-the-situation.com>',
      to: email,
      subject: '🛡️ Action Required: Authenticate your Sovereign account',
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] SMTP email successfully sent to ${email}`);
  } else {
    // Local dev mode - print to terminal console and write to public/mock-email.html for mock-inbox feature
    console.warn('\n' + '='.repeat(80));
    console.warn('🛡️  [DEVELOPMENT EMAIL SIMULATOR]  🛡️');
    console.warn(`Verification email triggered for: ${email}`);
    console.warn(`Name: ${fullName}`);
    console.warn(`Verification Handshake URL:\n  ${verificationLink}`);
    console.warn('='.repeat(80) + '\n');

    // Create the public folder if it doesn't exist
    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const mockEmailFile = path.join(publicDir, 'mock-email.html');
    
    // Write full email content, with a small top bar explaining it's a simulated dev email
    const devHTML = `
      <div style="background: #0f172a; border-bottom: 2px solid #ef4444; padding: 12px; font-family: monospace; color: #f8fafc; font-size: 13px; text-align: center; display: flex; justify-content: center; align-items: center; gap: 12px; z-index: 99999; position: relative;">
        <span style="color: #ef4444; font-weight: bold;">[🔒 LOCAL DEVELOPMENT EMAIL SIMULATOR]</span>
        <span>Target: ${email}</span>
        <span>|</span>
        <a href="${verificationLink}" style="color: #38bdf8; text-decoration: underline; font-weight: bold;">Click Here to Simulate Verification Link</a>
      </div>
      ${htmlContent}
    `;

    fs.writeFileSync(mockEmailFile, devHTML, 'utf8');
    console.log(`[MAILER] Mock email generated successfully at: ${mockEmailFile}`);
  }
}

export async function sendSuggestionEmail({ type, subject, details, targetId, operatorEmail, operatorName, host }) {
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
            <div class="feed-type">${type.toUpperCase()} REPORT</div>
            <h2 class="feed-subject">${subject}</h2>
          </div>
          
          <div class="info-box">
            <p class="instructions">${details}</p>
          </div>

          <table class="telemetry-table">
            <tr>
              <td class="telemetry-label">SUBMITTER HANDLE:</td>
              <td style="color: #ffffff;">${operatorName}</td>
            </tr>
            <tr>
              <td class="telemetry-label">SUBMITTER EMAIL:</td>
              <td style="color: #06b6d4;">${operatorEmail}</td>
            </tr>
            ${targetId ? `
            <tr>
              <td class="telemetry-label">TARGET POINT / LINK:</td>
              <td style="color: #f59e0b; font-weight: bold;">${targetId}</td>
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

  if (isSmtpConfigured()) {
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
    console.log(`[MAILER] Feedback email successfully sent to workwithavip@gmail.com`);
  } else {
    // Local dev mode - print to terminal console and write to public/mock-email.html for mock-inbox feature
    console.warn('\n' + '='.repeat(80));
    console.warn('🛡️  [DEVELOPMENT EMAIL SIMULATOR]  🛡️');
    console.warn(`Feedback email triggered for: workwithavip@gmail.com`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Type: ${type}`);
    console.warn(`Details:\n  ${details}`);
    console.warn('='.repeat(80) + '\n');

    // Create the public folder if it doesn't exist
    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const mockEmailFile = path.join(publicDir, 'mock-email.html');
    
    // Write full email content, with a small top bar explaining it's a simulated dev email
    const devHTML = `
      <div style="background: #0f172a; border-bottom: 2px solid #ef4444; padding: 12px; font-family: monospace; color: #f8fafc; font-size: 13px; text-align: center; display: flex; justify-content: center; align-items: center; gap: 12px; z-index: 99999; position: relative;">
        <span style="color: #eab308; font-weight: bold;">[💡 LOCAL DEVELOPMENT EMAIL SIMULATOR]</span>
        <span>Target: workwithavip@gmail.com</span>
        <span>|</span>
        <span style="color: #cbd5e1;">Received Feedback Intelligence Report</span>
      </div>
      ${htmlContent}
    `;

    fs.writeFileSync(mockEmailFile, devHTML, 'utf8');
    console.log(`[MAILER] Mock feedback email generated successfully at: ${mockEmailFile}`);
  }
}
