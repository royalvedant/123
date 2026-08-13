import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Platform statistics
    const totalUsersObj = db.prepare('SELECT COUNT(*) as count FROM Users').get() as any;
    const activeUsersObj = db.prepare("SELECT COUNT(*) as count FROM Users WHERE status = 'active'").get() as any;
    const totalSalesObj = db.prepare("SELECT SUM(amount) as sum FROM Transactions WHERE type = 'JOINING_FEE'").get() as any;
    const totalCommissionsObj = db.prepare("SELECT SUM(amount) as sum FROM Transactions WHERE type = 'PAIR_MATCHING_BONUS'").get() as any;
    const pendingPayoutsObj = db.prepare("SELECT SUM(amount) as sum FROM Payouts WHERE status = 'pending'").get() as any;
    const approvedPayoutsObj = db.prepare("SELECT SUM(amount) as sum FROM Payouts WHERE status = 'approved'").get() as any;

    const stats = {
      totalUsers: totalUsersObj ? totalUsersObj.count : 0,
      activeUsers: activeUsersObj ? activeUsersObj.count : 0,
      totalSales: totalSalesObj && totalSalesObj.sum ? totalSalesObj.sum : 0.0,
      totalCommissions: totalCommissionsObj && totalCommissionsObj.sum ? totalCommissionsObj.sum : 0.0,
      pendingPayoutsAmount: pendingPayoutsObj && pendingPayoutsObj.sum ? pendingPayoutsObj.sum : 0.0,
      approvedPayoutsAmount: approvedPayoutsObj && approvedPayoutsObj.sum ? approvedPayoutsObj.sum : 0.0,
    };

    // Recent joining fees transactions list
    const recentPurchases = db.prepare(`
      SELECT t.id, t.amount, t.createdAt, u.fullName as username 
      FROM Transactions t 
      JOIN Users u ON t.userId = u.id 
      WHERE t.type = 'JOINING_FEE'
      ORDER BY t.createdAt DESC 
      LIMIT 5
    `).all() as any[];

    // Pending payouts list
    const pendingPayouts = db.prepare(`
      SELECT p.id, p.amount, p.createdAt, u.fullName as username, u.email, u.walletBalance as user_current_balance
      FROM Payouts p 
      JOIN Users u ON p.userId = u.id 
      WHERE p.status = 'pending' 
      ORDER BY p.createdAt ASC
    `).all() as any[];

    return NextResponse.json({
      stats,
      recentPurchases,
      pendingPayouts,
    });
  } catch (e: any) {
    console.error('Admin stats API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
