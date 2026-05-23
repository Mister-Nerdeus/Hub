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

Phase 4 deterministic task-generation proof covers the assumptions register, operational task templates, typical and slammed day profiles, expanded shift scenario inputs, a seeded random utility, and reproducible generated operational task fixtures. Generated tasks are not assigned to nurses, task completion is not simulated, walking routes are not calculated, and no optimizer exists.

Phase 5 task-assignment proof covers assumptions-driven scoring parity, public generated task-set validation, deterministic task timeline aggregation, nurse task assignment contracts, and basic manual room coverage assignment proof. It does not add optimization, workload balancing, task completion simulation, delay calculation, walking route calculation, reports, persistence, or UI.

Phase 6 reporting proof covers operational report contracts, deterministic report builders, unassigned task and warning reports, and an API-free web proof surface using local synthetic fixtures. It does not add PDF export, API endpoints, report persistence, optimization, task completion simulation, walking route calculation, delay calculation, reassignment suggestions, or clinical safety claims.

Phase 7 comparison and export proof covers the scenario comparison contract, manual scenario comparison builder, report export JSON bundle contract, report export JSON bundle builder, and an API-free comparison proof surface using local synthetic fixtures. It does not add optimization, recommendation, clinical safety claims, API endpoints, persistence, PDF export, download behavior, route calculation, delay calculation, or task completion simulation.

Phase 7 comparison is intentionally report-centric: validated operational reports are the compared artifacts, `baselineReportId` and `reportIds` remain first-class, and scenario IDs stay visible inside comparison items. Future scenario-centric views can be derived later without replacing the current report-centric contract.

Phase 8 export review proof covers report-centric comparison documentation, deterministic timestamp input cleanup, the phase evidence gate registry, local export bundle import validation, and an API-free export bundle review proof surface. It does not add optimization, recommendation, API endpoints, persistence, file upload, file download, PDF export, clinical safety claims, or PHI.

Phase 9 bundle audit proof covers deterministic export bundle integrity hashes, local bundle audit trail contracts, a read-only bundle audit builder, and an API-free bundle audit proof surface. It does not add upload/download behavior, API endpoints, persistence, signatures, encryption, optimization, recommendation, legal compliance claims, tamper-proof claims, clinical safety claims, or PHI.

Plan Builder Input proof covers validated plan-builder defaults, deterministic plan generation from defaults, basic and advanced web input forms, generated plan preview, and apply-to-draft behavior through the existing reducer. It does not add optimizer behavior, recommendation behavior, new API endpoints, new persistence beyond existing plan save/load, PHI, patient identity, diagnosis text, clinical notes, EHR imports, or new nurse scoring/reporting/comparison/export/audit behavior.

Simulation Execution proof covers the Issue 082 simulation run contract foundation, deterministic task execution, operational nurse queues, deterministic path travel time, event-derived scoring, simulation-derived reports, local fixture web proof surfaces, simulation report comparison, assignment variant running, optimizer boundary and audit proof, validated API simulation run persistence, simulation event referential integrity, simulation lifecycle ordering invariants, missed-task explanation fields, unified TypeScript/Python parity manifest checks, and structured persisted-run validation errors. Every nurse, queue, or travel event task reference must map to a task represented in the same run's task-event stream. Task lifecycle validation requires started tasks to have ready events, completed tasks to have started events, no start before ready, no completion before start, no conflicting terminal states, and delayed tasks to resolve through a start or missed outcome. Missed-not-started task events must remain not started, consume no nurse busy minutes, and include projected start, travel, completion, and shift-duration fields for operational audit review. Simulation contract parity fixtures are controlled by `packages/shared/fixtures/simulation-contract-parity/manifest.json`; missing, unlisted, or cross-language mismatched fixtures fail the local parity script. Invalid persisted simulation run JSON is not returned as run data; it returns a deterministic `PERSISTED_SIMULATION_RUN_INVALID` code without leaking the stored payload. Issue 082 is contract foundation only, not execution. The phase does not add EHR integration, clinical safety certification, hidden scoring, unseeded randomness, PDF export, file download, or GitHub Actions reliance. The optimizer remains operational-only and uses the shared simulation/scoring path.

Hardening pause: Issues 097-106 must complete before new feature expansion. This pause covers audit indexing, TypeScript/Python contract parity, missed-task semantics, queue pause/resume deferral, optimizer candidate constraints, assignment source truth, persistence read hardening, captured command-output gates, issue-level evidence indexing, and determinism cleanup.

Issue 098 establishes shared TypeScript/Python simulation contract parity fixtures before later hardening changes expand simulation semantics.

Issue 101 constrains baseline optimizer candidates before simulation scoring: generated candidates must reference known tasks, known nurses, and must preserve base unassigned tasks. The optimizer remains an operational candidate generator that runs through the shared assignment variant runner and simulation score path.

Issue 102 adds assignment-source truth for optimizer candidates. Manual assignments keep `manual_room_coverage`; generated optimizer candidate assignments use `optimizer_candidate` before shared variant execution.

Issue 103 hardens simulation persistence reads. Listing is bounded with default pagination, and stored simulation JSON is validated before list/get responses return it.

Issue 104 adds a captured command-output evidence gate. Issues 104 and later must include at least one non-empty output artifact; command names and closeout text are not enough by themselves.

Issue 105 adds a deterministic issue-level evidence index for Issues 082 and later. Missing or empty indexed evidence now reports the exact issue number.

Issue 106 completes cleanup-only hardening for the simulation batch by removing a known no-op pattern and adding deterministic output locks for simulation and optimizer paths. No feature behavior is added.

Issue 099 defines the V1 missed-task model: tasks that cannot complete inside the shift window are not started, consume no nurse busy minutes, and use the explicit not-started miss reason. Attempted-overrun behavior remains deferred.

Issue 100 defers queue pause/resume interruption actions. Current V1 queue events accept only entered, started-from-queue, and released actions until real interruption state is implemented in a later issue.

The docs guardrail command `node scripts/check-docs-contracts.mjs` enforces Issue 015+ closeout and command artifacts, plus phase evidence gates from `scripts/phase-evidence-gates.mjs` for Phase 2 through the current completed phase.
From Issue 112 onward, each issue must also include `command-output-map.json`; the docs gate verifies every command in `commands.txt` maps to at least one non-empty output artifact under that issue folder.
Use `node scripts/scaffold-issue-evidence-index-entry.mjs --issue XXX --title "Issue Title"` to dry-run deterministic issue evidence index entries before writing them.
