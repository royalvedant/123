import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'binary-mlm-secret-key-987654321';
const COOKIE_NAME = 'mlm_session';

export interface UserSession {
  userId: string; // Updated to String to match CUST100001 IDs
  username: string;
  role: string;
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (e) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  let token = '';

  // 1. Try to read from Authorization: Bearer <token> headers
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  } catch (e) {
    // headers() might throw in static generation/rendering contexts, swallow and proceed
  }

  // 2. Try to read from cookies
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value || '';
    } catch (e) {
      // cookies() might throw in static generation/rendering contexts, swallow
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(payload: UserSession) {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
