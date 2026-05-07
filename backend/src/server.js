import express from "express";
import cors from "cors";
import {
  createStore
} from "./data/store.js";
import { createDatabase, seedDatabase } from "./db/database.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from "./auth/jwt.js";
import { randomUUID } from "crypto";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let store;

function parseBearerToken(headerValue) {
  if (!headerValue || !headerValue.startsWith("Bearer ")) {
    return null;
  }

  return headerValue.slice(7);
}

function requireAuth(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch (_error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}

async function issueTokenPair(user) {
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken({ userId: user.id, tokenId });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await store.saveRefreshToken({ tokenId, userId: user.id, expiresAt });

  return {
    token: signAccessToken(user),
    refreshToken
  };
}

app.use((req, res, next) => {
  if (!store) {
    res.status(503).json({ error: "Service is initializing, please retry." });
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/accounts", requireAuth, (_req, res) => {
  store.getAccounts().then((accounts) => {
    res.status(200).json({ accounts });
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  store
    .authenticateUser({ email, password })
    .then(async (user) => {
      const tokens = await issueTokenPair(user);
      res.status(200).json({ user, ...tokens });
    })
    .catch((error) => {
      res.status(401).json({ error: error.message });
    });
});

app.post("/api/auth/register", (req, res) => {
  const { fullName, email, password } = req.body;

  store
    .registerUser({ fullName, email, password })
    .then(async (user) => {
      const tokens = await issueTokenPair(user);
      res.status(201).json({ user, ...tokens });
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email, newPassword } = req.body;

  store
    .resetPassword({ email, newPassword })
    .then(() => {
      res.status(200).json({ status: "Password updated" });
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
});

app.post("/api/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    if (payload.tokenType !== "refresh") {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const session = await store.getRefreshToken(payload.tokenId);
    if (!session || session.revoked === 1 || new Date(session.expires_at).getTime() < Date.now()) {
      res.status(401).json({ error: "Refresh token is invalid or expired" });
      return;
    }

    const user = await store.getUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }

    await store.revokeRefreshToken(payload.tokenId);
    const tokens = await issueTokenPair(user);

    res.status(200).json({ user, ...tokens });
  } catch (_error) {
    res.status(401).json({ error: "Refresh token is invalid or expired" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    if (payload.tokenId) {
      await store.revokeRefreshToken(payload.tokenId);
    }
  } catch (_error) {
    // Keep logout idempotent.
  }

  res.status(200).json({ status: "Logged out" });
});

app.use("/api", requireAuth);

app.get("/api/users", requireRole(["manager"]), (_req, res) => {
  store.getUsers().then((users) => {
    res.status(200).json({ users });
  });
});

app.get("/api/accounts/:id", (req, res) => {
  store.getAccountById(req.params.id).then((account) => {
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    res.status(200).json({ account });
  });
});

app.get("/api/transactions", (req, res) => {
  const accountId = req.query.accountId;
  store.getTransactions(accountId).then((transactions) => {
    res.status(200).json({ transactions });
  });
});

app.post("/api/transactions", (req, res) => {
  const { accountId, kind, amount, note } = req.body;

  store
    .createTransaction({
      accountId,
      kind,
      amount: Number(amount),
      note
    })
    .then((transaction) => {
      res.status(201).json({ transaction });
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
});

app.post("/api/transfers", (req, res) => {
  const { fromAccountId, toAccountId, amount, note } = req.body;

  store
    .transferBetweenAccounts({
      fromAccountId,
      toAccountId,
      amount: Number(amount),
      note
    })
    .then((transfer) => {
      res.status(201).json({ transfer });
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
});

async function startServer() {
  const db = await createDatabase();
  await seedDatabase(db);
  store = createStore(db);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Banking API running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start Banking API", error);
  process.exit(1);
});
