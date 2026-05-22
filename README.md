# Nerdeus ER Pod Shift Simulator

Operational simulation workspace for modeling ER pod layouts, abstract room load, assignments, scoring, and later seeded simulation runs.

This project is not a clinical safety system, EHR integration, patient record system, or patient outcome prediction tool.

## Workspace

- `apps/api`: FastAPI service and Python contracts.
- `apps/web`: React/Vite web shell.
- `packages/shared`: TypeScript contracts and shared fixtures.
- `scripts`: local verification and guardrail checks.
- `docs`: architecture, contracts, compliance, Codex guardrails, and evidence.

## Core Commands

```text
docker compose config
docker compose up --build -d
docker compose ps
curl -f http://localhost:${API_HOST_PORT:-8010}/health
cd apps/api && pytest
cd apps/web && npm run build
cd packages/shared && npm test
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
node scripts/validate-plan-contract.mjs packages/shared/fixtures/plan-er-pod-phase2.json
```

## Local Docker Ports

Docker Compose is the local runtime for the web, API, and database. Container ports stay stable, while host ports are configurable through `.env`.

- API: `API_HOST_PORT` defaults to `8010` and maps to container port `8000`.
- Web: `WEB_HOST_PORT` defaults to `5180` and maps to container port `5173`.
- Postgres: container port `5432` is internal and is not published on the host by default.

Keep `VITE_API_BASE_URL` aligned with `API_HOST_PORT`. With defaults, the API health check is `http://localhost:8010/health` and the web app is `http://localhost:5180`.

## Plan Persistence

Saved plans use the `plans` table with `id`, `name`, optional `description`, `layout_json`, `created_at`, and `updated_at`. PostgreSQL stores `layout_json` as JSONB. Run migrations from the API environment:

```text
cd apps/api && alembic upgrade head
```

The web app can save/load plans through `VITE_API_BASE_URL` and import/export validated plan JSON through the shared contract validator.

## Phase Status

Phase 2 Plan Builder foundation is implemented through the evidence gate in `docs/verification/phase-2-plan-builder-evidence.md`. Phase 3 nurse assignment, scoring, simulation, and optimization have not started.
