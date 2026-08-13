import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageName } = await request.json();
    if (!packageName) {
      return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
    }

    // Determine package details
    let amount = 0;
    let pv = 0;
    switch (packageName.toLowerCase()) {
      case 'bronze':
        amount = 100.0;
        pv = 100.0;
        break;
      case 'silver':
        amount = 250.0;
        pv = 250.0;
        break;
      case 'gold':
        amount = 500.0;
        pv = 500.0;
        break;
      default:
        return NextResponse.json({ error: 'Invalid package name' }, { status: 400 });
    }

    const userId = session.userId;

    // Run purchase and commission calculations inside a single database transaction
    const runTransaction = db.transaction(() => {
      // 1. Fetch user status
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      if (!user) {
        throw new Error('User not found');
      }

      const initialStatus = user.status;

      // 2. Record the purchase
      db.prepare(`
        INSERT INTO purchases (user_id, package_name, amount, pv)
        VALUES (?, ?, ?, ?)
      `).run(userId, packageName, amount, pv);

      // 3. Activate user if they were inactive
      if (initialStatus === 'inactive') {
        db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(userId);
      }

      // 4. Pay direct referral commission (10% of amount)
      if (user.sponsor_id) {
        const sponsor = db.prepare('SELECT id, balance, total_earned, username FROM users WHERE id = ?').get(user.sponsor_id) as any;
        if (sponsor) {
          const directCommission = amount * 0.10;
          const newSponsorBalance = sponsor.balance + directCommission;
          const newSponsorTotalEarned = sponsor.total_earned + directCommission;
          
          db.prepare('UPDATE users SET balance = ?, total_earned = ? WHERE id = ?')
            .run(newSponsorBalance, newSponsorTotalEarned, sponsor.id);

          db.prepare(`
            INSERT INTO commissions (user_id, type, amount, description)
            VALUES (?, 'referral', ?, ?)
          `).run(
            sponsor.id, 
            directCommission, 
            `Direct referral commission from ${user.username} buying ${packageName} Package`
          );
        }
      }

      // 5. Propagate PV up the binary tree and calculate binary matching bonuses
      let currentId = userId;
      let uplinePath: any[] = [];

      // Walk up the tree to collect all parents in the path and update their points
      while (true) {
        const currentUser = db.prepare('SELECT id, parent_id, position FROM users WHERE id = ?').get(currentId) as any;
        if (!currentUser || !currentUser.parent_id) {
          break;
        }

        const parentId = currentUser.parent_id;
        const position = currentUser.position;

        // Update points on the corresponding leg of the parent
        if (position === 'left') {
          db.prepare('UPDATE users SET left_points = left_points + ? WHERE id = ?').run(pv, parentId);
        } else if (position === 'right') {
          db.prepare('UPDATE users SET right_points = right_points + ? WHERE id = ?').run(pv, parentId);
        }

        // Add parent to the path for commission matches
        if (!uplinePath.includes(parentId)) {
          uplinePath.push(parentId);
        }

        currentId = parentId;
      }

      // Calculate binary matching commissions for all parents in the upline path
      for (const parentId of uplinePath) {
        const parent = db.prepare('SELECT * FROM users WHERE id = ?').get(parentId) as any;
        if (!parent || parent.status !== 'active') {
          // Inactive uplines cannot earn matching commissions (standard MLM rules)
          continue;
        }

        const leftTotal = parent.left_points + parent.left_carryover;
        const rightTotal = parent.right_points + parent.right_carryover;

        // Match points in steps of 100 PV
        const matches = Math.floor(Math.min(leftTotal, rightTotal) / 100);

        if (matches > 0) {
          const matchCommission = matches * 10.0; // $10 per 100 PV match
          const pointsUsed = matches * 100.0;

          const newLeftCarryover = leftTotal - pointsUsed;
          const newRightCarryover = rightTotal - pointsUsed;

          const newBalance = parent.balance + matchCommission;
          const newTotalEarned = parent.total_earned + matchCommission;

          // Update parent balance, carryovers, and reset current cycle points to 0
          db.prepare(`
            UPDATE users 
            SET balance = ?, total_earned = ?, left_points = 0.0, right_points = 0.0, 
                left_carryover = ?, right_carryover = ?
            WHERE id = ?
          `).run(newBalance, newTotalEarned, newLeftCarryover, newRightCarryover, parent.id);

          // Record matching commission
          db.prepare(`
            INSERT INTO commissions (user_id, type, amount, left_points_used, right_points_used, description)
            VALUES (?, 'matching', ?, ?, ?, ?)
          `).run(
            parent.id, 
            matchCommission, 
            pointsUsed, 
            pointsUsed, 
            `Binary matching commission for match of ${pointsUsed} PV`
          );
        }
      }

      return true;
    });

    try {
      runTransaction();
      return NextResponse.json({ success: true, message: 'Package purchased successfully and commissions calculated' });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Purchase failed' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Purchase API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
