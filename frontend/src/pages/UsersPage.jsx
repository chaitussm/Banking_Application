import React from "react";

export default function UsersPage({ users }) {
  return (
    <section className="panel">
      <h2>Users</h2>
      <p className="subtitle">Three seeded users are available in the database.</p>
      <div className="list-grid">
        {users.map((user) => (
          <article key={user.id} className="list-card">
            <h3>{user.fullName}</h3>
            <p>{user.email}</p>
            <small>{user.role.toUpperCase()}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
