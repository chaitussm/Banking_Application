import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ForgotPasswordPage() {
  const [form, setForm] = useState({ email: "", newPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.forgotPassword(form);
      setMessage("Password updated. You can now login.");
      setForm({ email: "", newPassword: "" });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="panel auth-panel">
      <h2>Forgot Password</h2>
      <form className="simple-form" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </label>
        <label>
          New Password
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            required
          />
        </label>
        <button type="submit">Reset Password</button>
        {message ? <p className="credit">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </form>
      <p>
        Back to <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
