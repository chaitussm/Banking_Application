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

## CI/CD Pipelines

This repository now includes two GitHub Actions workflows:

- `.github/workflows/dev-pipeline.yml`
	- Triggers on push to `master`
	- Triggers on pull requests targeting `master`
	- Runs daily at 10:00 PM IST (`30 16 * * *` UTC)
	- Publishes artifacts:
		- `backend-build`
		- `frontend-build`

- `.github/workflows/deploy-pipeline.yml`
	- Triggers after successful `Dev Pipeline` runs on `master`
	- Triggers on version tags matching `v*` for production release deployments
	- Supports manual deployment with `workflow_dispatch` input:
		- `dev`
		- `staging`
		- `production`
	- Manual production gate input:
		- `approve_production` must be `yes`
	- Runs separate deployment jobs for:
		- `dev`
		- `staging`
		- `production`
	- Uses SSH + rsync for real server deployment
	- Fails fast with a clear error when required deployment secrets are missing

### Deployment Secrets

Set these repository secrets in GitHub before running deployment workflows:

- Dev
	- `DEV_SSH_HOST`
	- `DEV_SSH_USER`
	- `DEV_SSH_KEY`
	- `DEV_SSH_PORT` (optional, default `22`)
	- `DEV_APP_DIR` (absolute deployment directory on server)
	- `DEV_RESTART_CMD` (optional command to restart services)

- Staging
	- `STAGING_SSH_HOST`
	- `STAGING_SSH_USER`
	- `STAGING_SSH_KEY`
	- `STAGING_SSH_PORT` (optional, default `22`)
	- `STAGING_APP_DIR`
	- `STAGING_RESTART_CMD` (optional)

- Production
	- `PROD_SSH_HOST`
	- `PROD_SSH_USER`
	- `PROD_SSH_KEY`
	- `PROD_SSH_PORT` (optional, default `22`)
	- `PROD_APP_DIR`
	- `PROD_RESTART_CMD` (optional)

### Remote Server Requirements

Each target server should have:

- Node.js and npm installed
- SSH access for the configured deploy user
- Permission to write into the configured app directory
- Any process manager required by your restart command (for example `pm2` or `systemctl`)

### Branch Protection Recommendation

In your GitHub branch protection rule for `master`, mark these checks as required:

- `Backend Checks`
- `Frontend Checks`
