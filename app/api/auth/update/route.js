import { NextResponse } from 'next/server';
import { initDb, getUserByEmail, updateUser } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function POST(req) {
  try {
    await initDb();
    
    const body = await req.json();
    const { userId, fullName, email, currentPassword, newPassword } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing required parameter: userId.' }, { status: 400 });
    }
    
    // 1. Get current user details from db
    let user;
    if (!process.env.POSTGRES_URL) {
      const fs = require('fs');
      const path = require('path');
      const LOCAL_USERS_FILE = path.resolve('users-local.json');
      if (fs.existsSync(LOCAL_USERS_FILE)) {
        const localUsers = JSON.parse(fs.readFileSync(LOCAL_USERS_FILE, 'utf8'));
        user = localUsers.find(u => u.id === userId);
      }
    } else {
      const { rows } = await sql`SELECT * FROM users WHERE id = ${userId}`;
      user = rows[0];
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Operator account not found.' }, { status: 404 });
    }
    
    // 2. Verify current password to allow any changes
    if (fullName || email || newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to verify identity for account updates.' }, { status: 400 });
      }
      
      const isValid = verifyPassword(currentPassword, user.password_hash || user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Verification failed: invalid current password.' }, { status: 401 });
      }
    }
    
    // 3. Build update object
    const updateData = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (email && email.toLowerCase().trim() !== user.email) updateData.email = email.toLowerCase().trim();
    if (newPassword) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }
      updateData.passwordHash = hashPassword(newPassword.trim());
    }
    
    // 4. Update user details in database
    const updatedUser = await updateUser(userId, updateData);
    
    return NextResponse.json({
      success: true,
      message: 'Operator credentials updated successfully.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName || updatedUser.full_name,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt || updatedUser.created_at
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Update Account API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal system fault during account update.' }, { status: 500 });
  }
}
