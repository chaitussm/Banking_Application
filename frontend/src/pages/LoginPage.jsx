import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = await api.login(form);
      onLogin(payload);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="panel auth-panel">
      <h2>Login</h2>
      <p className="subtitle">Use one of the seeded users to sign in.</p>
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
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>
        <button type="submit">Sign In</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      <p>
        New user? <Link to="/register">Create account</Link>
      </p>
      <p>
        Forgot password? <Link to="/forgot-password">Reset password</Link>
      </p>
    </section>
  );
}
