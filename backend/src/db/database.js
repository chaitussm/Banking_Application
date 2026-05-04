import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import { hashPassword, isHashedPassword } from "../auth/password.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../../banking.sqlite");

export async function createDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const columns = await db.all("PRAGMA table_info(users)");
  const hasPassword = columns.some((column) => column.name === "password");
  if (!hasPassword) {
    await db.exec("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'changeme123'");
  }

  const hasFailedAttempts = columns.some((column) => column.name === "failed_login_attempts");
  if (!hasFailedAttempts) {
    await db.exec("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0");
  }

  const hasLockedUntil = columns.some((column) => column.name === "locked_until");
  if (!hasLockedUntil) {
    await db.exec("ALTER TABLE users ADD COLUMN locked_until TEXT");
  }

  const existingUsers = await db.all("SELECT id, password FROM users");
  for (const user of existingUsers) {
    if (!isHashedPassword(user.password)) {
      const hashed = await hashPassword(user.password);
      await db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
    }
  }

  return db;
}

export async function seedDatabase(db) {
  const row = await db.get("SELECT COUNT(1) as count FROM users");

  if (row.count > 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.run(
    "INSERT INTO users (id, full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ["user-1001", "Ava Smith", "ava.smith@novabank.com", await hashPassword("ava@123"), "customer", now]
  );
  await db.run(
    "INSERT INTO users (id, full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ["user-1002", "Noah Patel", "noah.patel@novabank.com", await hashPassword("noah@123"), "customer", now]
  );
  await db.run(
    "INSERT INTO users (id, full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ["user-1003", "Mia Johnson", "mia.johnson@novabank.com", await hashPassword("mia@123"), "manager", now]
  );

  await db.run(
    "INSERT INTO accounts (id, user_id, type, balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ["acc-1001", "user-1001", "checking", 4200, "USD", now]
  );
  await db.run(
    "INSERT INTO accounts (id, user_id, type, balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ["acc-1002", "user-1002", "savings", 8950, "USD", now]
  );
  await db.run(
    "INSERT INTO accounts (id, user_id, type, balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ["acc-1003", "user-1003", "checking", 12400, "USD", now]
  );

  await db.run(
    "INSERT INTO transactions (id, account_id, kind, amount, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    ["txn-9001", "acc-1001", "credit", 1200, "Salary", "2026-05-01T10:00:00.000Z"]
  );
  await db.run(
    "INSERT INTO transactions (id, account_id, kind, amount, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    ["txn-9002", "acc-1001", "debit", 300, "Groceries", "2026-05-02T09:30:00.000Z"]
  );
  await db.run(
    "INSERT INTO transactions (id, account_id, kind, amount, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    ["txn-9003", "acc-1002", "credit", 450, "Interest", "2026-05-03T07:00:00.000Z"]
  );
}
