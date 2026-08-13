import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.email !== 'vedantsonawane5012@gmail.com' || !session.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Access Blocked: You do not have permission to access the Admin Panel.'
      }, { status: 403 });
    }

    const { payoutId, action } = await request.json();

    if (!payoutId || !action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Payout ID and action (approve/reject) are required' }, { status: 400 });
    }

    const tx = await db.transaction("write");
    try {
      // Fetch payout details
      const payoutRes = await tx.execute({
        sql: 'SELECT * FROM Payouts WHERE id = ?',
        args: [payoutId]
      });
      const payout = payoutRes.rows[0] as any;
      
      if (!payout) {
        throw new Error('Payout request not found');
      }

      if (payout.status !== 'pending') {
        throw new Error('Payout request is already processed');
      }

      if (action === 'approve') {
        // Update payout status to approved
        await tx.execute({
          sql: `
            UPDATE Payouts 
            SET status = 'approved', processedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
          `,
          args: [payoutId]
        });

        // Record a debit WITHDRAWAL transaction in the Transactions table
        const txnId = `TXN_WITH_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await tx.execute({
          sql: `
            INSERT INTO Transactions (id, userId, amount, type, description)
            VALUES (?, ?, ?, 'WITHDRAWAL', ?)
          `,
          args: [
            txnId, 
            payout.userId, 
            -payout.amount, // Negative indicates balance deduction
            `Bank withdrawal payout of ₹${payout.amount.toFixed(2)} completed`
          ]
        });
      } else if (action === 'reject') {
        // Update payout status to rejected
        await tx.execute({
          sql: `
            UPDATE Payouts 
            SET status = 'rejected', processedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
          `,
          args: [payoutId]
        });

        // Refund the amount back to user's walletBalance
        await tx.execute({
          sql: 'UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?',
          args: [payout.amount, payout.userId]
        });
      }

      await tx.commit();
      return NextResponse.json({ success: true, message: `Payout request ${action}d successfully` });
    } catch (txErr: any) {
      await tx.rollback();
      return NextResponse.json({ error: txErr.message || 'Action failed' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Admin payout update error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
