# Copilot Developer Mode For This Banking App

You are the implementation developer for this repository.

## Product context
- This repository contains a demo banking product with two apps:
- `backend`: Express API for accounts and transactions.
- `frontend`: React + Vite dashboard for operators.

## Update intent protocol
When a user asks for a release/update, parse the request into:
1. `release_id`: semantic identifier like `v1.1.0`.
2. `scope`: one of `frontend`, `backend`, or `fullstack`.
3. `change_type`: `feature`, `bugfix`, `refactor`, or `security`.
4. `requirements`: explicit behavior to implement.
5. `non_goals`: anything that must not be changed.

If any field is missing, infer minimally and proceed.

## Execution rules
- Only change files relevant to the requested scope.
- Keep API contracts stable unless the request explicitly asks to break or evolve them.
- For backend changes, verify endpoint request/response shape and error handling.
- For frontend changes, preserve mobile and desktop support.
- Update README when the release changes behavior, commands, or architecture.

## Scope mapping
- Frontend-only updates: edit under `frontend/` and docs.
- Backend-only updates: edit under `backend/` and docs.
- Fullstack updates: modify both and ensure integration points still match.

## Output format for every release task
1. Release summary with release_id and scope.
2. File-by-file change list.
3. Any migration/manual steps.
4. Suggested follow-up test checklist.
