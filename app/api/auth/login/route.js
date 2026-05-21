import { NextResponse } from 'next/server';
import { getUserByEmail, initDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export async function POST(req) {
  try {
    // Lazy initialize DB tables to be 100% resilient
    await initDb();

    const body = await req.json();
    const { email, password } = body;

    // 1. Basic Sanitation and Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required credentials: email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Query user by email
    const user = await getUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication Failed: invalid email address or access code.' },
        { status: 401 }
      );
    }

    // 3. Verify password hash
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Authentication Failed: invalid email address or access code.' },
        { status: 401 }
      );
    }

    // 4. Verify operator is authenticated (with bypass for the administrator email)
    if (user.is_verified === false && user.email !== 'workwithavip@gmail.com') {
      return NextResponse.json(
        { error: 'Access Blocked: Your email address has not been authenticated yet. Please check your inbox for the verification handshake link.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful. Access granted.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'Internal system fault. Could not authenticate operator.' },
      { status: 500 }
    );
  }
}
