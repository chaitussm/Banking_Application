import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const dbPath = path.resolve(__dirname, "../banking.sqlite");

const outputDir = process.env.REPORT_OUTPUT_DIR
  ? path.resolve(process.env.REPORT_OUTPUT_DIR)
  : path.join(repoRoot, "artifacts", "reports");
const outputHtml = path.join(outputDir, "pipeline-report.html");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function quoteIdent(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe SQL identifier: ${name}`);
  }
  return `"${name}"`;
}

function sqliteJson(sql) {
  const output = execFileSync("sqlite3", ["-json", dbPath, sql], {
    encoding: "utf8"
  }).trim();
  if (!output) {
    return [];
  }
  return JSON.parse(output);
}

function sqliteValue(sql, column) {
  const rows = sqliteJson(sql);
  if (!rows.length) {
    return "";
  }
  return rows[0][column];
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "n/a";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusClass(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "success") {
    return "ok";
  }
  if (normalized === "failure" || normalized === "cancelled") {
    return "bad";
  }
  return "warn";
}

function tableHtml(headers, rows) {
  if (!rows.length) {
    return `<p class="empty">No rows</p>`;
  }

  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`)
          .join("")}</tr>`
    )
    .join("");

  return `<table width="100%"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function metricCard(label, value) {
  return `<td class="metric" style="background:#f8fafc;border-radius:12px;padding:12px 14px;width:25%;"><div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(label)}</div><div style="font-size:18px;font-weight:700;margin-top:4px;word-break:break-word;">${escapeHtml(value)}</div></td>`;
}

