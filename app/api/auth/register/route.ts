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

    // Wrap the registration and matching engine inside a single SQL Transaction
    const tx = await db.transaction("write");
    try {
      // 1. Resolve Parent Position using automatic extreme-side spillover
      let currentParentId = finalSponsorId;
      let placementParentId = '';

      while (true) {
        const childRes = await tx.execute({
          sql: 'SELECT id FROM Users WHERE parentId = ? AND position = ?',
          args: [currentParentId, cleanPosition]
        });
        const child = childRes.rows[0] as any;
        
        if (!child) {
          placementParentId = currentParentId;
          break;
        }
        currentParentId = child.id as string;
      }

      // 2. Generate Next sequential CUST ID
      const newUserId = await generateNextCustomerId();

      // 3. Hash Password
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      // 4. Create User
      await tx.execute({
        sql: `
          INSERT INTO Users (id, fullName, email, passwordHash, sponsorId, parentId, position, status, walletBalance, leftCount, rightCount, matchedPairs)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0.00, 0, 0, 0)
        `,
        args: [newUserId, fullName, cleanEmail, passwordHash, finalSponsorId, placementParentId, cleanPosition]
      });

      // 5. Record ₹1,000 Joining Fee Transaction for the new user
      const txnId1 = `TXN_JOIN_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await tx.execute({
        sql: `
          INSERT INTO Transactions (id, userId, amount, type, description)
          VALUES (?, ?, 1000.00, 'JOINING_FEE', 'Paid ₹1,000.00 joining fee for account activation')
        `,
        args: [txnId1, newUserId]
      });

      // 6. Propagate member counts up the ancestor chain and calculate matching commissions
      let currentId = newUserId;
      const todayStr = new Date().toISOString().split('T')[0]; // Current UTC date string for daily capping checks

      while (true) {
        // Fetch current node upline structural properties
        const userNodeRes = await tx.execute({
          sql: 'SELECT parentId, position FROM Users WHERE id = ?',
          args: [currentId]
        });
        const userNode = userNodeRes.rows[0] as any;
        if (!userNode || !userNode.parentId) {
          break;
        }

        const parentId = userNode.parentId;
        const branch = userNode.position;

        // Increment structural count
        if (branch === 'LEFT') {
          await tx.execute({
            sql: 'UPDATE Users SET leftCount = leftCount + 1 WHERE id = ?',
            args: [parentId]
          });
        } else if (branch === 'RIGHT') {
          await tx.execute({
            sql: 'UPDATE Users SET rightCount = rightCount + 1 WHERE id = ?',
            args: [parentId]
          });
        }

        // Fetch updated parent counts to run matching engine calculations
        const parentRes = await tx.execute({
          sql: 'SELECT leftCount, rightCount, matchedPairs, walletBalance FROM Users WHERE id = ?',
          args: [parentId]
        });
        const parent = parentRes.rows[0] as any;
        
        if (parent) {
          const totalPairs = Math.min(parent.leftCount, parent.rightCount);
          const newPairs = totalPairs - parent.matchedPairs;

          if (newPairs > 0) {
            // Check Daily Capping: limit to 10 matched pairs (₹2,000) per user per day
            const todayTxnObjRes = await tx.execute({
              sql: `
                SELECT COALESCE(SUM(amount), 0.0) as sum 
                FROM Transactions 
                WHERE userId = ? AND type = 'PAIR_MATCHING_BONUS' AND strftime('%Y-%m-%d', createdAt) = ?
              `,
              args: [parentId, todayStr]
            });
            const todayTxnObj = todayTxnObjRes.rows[0] as any;

            const todayPairsMatched = Math.round((todayTxnObj?.sum || 0.0) / 200.0);
            const cappingRemaining = 10 - todayPairsMatched;

            const pairsToPay = Math.min(newPairs, Math.max(0, cappingRemaining));
            const payoutAmount = pairsToPay * 200.0;

            // Update parent balance & matched count. 
            await tx.execute({
              sql: `
                UPDATE Users 
                SET walletBalance = walletBalance + ?, 
                    matchedPairs = matchedPairs + ? 
                WHERE id = ?
              `,
              args: [payoutAmount, newPairs, parentId]
            });

            // Record transaction payout if amount > 0
            if (payoutAmount > 0) {
              const txnId2 = `TXN_PAIR_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
              await tx.execute({
                sql: `
                  INSERT INTO Transactions (id, userId, amount, type, description)
                  VALUES (?, ?, ?, 'PAIR_MATCHING_BONUS', ?)
                `,
                args: [
                  txnId2, 
                  parentId, 
                  payoutAmount, 
                  `Pair matching bonus: matched ${pairsToPay} pairs (Capped: ${newPairs - pairsToPay})`
                ]
              });
            }
          }
        }

        // Advance up the chain
        currentId = parentId;
      }

      await tx.commit();
      
      return NextResponse.json({
        success: true,
        message: 'Account created and activated successfully',
        userId: newUserId
      });
    } catch (txErr: any) {
      await tx.rollback();
      throw txErr;
    }
  } catch (e: any) {
    console.error('Registration API error:', e);
    return NextResponse.json({ error: e.message || 'Server error during registration' }, { status: 500 });
  }
}
