import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { payoutId, action } = await request.json();

    if (!payoutId || !action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Payout ID and action (approve/reject) are required' }, { status: 400 });
    }

    const runTransaction = db.transaction(() => {
      // Fetch payout details
      const payout = db.prepare('SELECT * FROM Payouts WHERE id = ?').get(payoutId) as any;
      if (!payout) {
        throw new Error('Payout request not found');
      }

      if (payout.status !== 'pending') {
        throw new Error('Payout request is already processed');
      }

      if (action === 'approve') {
        // Update payout status to approved
        db.prepare(`
          UPDATE Payouts 
          SET status = 'approved', processedAt = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(payoutId);

        // Record a debit WITHDRAWAL transaction in the Transactions table
        const txnId = `TXN_WITH_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        db.prepare(`
          INSERT INTO Transactions (id, userId, amount, type, description)
          VALUES (?, ?, ?, 'WITHDRAWAL', ?)
        `).run(
          txnId, 
          payout.userId, 
          -payout.amount, // Negative indicates balance deduction
          `Bank withdrawal payout of ₹${payout.amount.toFixed(2)} completed`
        );
      } else if (action === 'reject') {
        // Update payout status to rejected
        db.prepare(`
          UPDATE Payouts 
          SET status = 'rejected', processedAt = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(payoutId);

        // Refund the amount back to user's walletBalance
        db.prepare('UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?')
          .run(payout.amount, payout.userId);
      }

      return true;
    });

    try {
      runTransaction();
      return NextResponse.json({ success: true, message: `Payout request ${action}d successfully` });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Action failed' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Admin payout update error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
