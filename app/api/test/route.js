import { NextResponse } from 'next/server';

export async function GET() {
  const hasDb = !!process.env.POSTGRES_URL;

  // Mailer diagnostic — shows WHICH delivery method is active (no secret values exposed)
  const mailer = {
    gmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    gmailUser: process.env.GMAIL_USER || null,
    resend: !!process.env.RESEND_API_KEY,
    smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    activeMethod: process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
      ? 'gmail'
      : process.env.RESEND_API_KEY
        ? 'resend'
        : process.env.SMTP_HOST && process.env.SMTP_USER
          ? 'smtp'
          : 'simulator',
  };

  return NextResponse.json({ 
    status: 'ok', 
    hasDb,
    mailer,
    message: 'System connectivity test' 
  });
}
