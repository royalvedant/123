import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.email !== 'vedantsonawane5012@gmail.com' || !session.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Access Blocked: You do not have permission to access the Admin Panel.'
      }, { status: 403 });
    }

    // Platform statistics (LibSQL client async calls)
    const totalUsersRes = await db.execute('SELECT COUNT(*) as count FROM Users');
    const totalUsersObj = totalUsersRes.rows[0] as any;

    const activeUsersRes = await db.execute("SELECT COUNT(*) as count FROM Users WHERE status = 'active'");
    const activeUsersObj = activeUsersRes.rows[0] as any;

    const totalSalesRes = await db.execute("SELECT SUM(amount) as sum FROM Transactions WHERE type = 'JOINING_FEE'");
    const totalSalesObj = totalSalesRes.rows[0] as any;

    const totalCommissionsRes = await db.execute("SELECT SUM(amount) as sum FROM Transactions WHERE type = 'PAIR_MATCHING_BONUS'");
    const totalCommissionsObj = totalCommissionsRes.rows[0] as any;

    const pendingPayoutsRes = await db.execute("SELECT SUM(amount) as sum FROM Payouts WHERE status = 'pending'");
    const pendingPayoutsObj = pendingPayoutsRes.rows[0] as any;

    const approvedPayoutsRes = await db.execute("SELECT SUM(amount) as sum FROM Payouts WHERE status = 'approved'");
    const approvedPayoutsObj = approvedPayoutsRes.rows[0] as any;

    const stats = {
      totalUsers: totalUsersObj ? Number(totalUsersObj.count) : 0,
      activeUsers: activeUsersObj ? Number(activeUsersObj.count) : 0,
      totalSales: totalSalesObj && totalSalesObj.sum ? Number(totalSalesObj.sum) : 0.0,
      totalCommissions: totalCommissionsObj && totalCommissionsObj.sum ? Number(totalCommissionsObj.sum) : 0.0,
      pendingPayoutsAmount: pendingPayoutsObj && pendingPayoutsObj.sum ? Number(pendingPayoutsObj.sum) : 0.0,
      approvedPayoutsAmount: approvedPayoutsObj && approvedPayoutsObj.sum ? Number(approvedPayoutsObj.sum) : 0.0,
    };

    // Recent joining fees transactions list
    const recentPurchasesRes = await db.execute(`
      SELECT t.id, t.amount, t.createdAt, u.fullName as username 
      FROM Transactions t 
      JOIN Users u ON t.userId = u.id 
      WHERE t.type = 'JOINING_FEE'
      ORDER BY t.createdAt DESC 
      LIMIT 5
    `);
    const recentPurchases = recentPurchasesRes.rows as any[];

    // Pending payouts list
    const pendingPayoutsResList = await db.execute(`
      SELECT p.id, p.amount, p.createdAt, u.fullName as username, u.email, u.walletBalance as user_current_balance
      FROM Payouts p 
      JOIN Users u ON p.userId = u.id 
      WHERE p.status = 'pending' 
      ORDER BY p.createdAt ASC
    `);
    const pendingPayouts = pendingPayoutsResList.rows as any[];

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
