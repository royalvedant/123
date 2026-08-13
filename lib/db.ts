import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.TURSO_DATABASE_URL || 'file:mlm.db';
const dbToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

export async function initDb() {
  try {
    // Create Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        id TEXT PRIMARY KEY,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        sponsorId TEXT,
        parentId TEXT,
        position TEXT, -- 'LEFT', 'RIGHT', or NULL (for root)
        status TEXT DEFAULT 'active', -- 'active' or 'inactive'
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

    // Create Transactions table
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

    // Create Payouts table
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

    // Create Indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_Users_parentId ON Users(parentId);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_Users_sponsorId ON Users(sponsorId);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_Transactions_userId ON Transactions(userId);`);

    // Seed admin/root user if empty
    const checkAdmin = await db.execute({
      sql: 'SELECT * FROM Users WHERE id = ?',
      args: ['CUST100001']
    });

    if (checkAdmin.rows.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync("admin123", salt);
      
      await db.execute({
        sql: `
          INSERT INTO Users (id, fullName, email, passwordHash, role, isAdmin, status, walletBalance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: ["CUST100001", "Administrator", "vedantsonawane5012@gmail.com", passwordHash, "ADMIN", 1, "active", 0.00]
      });

      console.log("Database initialized. Default admin seeded: CUST100001 / admin123 (email: vedantsonawane5012@gmail.com)");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

// Initialize on import
initDb();

export async function generateNextCustomerId(): Promise<string> {
  try {
    const res = await db.execute("SELECT id FROM Users WHERE id LIKE 'CUST%' ORDER BY id DESC LIMIT 1");
    const row = res.rows[0] as any;
    if (!row) return 'CUST100001';
    const numericPart = parseInt(row.id.replace('CUST', ''), 10);
    if (isNaN(numericPart)) {
      return 'CUST100001';
    }
    return `CUST${numericPart + 1}`;
  } catch (e) {
    console.error("Failed to generate CUST ID:", e);
    return 'CUST100001';
  }
}

export default db;
