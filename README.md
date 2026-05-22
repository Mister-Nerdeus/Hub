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
docker compose down
docker compose up --build -d
docker compose ps
docker compose --profile tools run --rm migrate
curl -f http://localhost:${API_HOST_PORT:-8010}/health
node scripts/verify-docker-plan-api.mjs
cd apps/api && pytest
npm --workspace apps/web test
cd apps/web && npm run build
cd packages/shared && npm test
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
npm run validate:plan -- packages/shared/fixtures/plan-er-pod-phase2.json
```

## Local-First Verification

For this project stage, local verification artifacts are the required closeout proof. GitHub Actions may exist, but they are not the closeout gate unless explicitly requested.

Run local verification from a stopped Docker state:

```text
docker compose down
node scripts/verify-local.mjs
```

On Windows, the preferred wrapper is:

```text
docker compose down
./scripts/verify-local.ps1
```

The verifier starts the Docker stack, runs migrations, performs local contract and no-PHI checks, runs shared/web/API tests, builds the web app, and performs Docker-backed API and web smoke checks.
The Docker plan API smoke helper writes transient response evidence to the OS temp directory by default; set `EVIDENCE_DIR` when an issue needs tracked response artifacts.

To generate a consolidated local evidence pack:

```text
npm run evidence:local
```

By default, the evidence pack writes transient artifacts under the OS temp directory so routine local testing does not dirty tracked documentation paths. Use tracked mode only when formal issue evidence requires it:

```text
npm run evidence:local -- --tracked
npm run evidence:local -- --out docs/verification/local-runs/latest
LOCAL_EVIDENCE_DIR=docs/verification/local-runs/latest npm run evidence:local
```

Evidence output target precedence is `--out <path>`, then `LOCAL_EVIDENCE_DIR`, then `--tracked`, then the transient OS temp default. The manifest records `outputMode` as `transient`, `tracked`, or `custom`, and records the selected `outputDir`.

## Local Docker Ports

Docker Compose is the local runtime for the web, API, and database. Container ports stay stable, while host ports are configurable through `.env`.

- API: `API_HOST_PORT` defaults to `8010` and maps to container port `8000`.
- Web: `WEB_HOST_PORT` defaults to `5180` and maps to container port `5173`.
- Postgres: container port `5432` is internal and is not published on the host by default.

Keep `VITE_API_BASE_URL` aligned with `API_HOST_PORT`. With defaults, the API health check is `http://localhost:8010/health` and the web app is `http://localhost:5180`.

## Plan Persistence

Saved plans use the `plans` table with `id`, `name`, optional `description`, `layout_json`, `created_at`, and `updated_at`. PostgreSQL stores `layout_json` as JSONB. Run migrations from the API environment:

```text
docker compose --profile tools run --rm migrate
```

The web app can save/load plans through `VITE_API_BASE_URL` and import/export validated plan JSON through the shared contract validator.
`layout.description` is the canonical description; API responses must keep the record description equal to the layout description.
The Phase 2 plan contract alignment is documented in `docs/contracts/phase-2-plan-contract-alignment.md`.

## Phase Status

Phase 2 Plan Builder foundation is implemented through the evidence gate in `docs/verification/phase-2-plan-builder-evidence.md`.

Phase 3 manual assignment proof covers shared nurse and room-load contracts, deterministic room workload scoring, deterministic manual assignment warnings, deterministic nurse burden scoring, and an API-free web proof surface. Seeded full-shift simulation and optimization are still not implemented.

The docs guardrail command `node scripts/check-docs-contracts.mjs` enforces Issue 015+ closeout and command artifacts, plus the Phase 2 gate evidence for Issue 024 and the Phase 3 gate evidence for Issue 038. The Phase 3 gate requires non-empty evidence, checklist, scoring output, warning output, screenshot, commands, and closeout artifacts.
