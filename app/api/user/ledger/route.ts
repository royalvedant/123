import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = db.prepare(`
      SELECT id, type, amount, description, createdAt 
      FROM Transactions 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `).all(session.userId) as any[];

    const payouts = db.prepare(`
      SELECT id, amount, status, createdAt, processedAt 
      FROM Payouts 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `).all(session.userId) as any[];

    return NextResponse.json({ transactions, payouts });
  } catch (e: any) {
    console.error('Ledger API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
