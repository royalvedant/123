import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payouts = db.prepare(`
      SELECT id, amount, status, createdAt, processedAt 
      FROM Payouts 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `).all(session.userId) as any[];

    return NextResponse.json({ payouts });
  } catch (e: any) {
    console.error('Fetch payouts error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 });
    }

    const userId = session.userId;

    const runTransaction = db.transaction(() => {
      // Fetch user balance
      const user = db.prepare('SELECT walletBalance FROM Users WHERE id = ?').get(userId) as any;
      if (!user) {
        throw new Error('User not found');
      }

      if (user.walletBalance < parsedAmount) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct from walletBalance
      db.prepare('UPDATE Users SET walletBalance = walletBalance - ? WHERE id = ?').run(parsedAmount, userId);

      // Create Payout Entry (Pending withdrawal request)
      const payoutId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      db.prepare(`
        INSERT INTO Payouts (id, userId, amount, status)
        VALUES (?, ?, ?, 'pending')
      `).run(payoutId, userId, parsedAmount);

      return true;
    });

    try {
      runTransaction();
      return NextResponse.json({ success: true, message: 'Withdrawal payout requested successfully' });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Withdrawal request failed' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Payout request error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
