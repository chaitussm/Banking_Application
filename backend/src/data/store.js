import { hashPassword, verifyPassword, isHashedPassword } from "../auth/password.js";

const maxFailedLoginAttempts = 5;
const lockoutWindowMs = 15 * 60 * 1000;

function mapAccount(row) {
  return {
    id: row.id,
    userId: row.user_id,
    holderName: row.full_name,
    type: row.type,
    balance: row.balance,
    currency: row.currency,
    createdAt: row.created_at
  };
}

function mapTransaction(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    kind: row.kind,
    amount: row.amount,
    note: row.note || "",
    timestamp: row.timestamp
  };
}

function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at
  };
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function createStore(db) {
  return {
    async getUserById(userId) {
      const row = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
      return row ? mapUser(row) : null;
    },

    async authenticateUser({ email, password }) {
      const row = await db.get("SELECT * FROM users WHERE email = ?", [email]);

      if (!row) {
        throw new Error("Invalid email or password");
      }

      if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
        throw new Error("Account is temporarily locked. Please try again later.");
      }

      const passwordOk = await verifyPassword(password, row.password);

      if (!passwordOk) {
        const currentFailures = Number(row.failed_login_attempts || 0);
        const nextFailures = currentFailures + 1;
        if (nextFailures >= maxFailedLoginAttempts) {
          const lockedUntil = new Date(Date.now() + lockoutWindowMs).toISOString();
          await db.run(
            "UPDATE users SET failed_login_attempts = 0, locked_until = ? WHERE id = ?",
            [lockedUntil, row.id]
          );
        } else {
          await db.run(
            "UPDATE users SET failed_login_attempts = ?, locked_until = NULL WHERE id = ?",
            [nextFailures, row.id]
          );
        }

        throw new Error("Invalid email or password");
      }

      if (!isHashedPassword(row.password)) {
        const hashed = await hashPassword(password);
        await db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, row.id]);
      }

      await db.run(
        "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?",
        [row.id]
      );

      return mapUser(row);
    },

    async registerUser({ fullName, email, password }) {
      if (!fullName || !email || !password) {
        throw new Error("fullName, email, and password are required");
      }

      const existing = await db.get("SELECT id FROM users WHERE email = ?", [email]);
      if (existing) {
        throw new Error("Email is already registered");
      }

      const now = new Date().toISOString();
      const userId = generateId("user");
      const accountId = generateId("acc");
      const hashedPassword = await hashPassword(password);

      await db.exec("BEGIN TRANSACTION");
      try {
        await db.run(
          "INSERT INTO users (id, full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, fullName, email, hashedPassword, "customer", now]
        );
        await db.run(
          "INSERT INTO accounts (id, user_id, type, balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [accountId, userId, "checking", 0, "USD", now]
        );
        await db.exec("COMMIT");
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }

      const user = await db.get("SELECT * FROM users WHERE id = ?", [userId]);
      return mapUser(user);
    },

    async resetPassword({ email, newPassword }) {
      if (!email || !newPassword) {
        throw new Error("email and newPassword are required");
      }

      const user = await db.get("SELECT id FROM users WHERE email = ?", [email]);
      if (!user) {
        throw new Error("No user found with this email");
      }

      const hashedPassword = await hashPassword(newPassword);
      await db.run(
        "UPDATE users SET password = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?",
        [hashedPassword, user.id]
      );

      await this.revokeAllRefreshTokensForUser(user.id);

      return { updated: true };
    },

    async saveRefreshToken({ tokenId, userId, expiresAt }) {
      await db.run(
        "INSERT INTO refresh_tokens (token_id, user_id, expires_at, revoked, created_at) VALUES (?, ?, ?, ?, ?)",
        [tokenId, userId, expiresAt, 0, new Date().toISOString()]
      );
    },

    async getRefreshToken(tokenId) {
      return db.get("SELECT * FROM refresh_tokens WHERE token_id = ?", [tokenId]);
    },

    async revokeRefreshToken(tokenId) {
      await db.run("UPDATE refresh_tokens SET revoked = 1 WHERE token_id = ?", [tokenId]);
    },

    async revokeAllRefreshTokensForUser(userId) {
      await db.run("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", [userId]);
    },

    async getUsers() {
      const rows = await db.all("SELECT * FROM users ORDER BY created_at ASC");
      return rows.map(mapUser);
    },

    async getAccounts() {
      const rows = await db.all(`
        SELECT accounts.*, users.full_name
        FROM accounts
        JOIN users ON users.id = accounts.user_id
        ORDER BY accounts.created_at ASC
      `);

      return rows.map(mapAccount);
    },

    async getAccountById(accountId) {
      const row = await db.get(
        `
          SELECT accounts.*, users.full_name
          FROM accounts
          JOIN users ON users.id = accounts.user_id
          WHERE accounts.id = ?
        `,
        [accountId]
      );

      return row ? mapAccount(row) : null;
    },

    async getTransactions(accountId) {
      if (!accountId) {
        const rows = await db.all("SELECT * FROM transactions ORDER BY timestamp DESC");
        return rows.map(mapTransaction);
      }

      const rows = await db.all(
        "SELECT * FROM transactions WHERE account_id = ? ORDER BY timestamp DESC",
        [accountId]
      );
      return rows.map(mapTransaction);
    },

    async createTransaction({ accountId, kind, amount, note }) {
      const account = await this.getAccountById(accountId);

      if (!account) {
        throw new Error("Account not found");
      }

      if (!["credit", "debit"].includes(kind)) {
        throw new Error("Transaction kind must be credit or debit");
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Amount must be greater than zero");
      }

      const delta = kind === "credit" ? amount : -amount;
      const nextBalance = account.balance + delta;

      if (nextBalance < 0) {
        throw new Error("Insufficient funds");
      }

      const txId = `txn-${Date.now()}`;
      const timestamp = new Date().toISOString();

      await db.run("UPDATE accounts SET balance = ? WHERE id = ?", [nextBalance, accountId]);
      await db.run(
        "INSERT INTO transactions (id, account_id, kind, amount, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        [txId, accountId, kind, amount, note || "", timestamp]
      );

      return {
        id: txId,
        accountId,
        kind,
        amount,
        note: note || "",
        timestamp
      };
    },

    async transferBetweenAccounts({ fromAccountId, toAccountId, amount, note }) {
      if (fromAccountId === toAccountId) {
        throw new Error("Source and destination accounts must be different");
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Amount must be greater than zero");
      }

      const fromAccount = await this.getAccountById(fromAccountId);
      const toAccount = await this.getAccountById(toAccountId);

      if (!fromAccount || !toAccount) {
        throw new Error("One or more accounts not found");
      }

      if (fromAccount.balance < amount) {
        throw new Error("Insufficient funds in source account");
      }

      const timestamp = new Date().toISOString();
      const debitTxId = `txn-${Date.now()}-d`;
      const creditTxId = `txn-${Date.now()}-c`;

      await db.exec("BEGIN TRANSACTION");
      try {
        await db.run("UPDATE accounts SET balance = ? WHERE id = ?", [fromAccount.balance - amount, fromAccountId]);
        await db.run("UPDATE accounts SET balance = ? WHERE id = ?", [toAccount.balance + amount, toAccountId]);
        await db.run(
          "INSERT INTO transactions (id, account_id, kind, amount, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
          [debitTxId, fromAccountId, "debit", amount, note || "Transfer out", timestamp]
        );
        await db.run(
          "INSERT INTO transactions (id, account_id, kind, amount, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
          [creditTxId, toAccountId, "credit", amount, note || "Transfer in", timestamp]
        );
        await db.exec("COMMIT");
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }

      return {
        fromTransactionId: debitTxId,
        toTransactionId: creditTxId,
        amount,
        timestamp
      };
    }
  };
}
