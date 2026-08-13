import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const referrals = db.prepare(`
      SELECT u.id, u.fullName, u.email, u.status, u.position, u.createdAt,
             (SELECT COALESCE(SUM(t.amount), 0.0) FROM Transactions t WHERE t.userId = u.id AND t.type = 'JOINING_FEE') as total_purchases
      FROM Users u
      WHERE u.sponsorId = ?
      ORDER BY u.createdAt DESC
    `).all(session.userId) as any[];

    return NextResponse.json({ referrals });
  } catch (e: any) {
    console.error('Fetch referrals error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
