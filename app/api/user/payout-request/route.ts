import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payoutsRes = await db.execute({
      sql: `
        SELECT id, amount, status, createdAt, processedAt 
        FROM Payouts 
        WHERE userId = ? 
        ORDER BY createdAt DESC
      `,
      args: [session.userId]
    });
    
    const payouts = payoutsRes.rows as any[];

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

    const tx = await db.transaction("write");
    try {
      // Fetch user balance
      const userRes = await tx.execute({
        sql: 'SELECT walletBalance FROM Users WHERE id = ?',
        args: [userId]
      });
      const user = userRes.rows[0] as any;
      if (!user) {
        throw new Error('User not found');
      }

      if (user.walletBalance < parsedAmount) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct from walletBalance
      await tx.execute({
        sql: 'UPDATE Users SET walletBalance = walletBalance - ? WHERE id = ?',
        args: [parsedAmount, userId]
      });

      // Create Payout Entry (Pending withdrawal request)
      const payoutId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await tx.execute({
        sql: `
          INSERT INTO Payouts (id, userId, amount, status)
          VALUES (?, ?, ?, 'pending')
        `,
        args: [payoutId, userId, parsedAmount]
      });

      await tx.commit();
      return NextResponse.json({ success: true, message: 'Withdrawal payout requested successfully' });
    } catch (txErr: any) {
      await tx.rollback();
      return NextResponse.json({ error: txErr.message || 'Withdrawal request failed' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Payout request error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
