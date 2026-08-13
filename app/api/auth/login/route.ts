import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { setSessionCookie, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { loginId, password } = await request.json();

    if (!loginId || !password) {
      return NextResponse.json({ error: 'User ID/Email and Password are required' }, { status: 400 });
    }

    const cleanLoginId = loginId.trim().toLowerCase();

    // Query user by sequential ID (CUST100xxx) or email address
    const user = db.prepare('SELECT * FROM Users WHERE id = ? OR email = ?')
      .get(loginId.trim(), cleanLoginId) as any;

    if (!user) {
      return NextResponse.json({ error: 'Invalid User ID/Email or password' }, { status: 401 });
    }

    const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid User ID/Email or password' }, { status: 401 });
    }

    const sessionPayload = {
      userId: user.id,
      username: user.fullName, // Using fullName as display name
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin === 1,
    };

    // Generate JWT token
    const token = signToken(sessionPayload);

    // Set cookie for page navigation middleware compatibility
    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token, // Return token for Authorization: Bearer headers usage
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e: any) {
    console.error('Login API error:', e);
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}
