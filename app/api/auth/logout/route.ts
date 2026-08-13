import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (e: any) {
    console.error('Logout API error:', e);
    return NextResponse.json({ error: 'Server error during logout' }, { status: 500 });
  }
}
