# Banking Application With Copilot Release Developer Workflow

This workspace now contains a full-stack banking application and Copilot release automation instructions.

## Project Structure

- `backend/`: Express API with SQLite database.
- `frontend/`: React + Vite multi-page banking dashboard.
- `.github/copilot-instructions.md`: repository-level Copilot developer rules.
- `.github/prompts/release-update.prompt.md`: reusable agent prompt for scoped releases.
- `RELEASE_REQUEST_TEMPLATE.md`: template for submitting updates.

## Features

- SQLite database created at `backend/banking.sqlite` (auto-created on first backend run).
- Three seeded users in database.
- Authentication pages: Login, Register, Forgot Password.
- Role-based route protection (manager-only Users page).
- JWT-based backend authorization for protected API routes.
- Access token + refresh token session flow with refresh rotation on use.
- Password hashing with Node crypto scrypt.
- Brute-force mitigation: account locks for 15 minutes after 5 failed login attempts.
- Multi-page UI: Dashboard, Users, Accounts, Transactions, Transfers.
- Account listing with balances.
- Transaction history and create transaction workflows.
- Account-to-account transfer workflow.
- Responsive frontend for desktop and mobile.

## Run Locally

### 1) Start backend

1. `cd backend`
2. `npm install`
3. `npm run dev`

Backend runs at `http://localhost:4000`.

Optional environment variable for backend:
- `JWT_SECRET`: secret used to sign and verify JWT tokens. If not provided, a development fallback is used.
- `JWT_REFRESH_SECRET`: secret used to sign and verify refresh tokens.

The backend initializes schema and seed data on startup:
- users table
- accounts table
- transactions table

### 2) Start frontend

1. Open a second terminal.
2. `cd frontend`
3. `npm install`
4. `npm run dev`

Frontend runs at `http://localhost:5173` and proxies `/api` to backend.

All protected `/api/*` requests require `Authorization: Bearer <token>`.
When access tokens expire, frontend uses `/api/auth/refresh` with a refresh token to obtain a new token pair.
Password reset revokes all active refresh-token sessions for that user.

## Seeded Users

- Ava Smith (`user-1001`)
- Noah Patel (`user-1002`)
- Mia Johnson (`user-1003`)

## Default Login Credentials

- ava.smith@novabank.com / ava@123 (customer)
- noah.patel@novabank.com / noah@123 (customer)
- mia.johnson@novabank.com / mia@123 (manager)

Manager can access the Users page. Customers are redirected to Unauthorized for that route.

## Copilot As Release Developer

This repo is configured so Copilot can implement targeted updates by scope:

- `frontend`: only UI/client changes.
- `backend`: only API/server changes.
- `fullstack`: coordinated frontend + backend updates.

Use the request template in `RELEASE_REQUEST_TEMPLATE.md`.

### Example release request

"Release ID: v1.1.0
Scope: backend
Change Type: feature
Requirements: Add transfer endpoint to move funds between two accounts with full validation and audit transaction entries.
Non-goals: No frontend changes."

Copilot will then apply changes only in the requested scope and provide a release-oriented summary.
