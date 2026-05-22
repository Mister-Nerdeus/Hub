# Monorepo Structure

```text
apps/
  api/        FastAPI service, Python contracts, Alembic base, pytest suite.
  web/        React/Vite web shell.
packages/
  shared/     TypeScript contracts and shared non-PHI fixtures.
scripts/      Local verification, non-PHI scanning, and contract parity checks.
docs/         Contracts, architecture, compliance, Codex rules, and evidence.
```

## Boundary Rules

- Shared fixture JSON lives in `packages/shared/fixtures`.
- TypeScript contract validation lives in `packages/shared/src`.
- Python contract validation lives in `apps/api/app/contracts.py`.
- Both TypeScript and Python tests must validate the same fixture files.
- UI state, selected objects, and transient editor state must not appear in persisted plan JSON.
