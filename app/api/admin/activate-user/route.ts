import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

// 1. GET all pending users awaiting approval
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.email !== 'vedantsonawane5012@gmail.com' || !session.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Access Blocked: You do not have permission to access the Admin Panel.'
      }, { status: 403 });
    }

    const res = await db.execute({
      sql: `
        SELECT id, fullName, email, sponsorId, position, createdAt 
        FROM Users 
        WHERE status = 'pending' 
        ORDER BY createdAt DESC
      `,
      args: []
    });

    return NextResponse.json({ success: true, pendingUsers: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 2. POST to approve and activate user
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.email !== 'vedantsonawane5012@gmail.com' || !session.isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Access Blocked: You do not have permission to access the Admin Panel.'
      }, { status: 403 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: 'Target user ID is required' }, { status: 400 });
    }

    // Retrieve pending user details
    const userRes = await db.execute({
      sql: 'SELECT id, fullName, sponsorId, position FROM Users WHERE id = ? AND status = ?',
      args: [targetUserId, 'pending']
    });
    
    const targetUser = userRes.rows[0] as any;
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found or not in pending status' }, { status: 404 });
    }

    const finalSponsorId = targetUser.sponsorId || 'CUST100001';
    const cleanPosition = targetUser.position || 'LEFT';

    // Start SQL Transaction to safely place the member, activate their status, propagate PV up tree, and award commissions
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

      // 2. Update user status to active and assign the placement parentId
      await tx.execute({
        sql: `UPDATE Users SET status = 'active', parentId = ? WHERE id = ?`,
        args: [placementParentId, targetUserId]
      });

      // 3. Record ₹1,000 Joining Fee Transaction
      const txnId1 = `TXN_ACT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await tx.execute({
        sql: `
          INSERT INTO Transactions (id, userId, amount, type, description)
          VALUES (?, ?, 1000.00, 'JOINING_FEE', 'Account activated by Admin approval')
        `,
        args: [txnId1, targetUserId]
      });

      // 4. Propagate member counts up the ancestor chain and calculate matching commissions
      let currentId = targetUserId;
      const todayStr = new Date().toISOString().split('T')[0];

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
        message: `User ${targetUserId} has been activated successfully.`
      });
    } catch (txErr: any) {
      await tx.rollback();
      throw txErr;
    }
  } catch (error: any) {
    console.error('Activation API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
