import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'mlm.db');
const db = new Database(dbPath);

// Enable foreign key support
db.exec('PRAGMA foreign_keys = ON;');

// Create tables if they do not exist
db.exec(`
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

  CREATE TABLE IF NOT EXISTS Transactions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL, -- 'JOINING_FEE', 'PAIR_MATCHING_BONUS', 'WITHDRAWAL'
    description TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES Users(id)
  );

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

// Create unique indexes for query speed
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_Users_parentId ON Users(parentId);
  CREATE INDEX IF NOT EXISTS idx_Users_sponsorId ON Users(sponsorId);
  CREATE INDEX IF NOT EXISTS idx_Transactions_userId ON Transactions(userId);
`);

// Helper to generate sequential Customer ID (e.g. CUST100001)
export function generateNextCustomerId(): string {
  // Query to find the maximum sequential ID
  const row = db.prepare("SELECT id FROM Users WHERE id LIKE 'CUST%' ORDER BY id DESC LIMIT 1").get() as any;
  if (!row) {
    return 'CUST100001';
  }

  // Parse ID string (e.g., CUST100234 -> 100234)
  const numericPart = parseInt(row.id.replace('CUST', ''), 10);
  if (isNaN(numericPart)) {
    return 'CUST100001';
  }

  return `CUST${numericPart + 1}`;
}

// Seed admin/root user if table is empty
const checkAdmin = db.prepare("SELECT * FROM Users WHERE id = ?");
const adminUser = checkAdmin.get("CUST100001") as any;

if (!adminUser) {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync("admin123", salt);
  
  db.prepare(`
    INSERT OR IGNORE INTO Users (id, fullName, email, passwordHash, role, isAdmin, status, walletBalance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run("CUST100001", "Administrator", "vedantsonawane5012@gmail.com", passwordHash, "ADMIN", 1, "active", 0.00);

  console.log("Database initialized. Default admin seeded: CUST100001 / admin123 (email: vedantsonawane5012@gmail.com)");
}

export default db;
