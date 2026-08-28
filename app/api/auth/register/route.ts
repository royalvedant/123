import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db, { generateNextCustomerId } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, sponsorId, position } = await request.json();

    if (!fullName || !email || !password || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanPosition = position.trim().toUpperCase();
    if (cleanPosition !== 'LEFT' && cleanPosition !== 'RIGHT') {
      return NextResponse.json({ error: 'Position must be LEFT or RIGHT' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUserRes = await db.execute({
      sql: 'SELECT id FROM Users WHERE email = ?',
      args: [cleanEmail]
    });
    
    if (existingUserRes.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Resolve sponsor
    let finalSponsorId = 'CUST100001'; // Default to admin
    if (sponsorId) {
      const sponsorRes = await db.execute({
        sql: 'SELECT id FROM Users WHERE id = ?',
        args: [sponsorId.trim()]
      });
      if (sponsorRes.rows.length > 0) {
        finalSponsorId = sponsorRes.rows[0].id as string;
      }
    }

    // 1. Generate Next sequential CUST ID
    const newUserId = await generateNextCustomerId();

    // 2. Hash Password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // 3. Create User in pending status, parentId is NULL initially
    await db.execute({
      sql: `
        INSERT INTO Users (id, fullName, email, passwordHash, sponsorId, parentId, position, status, walletBalance, leftCount, rightCount, matchedPairs)
        VALUES (?, ?, ?, ?, ?, NULL, ?, 'pending', 0.00, 0, 0, 0)
      `,
      args: [newUserId, fullName, cleanEmail, passwordHash, finalSponsorId, cleanPosition]
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Your ID is pending activation by Admin.',
      userId: newUserId
    });
  } catch (e: any) {
    console.error('Registration API error:', e);
    return NextResponse.json({ error: e.message || 'Server error during registration' }, { status: 500 });
  }
}
