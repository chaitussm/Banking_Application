import React, { useMemo, useState } from "react";

export default function TransfersPage({ accounts, onTransfer }) {
  const [form, setForm] = useState({ fromAccountId: "", toAccountId: "", amount: "", note: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const defaults = useMemo(() => {
    if (accounts.length < 2) {
      return { from: "", to: "" };
    }

    return {
      from: accounts[0].id,
      to: accounts[1].id
    };
  }, [accounts]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await onTransfer({
        fromAccountId: form.fromAccountId || defaults.from,
        toAccountId: form.toAccountId || defaults.to,
        amount: Number(form.amount),
        note: form.note
      });
      setMessage("Transfer completed successfully.");
      setForm((prev) => ({ ...prev, amount: "", note: "" }));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="panel">
      <h2>Transfers</h2>
      <form className="simple-form" onSubmit={submit}>
        <label>
          From Account
          <select
            value={form.fromAccountId || defaults.from}
            onChange={(event) => setForm((prev) => ({ ...prev, fromAccountId: event.target.value }))}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.holderName} ({account.id})
              </option>
            ))}
          </select>
        </label>
        <label>
          To Account
          <select
            value={form.toAccountId || defaults.to}
            onChange={(event) => setForm((prev) => ({ ...prev, toAccountId: event.target.value }))}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.holderName} ({account.id})
              </option>
            ))}
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
        <button type="submit">Transfer Funds</button>
        {message ? <p className="credit">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </form>
    </section>
  );
}
