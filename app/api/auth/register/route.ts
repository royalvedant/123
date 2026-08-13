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
    const existingUser = db.prepare('SELECT id FROM Users WHERE email = ?').get(cleanEmail) as any;
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Resolve sponsor
    let finalSponsorId = 'CUST100001'; // Default to admin
    if (sponsorId) {
      const sponsor = db.prepare('SELECT id FROM Users WHERE id = ?').get(sponsorId.trim()) as any;
      if (sponsor) {
        finalSponsorId = sponsor.id;
      }
    }

    // Wrap the registration and matching engine inside a single SQL Transaction
    const runRegistrationTransaction = db.transaction(() => {
      // 1. Resolve Parent Position using automatic extreme-side spillover
      let currentParentId = finalSponsorId;
      let placementParentId = '';

      while (true) {
        const child = db.prepare('SELECT id FROM Users WHERE parentId = ? AND position = ?')
          .get(currentParentId, cleanPosition) as any;
        
        if (!child) {
          placementParentId = currentParentId;
          break;
        }
        currentParentId = child.id;
      }

      // 2. Generate Next sequential CUST ID
      const newUserId = generateNextCustomerId();

      // 3. Hash Password
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      // 4. Create User
      db.prepare(`
        INSERT INTO Users (id, fullName, email, passwordHash, sponsorId, parentId, position, status, walletBalance, leftCount, rightCount, matchedPairs)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0.00, 0, 0, 0)
      `).run(newUserId, fullName, cleanEmail, passwordHash, finalSponsorId, placementParentId, cleanPosition);

      // 5. Record ₹1,000 Joining Fee Transaction for the new user
      const txnId1 = `TXN_JOIN_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      db.prepare(`
        INSERT INTO Transactions (id, userId, amount, type, description)
        VALUES (?, ?, 1000.00, 'JOINING_FEE', 'Paid ₹1,000.00 joining fee for account activation')
      `).run(txnId1, newUserId);

      // 6. Propagate member counts up the ancestor chain and calculate matching commissions
      let currentId = newUserId;
      const todayStr = new Date().toISOString().split('T')[0]; // Current UTC date string for daily capping checks

      while (true) {
        // Fetch current node upline structural properties
        const userNode = db.prepare('SELECT parentId, position FROM Users WHERE id = ?').get(currentId) as any;
        if (!userNode || !userNode.parentId) {
          break;
        }

        const parentId = userNode.parentId;
        const branch = userNode.position;

        // Increment structural count
        if (branch === 'LEFT') {
          db.prepare('UPDATE Users SET leftCount = leftCount + 1 WHERE id = ?').run(parentId);
        } else if (branch === 'RIGHT') {
          db.prepare('UPDATE Users SET rightCount = rightCount + 1 WHERE id = ?').run(parentId);
        }

        // Fetch updated parent counts to run matching engine calculations
        const parent = db.prepare('SELECT leftCount, rightCount, matchedPairs, walletBalance FROM Users WHERE id = ?').get(parentId) as any;
        if (parent) {
          const totalPairs = Math.min(parent.leftCount, parent.rightCount);
          const newPairs = totalPairs - parent.matchedPairs;

          if (newPairs > 0) {
            // Check Daily Capping: limit to 10 matched pairs (₹2,000) per user per day
            const todayTxnObj = db.prepare(`
              SELECT COALESCE(SUM(amount), 0.0) as sum 
              FROM Transactions 
              WHERE userId = ? AND type = 'PAIR_MATCHING_BONUS' AND strftime('%Y-%m-%d', createdAt) = ?
            `).get(parentId, todayStr) as any;

            const todayPairsMatched = Math.round((todayTxnObj?.sum || 0.0) / 200.0);
            const cappingRemaining = 10 - todayPairsMatched;

            const pairsToPay = Math.min(newPairs, Math.max(0, cappingRemaining));
            const payoutAmount = pairsToPay * 200.0;

            // Update parent balance & matched count. 
            // We increment matchedPairs by the total newPairs (including capped pairs) 
            // so capped cycles are consumed and not held over for payouts tomorrow.
            db.prepare(`
              UPDATE Users 
              SET walletBalance = walletBalance + ?, 
                  matchedPairs = matchedPairs + ? 
              WHERE id = ?
            `).run(payoutAmount, newPairs, parentId);

            // Record transaction payout if amount > 0
            if (payoutAmount > 0) {
              const txnId2 = `TXN_PAIR_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
              db.prepare(`
                INSERT INTO Transactions (id, userId, amount, type, description)
                VALUES (?, ?, ?, 'PAIR_MATCHING_BONUS', ?)
              `).run(
                txnId2, 
                parentId, 
                payoutAmount, 
                `Pair matching bonus: matched ${pairsToPay} pairs (Capped: ${newPairs - pairsToPay})`
              );
            }
          }
        }

        // Advance up the chain
        currentId = parentId;
      }

      return newUserId;
    });

    try {
      const generatedId = runRegistrationTransaction();
      return NextResponse.json({
        success: true,
        message: 'Account created and activated successfully',
        userId: generatedId
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Registration transaction failed' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Registration API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
