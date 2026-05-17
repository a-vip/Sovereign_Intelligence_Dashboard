import { NextResponse } from 'next/server';
import { getUserByEmail, createUser, initDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

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
    if (existingUser) {
      return NextResponse.json(
        { error: 'Access Denied: an account with this email address is already registered.' },
        { status: 409 }
      );
    }

    // 3. Hash password and persist user
    const passwordHash = hashPassword(password);
    const newUser = await createUser(cleanEmail, passwordHash, cleanName, cleanRole);

    return NextResponse.json({
      success: true,
      message: 'Access granted. Operator registered successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'Internal system fault. Could not register operator.' },
      { status: 500 }
    );
  }
}
