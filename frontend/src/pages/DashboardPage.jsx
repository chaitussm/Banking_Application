import React from "react";
import { currency } from "../api";

export default function DashboardPage({ users, accounts, transactions }) {
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);

  return (
    <section className="panel">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <article className="stat-card">
          <p>Users</p>
          <strong>{users.length}</strong>
        </article>
        <article className="stat-card">
          <p>Accounts</p>
          <strong>{accounts.length}</strong>
        </article>
        <article className="stat-card">
          <p>Total Balance</p>
          <strong>{currency(totalBalance)}</strong>
        </article>
        <article className="stat-card">
          <p>Transactions</p>
          <strong>{transactions.length}</strong>
        </article>
      </div>
    </section>
  );
}
