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

function headerLabel(header) {
  return String(header).replace(/_/g, " ");
}

function tableHtml(headers, rows, options = {}) {
  if (!rows.length) {
    return `<p style="margin:0 0 16px;color:#5b6368;font-style:italic;">No rows</p>`;
  }

  const emphasize = options.emphasize || {};
  const head = headers
    .map(
      (header) =>
        `<th style="padding:10px 12px;background:#146356;color:#fffdf8;font-size:12px;letter-spacing:.04em;text-transform:uppercase;text-align:left;font-weight:700;">${escapeHtml(headerLabel(header))}</th>`
    )
    .join("");
  const body = rows
    .map((row, index) => {
      const bg = index % 2 === 0 ? "#fffdf8" : "#f4f2ec";
      const cells = headers
        .map((header) => {
          const raw = row[header] ?? "";
          const extra = emphasize[header] ? "font-weight:700;color:#146356;" : "";
          return `<td style="padding:10px 12px;border-bottom:1px solid #ddd4c3;font-size:13px;vertical-align:top;${extra}">${escapeHtml(raw)}</td>`;
        })
        .join("");
      return `<tr style="background:${bg};">${cells}</tr>`;
    })
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:0 0 18px;border:1px solid #ddd4c3;border-radius:10px;overflow:hidden;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function metricCard(label, value, hint = "") {
  return `<td style="width:25%;padding:0 6px 12px;">
    <div style="background:#fffdf8;border:1px solid #ddd4c3;border-left:4px solid #146356;border-radius:12px;padding:14px 16px;">
      <div style="color:#5b6368;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(label)}</div>
      <div style="font-size:20px;font-weight:700;margin-top:6px;word-break:break-word;color:#1e2428;">${escapeHtml(value)}</div>
      ${hint ? `<div style="color:#5b6368;font-size:11px;margin-top:4px;">${escapeHtml(hint)}</div>` : ""}
    </div>
  </td>`;
}

function statusBadge(status) {
  const normalized = String(status || "unknown").toLowerCase();
  let background = "#c1723f";
  let label = status;
  if (normalized === "success") {
    background = "#146356";
  } else if (normalized === "failure" || normalized === "cancelled") {
    background = "#b03d2f";
  }
  return `<span style="display:inline-block;background:${background};color:#fff;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">${escapeHtml(label)}</span>`;
}