function collectDatabase() {
  const tables = sqliteJson(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const indexes = sqliteJson(
    "SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL ORDER BY tbl_name, name"
  );

  const tableDetails = tables.map((table) => {
    const ident = quoteIdent(table.name);
    const columns = sqliteJson(`PRAGMA table_info(${ident})`).map((column) => ({
      name: column.name,
      type: column.type,
      notnull: column.notnull ? "YES" : "NO",
      pk: column.pk ? "YES" : "NO",
      dflt_value: column.dflt_value ?? ""
    }));
    const foreignKeys = sqliteJson(`PRAGMA foreign_key_list(${ident})`).map((fk) => ({
      from: fk.from,
      table: fk.table,
      to: fk.to,
      on_delete: fk.on_delete,
      on_update: fk.on_update
    }));
    const rowCount = Number(sqliteValue(`SELECT COUNT(1) AS count FROM ${ident}`, "count") || 0);

    return {
      name: table.name,
      rowCount,
      columns,
      foreignKeys
    };
  });

  const users = sqliteJson(
    "SELECT id, full_name, email, role, failed_login_attempts, locked_until, created_at FROM users ORDER BY created_at, id"
  );
  const accounts = sqliteJson(
    "SELECT id, user_id, type, printf('%.2f', balance) AS balance, currency, created_at FROM accounts ORDER BY created_at, id"
  );
  const transactions = sqliteJson(
    "SELECT id, account_id, kind, printf('%.2f', amount) AS amount, note, timestamp FROM transactions ORDER BY timestamp, id"
  );
  const refreshTokenStats = sqliteJson(
    "SELECT COUNT(1) AS total, SUM(CASE WHEN revoked = 1 THEN 1 ELSE 0 END) AS revoked, SUM(CASE WHEN revoked = 0 THEN 1 ELSE 0 END) AS active FROM refresh_tokens"
  )[0] || { total: 0, revoked: 0, active: 0 };

  return {
    indexes: indexes.map((index) => ({
      name: index.name,
      table: index.tbl_name,
      sql: index.sql
    })),
    tableDetails,
    users,
    accounts,
    transactions,
    refreshTokenStats,
    pragmas: {
      foreign_keys: sqliteValue("PRAGMA foreign_keys", "foreign_keys"),
      journal_mode: sqliteValue("PRAGMA journal_mode", "journal_mode"),
      page_size: sqliteValue("PRAGMA page_size", "page_size"),
      page_count: sqliteValue("PRAGMA page_count", "page_count"),
      user_version: sqliteValue("PRAGMA user_version", "user_version")
    }
  };
}

function renderHtml({ pipeline, database, generatedAt }) {
  const backendStatus = pipeline.backendStatus;
  const frontendStatus = pipeline.frontendStatus;
  const overall =
    backendStatus === "success" && frontendStatus === "success"
      ? "success"
      : backendStatus === "failure" || frontendStatus === "failure"
        ? "failure"
        : "mixed";

  const schemaSections = database.tableDetails
    .map((table) => {
      const columns = tableHtml(
        ["name", "type", "notnull", "pk", "dflt_value"],
        table.columns
      );
      const fks = table.foreignKeys.length
        ? tableHtml(["from", "table", "to", "on_delete", "on_update"], table.foreignKeys)
        : `<p class="empty">No foreign keys</p>`;
      return `
        <h3 style="margin:20px 0 8px;">${escapeHtml(table.name)} <span class="pill">${table.rowCount} rows</span></h3>
        ${columns}
        <p class="subhead">Foreign keys</p>
        ${fks}
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NovaBank Dev Pipeline Report</title>
  <style>
    table { border-collapse: collapse; width: 100%; margin: 0 0 16px; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #f8fafc; color: #334155; }
    .ok { color:#047857;font-weight:700; }
    .bad { color:#b91c1c;font-weight:700; }
    .warn { color:#b45309;font-weight:700; }
    .pill { display:inline-block;background:#ecfeff;color:#0f766e;border-radius:999px;padding:2px 8px;font-size:12px;margin-left:8px; }
    .empty { color:#64748b;font-style:italic; }
    .subhead { color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.05em; }
    code { background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:12px; }
  </style>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="880" cellpadding="0" cellspacing="0" style="max-width:880px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#0f766e;padding:28px 32px;color:#fff;">
              <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;">NovaBank CI</div>
              <h1 style="margin:8px 0 4px;font-size:28px;">Dev Pipeline Report</h1>
              <div style="opacity:.9;">${escapeHtml(generatedAt)} · overall status: <strong>${escapeHtml(overall)}</strong></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" style="border-collapse:separate;border-spacing:12px 0;margin-bottom:8px;">
                <tr>
                  ${metricCard("Event", pipeline.eventName)}
                  ${metricCard("Branch", pipeline.refName)}
                  ${metricCard("Backend", backendStatus)}
                  ${metricCard("Frontend", frontendStatus)}
                </tr>
              </table>
              <p style="color:#475569;margin:8px 0 20px;">
                Repository <strong>${escapeHtml(pipeline.repository)}</strong> ·
                SHA <code>${escapeHtml(pipeline.sha)}</code> ·
                Run <a href="${escapeHtml(pipeline.runUrl)}">#${escapeHtml(pipeline.runNumber)}</a>
              </p>

              <h2 style="margin:0 0 12px;font-size:20px;">Pipeline jobs</h2>
              <table width="100%">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Backend Checks</td>
                    <td class="${statusClass(backendStatus)}">${escapeHtml(backendStatus)}</td>
                    <td>Install, syntax validation, backend-build artifact</td>
                  </tr>
                  <tr>
                    <td>Frontend Checks</td>
                    <td class="${statusClass(frontendStatus)}">${escapeHtml(frontendStatus)}</td>
                    <td>Install, production build, frontend-build artifact</td>
                  </tr>
                </tbody>
              </table>

              <h2 style="margin:24px 0 12px;font-size:20px;">SQLite database</h2>
              <p style="color:#475569;">Engine: SQLite · File: <code>${escapeHtml(database.dbPath)}</code> · Size: ${escapeHtml(database.fileSize)}</p>
              <table width="100%" style="border-collapse:separate;border-spacing:12px 0;margin:8px 0 20px;">
                <tr>
                  ${metricCard("Tables", database.tableDetails.length)}
                  ${metricCard("Users", database.users.length)}
                  ${metricCard("Accounts", database.accounts.length)}
                  ${metricCard("Transactions", database.transactions.length)}
                </tr>
              </table>
              <p style="color:#475569;">PRAGMA foreign_keys=${escapeHtml(database.pragmas.foreign_keys)} · journal_mode=${escapeHtml(database.pragmas.journal_mode)} · page_size=${escapeHtml(database.pragmas.page_size)} · page_count=${escapeHtml(database.pragmas.page_count)} · user_version=${escapeHtml(database.pragmas.user_version)}</p>
              <p style="color:#475569;">Refresh tokens: ${escapeHtml(database.refreshTokenStats.total || 0)} total · ${escapeHtml(database.refreshTokenStats.active || 0)} active · ${escapeHtml(database.refreshTokenStats.revoked || 0)} revoked. Token values are omitted from this report.</p>

              <h2 style="margin:24px 0 12px;font-size:20px;">Schema</h2>
              ${schemaSections}

              <h2 style="margin:8px 0 12px;font-size:20px;">Indexes</h2>
              ${tableHtml(["name", "table", "sql"], database.indexes)}

              <h2 style="margin:24px 0 12px;font-size:20px;">Users</h2>
              <p class="empty">Password hashes are excluded.</p>
              ${tableHtml(
                ["id", "full_name", "email", "role", "failed_login_attempts", "locked_until", "created_at"],
                database.users
              )}

              <h2 style="margin:24px 0 12px;font-size:20px;">Accounts</h2>
              ${tableHtml(["id", "user_id", "type", "balance", "currency", "created_at"], database.accounts)}

              <h2 style="margin:24px 0 12px;font-size:20px;">Transactions</h2>
              ${tableHtml(["id", "account_id", "kind", "amount", "note", "timestamp"], database.transactions)}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">
              Generated by the NovaBank Dev Pipeline report job. Existing backend and frontend checks were not changed.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database not found at ${dbPath}`);
  }

  const database = collectDatabase();
  const pipeline = {
    eventName: process.env.GITHUB_EVENT_NAME || "local",
    refName: process.env.GITHUB_REF_NAME || "local",
    repository: process.env.GITHUB_REPOSITORY || "local/workspace",
    sha: (process.env.GITHUB_SHA || "local").slice(0, 12),
    runNumber: process.env.GITHUB_RUN_NUMBER || "n/a",
    runUrl:
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : "#",
    backendStatus: process.env.BACKEND_JOB_RESULT || "n/a",
    frontendStatus: process.env.FRONTEND_JOB_RESULT || "n/a"
  };

  const html = renderHtml({
    pipeline,
    database: {
      ...database,
      dbPath,
      fileSize: formatBytes(fs.statSync(dbPath).size)
    },
    generatedAt: new Date().toISOString()
  });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputHtml, html, "utf8");
  console.log(`Wrote HTML report to ${outputHtml}`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
