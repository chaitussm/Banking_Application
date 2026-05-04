import React, { useMemo, useState } from "react";
import { currency } from "../api";

export default function TransactionsPage({ accounts, transactions, onCreateTransaction }) {
  const [form, setForm] = useState({ accountId: "", kind: "debit", amount: "", note: "" });
  const [error, setError] = useState("");

  const initialAccountId = useMemo(() => accounts[0]?.id || "", [accounts]);

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      await onCreateTransaction({
        accountId: form.accountId || initialAccountId,
        kind: form.kind,
        amount: Number(form.amount),
        note: form.note
      });
      setForm((prev) => ({ ...prev, amount: "", note: "" }));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="panel">
      <h2>Transactions</h2>
      <form className="simple-form" onSubmit={submit}>
        <label>
          Account
          <select
            value={form.accountId || initialAccountId}
            onChange={(event) => setForm((prev) => ({ ...prev, accountId: event.target.value }))}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.holderName} ({account.id})
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select
            value={form.kind}
            onChange={(event) => setForm((prev) => ({ ...prev, kind: event.target.value }))}
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </label>
        <label>
          Amount
          <input
            type="number"
            min="1"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            required
          />
        </label>
        <label>
          Note
          <input
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          />
        </label>
        <button type="submit">Create Transaction</button>
        {error ? <p className="error">{error}</p> : null}
      </form>

      <div className="list-grid">
        {transactions.map((tx) => (
          <article key={tx.id} className="list-card tx-item">
            <h3>{tx.note || "No note"}</h3>
            <p>{new Date(tx.timestamp).toLocaleString()}</p>
            <strong className={tx.kind === "credit" ? "credit" : "debit"}>
              {tx.kind === "credit" ? "+" : "-"}
              {currency(tx.amount)}
            </strong>
            <small>{tx.accountId}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
