import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.email !== 'vedantsonawane5012@gmail.com' || !session.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Access Blocked: You do not have permission to access the Admin Panel.'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let users;
    if (query) {
      const searchTerm = `%${query.trim()}%`;
      const usersRes = await db.execute({
        sql: `
          SELECT id, fullName, email, role, status, walletBalance, 
                 leftCount, rightCount, matchedPairs, createdAt 
          FROM Users 
          WHERE id LIKE ? OR fullName LIKE ? OR email LIKE ? 
          ORDER BY createdAt DESC
        `,
        args: [searchTerm, searchTerm, searchTerm.toLowerCase()]
      });
      users = usersRes.rows as any[];
    } else {
      const usersRes = await db.execute(`
        SELECT id, fullName, email, role, status, walletBalance, 
               leftCount, rightCount, matchedPairs, createdAt 
        FROM Users 
        ORDER BY createdAt DESC
      `);
      users = usersRes.rows as any[];
    }

    return NextResponse.json({ users });
  } catch (e: any) {
    console.error('Admin users fetch error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.email !== 'vedantsonawane5012@gmail.com' || !session.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Access Blocked: You do not have permission to access the Admin Panel.'
      }, { status: 403 });
    }

    const { userId, walletBalance, leftCount, rightCount, matchedPairs, status } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists
    const userRes = await db.execute({
      sql: 'SELECT id FROM Users WHERE id = ?',
      args: [userId]
    });
    const user = userRes.rows[0] as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Perform updates
    await db.execute({
      sql: `
        UPDATE Users 
        SET walletBalance = ?, 
            leftCount = ?, 
            rightCount = ?, 
            matchedPairs = ?, 
            status = ?
        WHERE id = ?
      `,
      args: [
        parseFloat(walletBalance),
        parseInt(leftCount, 10),
        parseInt(rightCount, 10),
        parseInt(matchedPairs, 10),
        status,
        userId
      ]
    });

    return NextResponse.json({ success: true, message: 'User details updated successfully' });
  } catch (e: any) {
    console.error('Admin user update error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
