const apiBase = "/api";
let authToken = "";

export function setAuthToken(token) {
  authToken = token || "";
}

async function getJson(path) {
  const headers = authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {};

  const response = await fetch(`${apiBase}${path}`, { headers });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

async function postJson(path, body) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (path.startsWith("/auth/")) {
    delete headers.Authorization;
  }

  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

export function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export const api = {
  login: (input) => postJson("/auth/login", input),
  register: (input) => postJson("/auth/register", input),
  forgotPassword: (input) => postJson("/auth/forgot-password", input),
  refreshSession: (input) => postJson("/auth/refresh", input),
  logoutSession: (input) => postJson("/auth/logout", input),
  getUsers: () => getJson("/users"),
  getAccounts: () => getJson("/accounts"),
  getTransactions: (accountId) =>
    getJson(accountId ? `/transactions?accountId=${encodeURIComponent(accountId)}` : "/transactions"),
  createTransaction: (input) => postJson("/transactions", input),
  createTransfer: (input) => postJson("/transfers", input)
};
