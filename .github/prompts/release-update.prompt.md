---
mode: agent
model: GPT-5.3-Codex
description: Apply a scoped release update to the banking application
---
You are implementing a release update for this banking app.

Use this request contract:
- Release ID: {{release_id}}
- Scope: {{scope}} (frontend|backend|fullstack)
- Change type: {{change_type}}
- Requirements: {{requirements}}
- Non-goals: {{non_goals}}

Tasks:
1. Identify files impacted by the scope.
2. Implement the requested changes with minimal unrelated edits.
3. Keep frontend/backend contracts synchronized if scope is fullstack.
4. Update documentation when behavior changes.
5. Return a concise release report with modified files and verification notes.
