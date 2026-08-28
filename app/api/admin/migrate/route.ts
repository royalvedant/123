import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    console.log('Starting remote database reset migration...');
    
    // Drop existing tables
    await db.execute('DROP TABLE IF EXISTS Payouts');
    await db.execute('DROP TABLE IF EXISTS Transactions');
    await db.execute('DROP TABLE IF EXISTS Users');
    
    // Re-run database creation and seeding manually to ensure it executes immediately
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        id TEXT PRIMARY KEY,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        sponsorId TEXT,
        parentId TEXT,
        position TEXT, -- 'LEFT', 'RIGHT', or NULL (for root)
        status TEXT DEFAULT 'pending', -- 'pending' or 'active' or 'inactive'
        leftCount INTEGER DEFAULT 0,
        rightCount INTEGER DEFAULT 0,
        matchedPairs INTEGER DEFAULT 0,
        walletBalance REAL DEFAULT 0.00,
        role TEXT DEFAULT 'USER', -- 'USER' or 'ADMIN'
        isAdmin INTEGER DEFAULT 0, -- 0 for false, 1 for true
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sponsorId) REFERENCES Users(id),
        FOREIGN KEY(parentId) REFERENCES Users(id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Transactions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL, -- 'JOINING_FEE', 'PAIR_MATCHING_BONUS', 'WITHDRAWAL'
        description TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES Users(id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Payouts (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        processedAt DATETIME,
        FOREIGN KEY(userId) REFERENCES Users(id)
      );
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_Users_parentId ON Users(parentId);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_Users_sponsorId ON Users(sponsorId);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_Transactions_userId ON Transactions(userId);`);

    // Seed default admin account
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync("admin123", salt);
    
    await db.execute({
      sql: `
        INSERT INTO Users (id, fullName, email, passwordHash, role, isAdmin, status, walletBalance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: ["CUST100001", "Administrator", "vedantsonawane5012@gmail.com", passwordHash, "ADMIN", 1, "active", 0.00]
    });

    console.log('Remote database reset and seed complete!');

    return NextResponse.json({ 
      success: true, 
      message: 'Remote database tables dropped, recreated with fresh schema, and seeded successfully!' 
    });
  } catch (e: any) {
    console.error('Remote migration error:', e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Remote database reset failed' 
    }, { status: 500 });
  }
}
