import { NextResponse } from 'next/server';
import { getUserByEmail, createUser, updateUnverifiedUser, initDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req) {
  try {
    // Lazy initialize DB tables to be 100% resilient
    await initDb();

    const body = await req.json();
    const { email, password, fullName, role } = body;

    // 1. Basic Sanitation and Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required credentials: email, password, and fullName are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = fullName.trim();
    const cleanRole = role ? role.trim() : 'analyst';

    // Simple Email Regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Security constraint violation: password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 2. Check for existing user account
    const existingUser = await getUserByEmail(cleanEmail);
    const passwordHash = hashPassword(password);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const host = req.headers.get('host') || 'localhost:3000';

    const isGmailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    const isSimulated = !isGmailConfigured && !process.env.RESEND_API_KEY && !isSmtpConfigured;

    if (existingUser) {
      if (existingUser.is_verified) {
        return NextResponse.json(
          { error: 'Access Denied: an account with this email address is already registered.' },
          { status: 409 }
        );
      } else {
        // User exists but is not verified yet. We update their unverified profile with the new details and verification token.
        await updateUnverifiedUser(existingUser.id, {
          passwordHash,
          fullName: cleanName,
          role: cleanRole,
          verificationToken: token,
          verificationExpiresAt: expiresAt
        });

        // Send verification email to actual email
        await sendVerificationEmail(cleanEmail, token, cleanName, host);

        return NextResponse.json({
          success: true,
          pending: true,
          isSimulated,
          message: 'Verification dispatch successful. A new verification link has been sent to your email.'
        }, { status: 200 });
      }
    }

    // 3. Save unverified user directly in the database
    await createUser(cleanEmail, passwordHash, cleanName, cleanRole, false, token, expiresAt);
    
    // 4. Send verification email to actual email
    await sendVerificationEmail(cleanEmail, token, cleanName, host);

    return NextResponse.json({
      success: true,
      pending: true,
      isSimulated,
      message: 'Verification dispatch successful. Please inspect your email inbox to authenticate your account.'
    }, { status: 200 });

  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal system fault. Could not register operator.' },
      { status: 500 }
    );
  }
}
