import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user details from Users table
    const user = db.prepare(`
      SELECT id, fullName, email, role, status, walletBalance, 
             leftCount, rightCount, matchedPairs, 
             sponsorId, parentId, position, createdAt 
      FROM Users WHERE id = ?
    `).get(session.userId) as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch sponsor details
    let sponsorName = null;
    let sponsorId = null;
    if (user.sponsorId) {
      const sponsor = db.prepare('SELECT id, fullName FROM Users WHERE id = ?').get(user.sponsorId) as any;
      if (sponsor) {
        sponsorName = sponsor.fullName;
        sponsorId = sponsor.id;
      }
    }

    // Fetch parent details
    let parentName = null;
    let parentId = null;
    if (user.parentId) {
      const parent = db.prepare('SELECT id, fullName FROM Users WHERE id = ?').get(user.parentId) as any;
      if (parent) {
        parentName = parent.fullName;
        parentId = parent.id;
      }
    }

    // Fetch recent transaction logs (last 5 entries)
    const recentTransactions = db.prepare(`
      SELECT id, type, amount, description, createdAt 
      FROM Transactions 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT 5
    `).all(user.id) as any[];

    // Construct the single referral link using the unique CUST ID
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const referralLink = `${protocol}://${host}/register?sponsor=${user.id}`;

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        walletBalance: user.walletBalance,
        leftCount: user.leftCount,
        rightCount: user.rightCount,
        matchedPairs: user.matchedPairs,
        position: user.position,
        createdAt: user.createdAt,
        sponsorId,
        sponsorName,
        parentName,
        parentId,
      },
      referralLink,
      recentTransactions,
    });
  } catch (e: any) {
    console.error('Dashboard API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
