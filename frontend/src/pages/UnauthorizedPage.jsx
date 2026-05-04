import React from "react";
import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <section className="panel auth-panel">
      <h2>Unauthorized</h2>
      <p className="subtitle">Your account role does not allow access to this page.</p>
      <p>
        Go to <Link to="/dashboard">Dashboard</Link>.
      </p>
    </section>
  );
}
