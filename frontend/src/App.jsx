import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { api, setAuthToken } from "./api";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import AccountsPage from "./pages/AccountsPage";
import TransactionsPage from "./pages/TransactionsPage";
import TransfersPage from "./pages/TransfersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

const sessionKey = "novabank-session";

function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = window.localStorage.getItem(sessionKey);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);
    if (parsed.user && parsed.token) {
      return parsed;
    }

    return null;
  });
  const user = session?.user || null;
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function saveSession(nextSession) {
    setSession(nextSession);
    setAuthToken(nextSession.token);
    window.localStorage.setItem(sessionKey, JSON.stringify(nextSession));
  }

  function handleLogin(nextSession) {
    saveSession(nextSession);
  }

  async function handleLogout() {
    if (session?.refreshToken) {
      try {
        await api.logoutSession({ refreshToken: session.refreshToken });
      } catch (_error) {
        // Keep logout best-effort.
      }
    }

    setSession(null);
    setUsers([]);
    setAccounts([]);
    setTransactions([]);
    setAuthToken("");
    window.localStorage.removeItem(sessionKey);
  }

  async function loadData() {
    if (!user) {
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const [usersPayload, accountsPayload, txPayload] = await Promise.all([
        api.getUsers(),
        api.getAccounts(),
        api.getTransactions()
      ]);

      setUsers(usersPayload.users || []);
      setAccounts(accountsPayload.accounts || []);
      setTransactions(txPayload.transactions || []);
    } catch (requestError) {
      if (
        (requestError.message === "Invalid or expired token" || requestError.message === "Missing bearer token") &&
        session?.refreshToken
      ) {
        try {
          const refreshed = await api.refreshSession({ refreshToken: session.refreshToken });
          const nextSession = {
            user: refreshed.user,
            token: refreshed.token,
            refreshToken: refreshed.refreshToken
          };
          saveSession(nextSession);
          return;
        } catch (_refreshError) {
          await handleLogout();
          return;
        }
      }

      setError(requestError.message || "Failed to load application data");
    } finally {
      setLoading(false);
    }
  }

  async function createTransaction(input) {
    await api.createTransaction(input);
    await loadData();
  }

  async function createTransfer(input) {
    await api.createTransfer(input);
    await loadData();
  }

  useEffect(() => {
    if (session?.token) {
      setAuthToken(session.token);
    }

    loadData();
  }, [session?.token, user]);

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/accounts", label: "Accounts" },
    { to: "/transactions", label: "Transactions" },
    { to: "/transfers", label: "Transfers" }
  ];

  if (user?.role === "manager") {
    navItems.splice(1, 0, { to: "/users", label: "Users" });
  }

  if (user && loading) {
    return <main className="app-shell"><section className="panel"><p>Loading banking application...</p></section></main>;
  }

  if (!user) {
    return (
      <main className="app-shell auth-shell">
        <section className="hero-card full">
          <p className="eyebrow">Banking Operations</p>
          <h1>NovaBank Access Portal</h1>
          <p className="subtitle">Sign in to access banking pages. Manager role can access Users page.</p>
        </section>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-card full">
        <p className="eyebrow">Banking Operations</p>
        <h1>NovaBank Banking Application</h1>
        <p className="subtitle">Signed in as {user.fullName} ({user.role}).</p>
        <button className="logout-btn" type="button" onClick={() => { void handleLogout(); }}>Logout</button>
      </section>

      <section className="panel sidebar">
        <h2>Pages</h2>
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </section>

      <section className="panel content">
        {error ? <p className="error">{error}</p> : null}
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <DashboardPage users={users} accounts={accounts} transactions={transactions} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute user={user} allowedRoles={["manager"]}>
                <UsersPage users={users} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute user={user}>
                <AccountsPage accounts={accounts} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute user={user}>
                <TransactionsPage
                  accounts={accounts}
                  transactions={transactions}
                  onCreateTransaction={createTransaction}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfers"
            element={
              <ProtectedRoute user={user}>
                <TransfersPage accounts={accounts} onTransfer={createTransfer} />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </section>
    </main>
  );
}