function sectionTitle(title, subtitle = "") {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 12px;">
    <tr>
      <td style="border-bottom:2px solid #146356;padding:0 0 8px;">
        <h2 style="margin:0;font-size:20px;color:#1e2428;">${escapeHtml(title)}</h2>
        ${subtitle ? `<p style="margin:6px 0 0;color:#5b6368;font-size:13px;">${escapeHtml(subtitle)}</p>` : ""}
      </td>
    </tr>
  </table>`;
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
      sql: table.sql || "",
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
  const headerBg =
    overall === "success" ? "#146356" : overall === "failure" ? "#b03d2f" : "#c1723f";

  const schemaSections = database.tableDetails
    .map((table) => {
      const columns = tableHtml(
        ["name", "type", "notnull", "pk", "dflt_value"],
        table.columns
      );
      const fks = table.foreignKeys.length
        ? tableHtml(["from", "table", "to", "on_delete", "on_update"], table.foreignKeys)
        : `<p style="margin:0 0 16px;color:#5b6368;font-style:italic;">No foreign keys</p>`;
      const ddl = table.sql
        ? `<pre style="margin:0 0 16px;padding:12px 14px;background:#1e2428;color:#f4f2ec;border-radius:10px;font-size:12px;overflow:auto;white-space:pre-wrap;">${escapeHtml(table.sql)}</pre>`
        : "";
      return `
        <h3 style="margin:18px 0 10px;color:#1e2428;">
          ${escapeHtml(table.name)}
          <span style="display:inline-block;background:#d4efe6;color:#146356;border-radius:999px;padding:2px 10px;font-size:12px;margin-left:8px;">${table.rowCount} rows</span>
        </h3>
        ${ddl}
        ${columns}
        <p style="color:#5b6368;font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px;">Foreign keys</p>
        ${fks}
      `;
    })
    .join("");

  const jobRows = [
    {
      job: "Backend Checks",
      status: backendStatus,
      purpose: "Install, syntax validation, backend-build artifact"
    },
    {
      job: "Frontend Checks",
      status: frontendStatus,
      purpose: "Install, production build, frontend-build artifact"
    },
    {
      job: "Pipeline HTML Report",
      status: "generated",
      purpose: "SQLite HTML report artifact and email"
    }
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NovaBank Dev Pipeline Report</title>
</head>
<body style="margin:0;padding:0;background:#1e2428;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e2428;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e2428;padding:28px 12px;">
    <tr>
      <td align="center">
        <table width="900" cellpadding="0" cellspacing="0" style="max-width:900px;background:#f4f2ec;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background:${headerBg};padding:32px 36px;color:#fff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.9;">NovaBank CI</div>
                    <h1 style="margin:8px 0 10px;font-size:30px;">Dev Pipeline Report</h1>
                    <div style="opacity:.95;font-size:14px;">${escapeHtml(generatedAt)}</div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    ${statusBadge(overall)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 30px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${metricCard("Event", pipeline.eventName)}
                  ${metricCard("Branch", pipeline.refName)}
                  ${metricCard("Actor", pipeline.actor)}
                  ${metricCard("Run", `#${pipeline.runNumber}`, `attempt ${pipeline.runAttempt}`)}
                </tr>
              </table>
              <p style="color:#5b6368;margin:4px 6px 20px;font-size:14px;">
                Repository <strong style="color:#1e2428;">${escapeHtml(pipeline.repository)}</strong> ·
                SHA <span style="background:#fffdf8;border:1px solid #ddd4c3;border-radius:6px;padding:1px 6px;font-family:ui-monospace,Consolas,monospace;font-size:12px;">${escapeHtml(pipeline.sha)}</span> ·
                Workflow <strong>${escapeHtml(pipeline.workflow)}</strong> ·
                <a href="${escapeHtml(pipeline.runUrl)}" style="color:#146356;font-weight:700;">Open GitHub run</a>
              </p>

              ${sectionTitle("Pipeline jobs", "Existing Backend Checks and Frontend Checks were not changed.")}
              ${tableHtml(["job", "status", "purpose"], jobRows, { emphasize: { status: true } })}

              ${sectionTitle("SQLite database", `${database.dbPath} · ${database.fileSize}`)}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${metricCard("Tables", database.tableDetails.length)}
                  ${metricCard("Users", database.users.length)}
                  ${metricCard("Accounts", database.accounts.length)}
                  ${metricCard("Transactions", database.transactions.length)}
                </tr>
              </table>
              ${tableHtml(
                ["pragma", "value"],
                [
                  { pragma: "foreign_keys", value: database.pragmas.foreign_keys },
                  { pragma: "journal_mode", value: database.pragmas.journal_mode },
                  { pragma: "page_size", value: database.pragmas.page_size },
                  { pragma: "page_count", value: database.pragmas.page_count },
                  { pragma: "user_version", value: database.pragmas.user_version }
                ]
              )}
              <p style="color:#5b6368;margin:0 6px 8px;font-size:13px;">
                Refresh tokens: <strong>${escapeHtml(database.refreshTokenStats.total || 0)}</strong> total ·
                <strong>${escapeHtml(database.refreshTokenStats.active || 0)}</strong> active ·
                <strong>${escapeHtml(database.refreshTokenStats.revoked || 0)}</strong> revoked.
                Token values are omitted from this report.
              </p>

              ${sectionTitle("Schema", "CREATE TABLE statements, columns, and foreign keys.")}
              ${schemaSections}

              ${sectionTitle("Indexes")}
              ${tableHtml(["name", "table", "sql"], database.indexes)}

              ${sectionTitle("Users", "Password hashes are excluded.")}
              ${tableHtml(
                ["id", "full_name", "email", "role", "failed_login_attempts", "locked_until", "created_at"],
                database.users,
                { emphasize: { role: true } }
              )}

              ${sectionTitle("Accounts")}
              ${tableHtml(
                ["id", "user_id", "type", "balance", "currency", "created_at"],
                database.accounts,
                { emphasize: { balance: true } }
              )}

              ${sectionTitle("Transactions")}
              ${tableHtml(
                ["id", "account_id", "kind", "amount", "note", "timestamp"],
                database.transactions,
                { emphasize: { amount: true } }
              )}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 28px;color:#5b6368;font-size:12px;border-top:1px solid #ddd4c3;background:#fffdf8;">
              Generated by the NovaBank Dev Pipeline report job. Email uses SMTP_FROM, SMTP_TO, SMTP_PASSWORD, and SMTP_PORT 587.
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
    runAttempt: process.env.PIPELINE_RUN_ATTEMPT || process.env.GITHUB_RUN_ATTEMPT || "1",
    actor: process.env.PIPELINE_ACTOR || process.env.GITHUB_ACTOR || "local",
    workflow: process.env.PIPELINE_WORKFLOW || process.env.GITHUB_WORKFLOW || "Dev Pipeline",
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
