import React from "react";
import { currency } from "../api";

export default function AccountsPage({ accounts }) {
  return (
    <section className="panel">
      <h2>Accounts</h2>
      <div className="list-grid">
        {accounts.map((account) => (
          <article key={account.id} className="list-card">
            <h3>{account.holderName}</h3>
            <p>{account.type.toUpperCase()}</p>
            <strong>{currency(account.balance)}</strong>
            <small>{account.id}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
