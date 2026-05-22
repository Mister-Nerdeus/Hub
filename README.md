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
curl -f http://localhost:8000/health
cd apps/api && pytest
cd apps/web && npm run build
cd packages/shared && npm test
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
```
