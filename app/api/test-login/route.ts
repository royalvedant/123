import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { setSessionCookie, signToken } from '@/lib/auth';

export async function GET() {
  const log: any[] = [];
  try {
    log.push('1. Finding admin user CUST100001');
    const userResult = await db.execute({
      sql: 'SELECT * FROM Users WHERE id = ?',
      args: ['CUST100001']
    });
    const user = userResult.rows[0] as any;
    if (!user) {
      return NextResponse.json({ error: 'Admin user not found in DB', log });
    }
    log.push('2. Found user: ' + JSON.stringify({ id: user.id, email: user.email }));

    log.push('3. Comparing password');
    const isValidPassword = bcrypt.compareSync('admin123', user.passwordHash);
    log.push('4. Password comparison result: ' + isValidPassword);

    const sessionPayload = {
      userId: user.id,
      username: user.fullName,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin === 1,
    };

    log.push('5. Signing token');
    const token = signToken(sessionPayload);
    log.push('6. Token signed: ' + token.substring(0, 15) + '...');

    log.push('7. Setting session cookie');
    await setSessionCookie(sessionPayload);
    log.push('8. Cookie set successfully');

    return NextResponse.json({
      success: true,
      log
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
      stack: e.stack,
      log
    }, { status: 500 });
  }
}
