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

Simulation Execution proof covers the Issue 082 simulation run contract foundation, deterministic task execution, operational nurse queues, deterministic path travel time, event-derived scoring, simulation-derived reports, local fixture web proof surfaces, simulation report comparison, assignment variant running, optimizer boundary and audit proof, validated API simulation run persistence, simulation event referential integrity, simulation lifecycle ordering invariants, missed-task explanation fields, unified TypeScript/Python parity manifest checks, structured persisted-run validation errors, a fixture-stable hardened surge simulation snapshot, a fixture-stable hardened optimizer snapshot, and a proof-only simulation run retrieval UI. Every nurse, queue, or travel event task reference must map to a task represented in the same run's task-event stream. Task lifecycle validation requires started tasks to have ready events, completed tasks to have started events, no start before ready, no completion before start, no conflicting terminal states, and delayed tasks to resolve through a start or missed outcome. Missed-not-started task events must remain not started, consume no nurse busy minutes, and include projected start, travel, completion, and shift-duration fields for operational audit review. Simulation contract parity fixtures are controlled by `packages/shared/fixtures/simulation-contract-parity/manifest.json`; missing, unlisted, or cross-language mismatched fixtures fail the local parity script. Invalid persisted simulation run JSON is not returned as run data; it returns a deterministic `PERSISTED_SIMULATION_RUN_INVALID` code without leaking the stored payload. The hardened surge fixture in `packages/shared/fixtures/simulation-run-surge-hardened.json` must validate and deep-equal a rebuilt run while retaining at least one delayed or missed operational outcome. The hardened optimizer fixture in `packages/shared/fixtures/baseline-optimizer-hardened-output.json` must deep-equal rebuilt output, keep candidate IDs/order stable, use shared simulation score IDs, and preserve optimizer-candidate assignment reason behavior. The retrieval proof calls the bounded simulation run list endpoint, handles empty results and structured persisted-run validation errors, displays limitations, and does not request identity fields. Issue 082 is contract foundation only, not execution. The phase does not add EHR integration, clinical safety certification, hidden scoring, unseeded randomness, PDF export, file download, or GitHub Actions reliance. The optimizer remains operational-only and uses the shared simulation/scoring path.

Simulation Execution metric baseline proof adds Issue 117 Operational Variable Metric Contract to support operational comparisons across workload modes (3:1 vs 4:1), flow states (light, normal, busy, slammed), and layout baselines using reusable directional and provenance-aware metric fields. It adds no UI, API route, persistence behavior, optimizer change, recommendation surface, or clinical outcomes. The phase remains operational-only and retains no clinical safety certification, diagnosis, EHR, patient identity, or full-shift execution claims.

Issue 118 adds deterministic nurse walk-time summaries by nurse/task/room and a layout friction score derived only from travel-event-derived walk totals and unreachable penalties. It does not add optimizer behavior, recommendations, full-shift scheduling claims, or clinical interpretation language.

Issue 119 adds task-time and queue-delay summaries from simulation events, including direct task minutes, queue wait, task delay, travel-to-task minutes, missed task count, and deterministic task-density buckets.

Issue 120 adds patient-flow operational proxies for wait before first modeled task, idle time between task ready and start, delay exposure, and missed/unassigned proxy penalties, plus scenario- and room-scoped totals.

Issue 121 adds room-level turnover readiness proxies including blocked room minutes, turnover task minutes, delayed turnover minutes, missed turnover tasks, and room pressure scores from deterministic turnover/reset event-derived assumptions.

Issue 122 adds deterministic ratio and intensity scenario assumptions for 3:1 and 4:1 occupied-room coverage baselines across light, normal, busy, and slammed workload labels. It does not execute a simulation, alter assignments, or generate tasks.

Issue 123 adds deterministic pressure-band summaries that map operational metric values into explicit low, moderate, high, and critical bands, preserving source metric values and adding no optimizer or workflow guidance.

Issue 124 adds deterministic operational delta comparison output for matched baseline/modified metric sets with signed absolute deltas, deterministic signed percent deltas, zero-baseline handling, and directionality mapped to issue-117 metric directionality.

Issue 125 adds deterministic 3:1 vs 4:1 light-to-slammed scenario fixtures across light, normal, busy, and slammed intensities, ensuring monotonic pressure movement and pressure-band continuity for contrast proof.

Issue 126 adds a proof-only web dashboard surface that shows core operational outcome cards, 3:1 vs 4:1 ratio contrast, light vs slammed contrast, delta percentages, and pressure-band context without clinical, safety, or recommendation wording.

Issue 127 unifies active operational pressure-band labels on the low, moderate, high, and critical taxonomy for shared validation, outcome fixtures, and dashboard proof language.

Issue 128 moves the operational outcome dashboard proof data into `packages/shared` and keeps the web dashboard fixture as a display adapter over that shared source.

Issue 129 persists metric directionality on operational delta objects so serialized comparisons can validate improved, worse, and unchanged labels from delta data alone.

Issue 130 adds projected missed-task pressure to the patient wait/idle proxy so missed-not-started tasks with projected timing fields contribute operational pressure beyond terminal event timing.

Issue 131 adds shared nurse-level task burden metrics for direct task minutes, queue wait, delayed tasks, missed tasks, completed tasks, and assigned task counts.

Issue 132 carries feet-based travel distance through path travel responses, simulation travel events, and nurse walk layout-friction summary metrics.

Issue 133 documents the layout editor architecture, interaction contract, and geometry invariants before any drag/drop UI is added.

Issue 134 adds the shared editable layout geometry contract for rooms, doors, nurse stations/desks, hallways, EMS entry, trauma, and provider/pharmacy zones with persisted feet-based values only.

Issue 135 adds deterministic web coordinate transforms between persisted feet-based layout geometry and display-only pixels with zoom and pan support.

Issue 136 adds a deterministic feet-based snap grid engine for default, fine, point, rectangle, and resize-delta snapping without mutating source geometry.

Issue 137 adds a canonical operational metric registry for stable metric IDs, aliases, directionality, group, unit, source, scope, metric kind, and purpose. Registered throughput and direct-work metrics such as completed task count, assigned task count, and direct task minutes use neutral directionality so reduced work volume is not labeled as automatic improvement.

Issue 138 applies the operational metric registry to current shared outcome builders. Known and registered dynamic builder outputs now derive directionality and metric metadata from the registry, including neutral direct-work, completed-task, and assigned-task metrics.

Issue 139 generates shared dashboard proof data through a shared builder using canonical registry metrics, ratio/intensity assumptions, pressure banding, and operational delta comparison. The web dashboard adapter now consumes shared metric values and shared ratio deltas as display-only data.

Issue 140 extends editable layout room geometry with operational room metadata, including room number, room type, capacity type, hall-bed flag, and trauma-adjacent planning flag. Room metadata remains feet-based and operational-only; it does not add UI editing behavior, task generation, simulation reruns, diagnosis fields, identity fields, or clinical outcome claims.

Issue 141 adds a docs-only evidence consistency gate requiring every Issue 112+ command-output mapped artifact to be listed in `docs/verification/ISSUE_EVIDENCE_INDEX.json`. It updates the issue template and evidence contract so captured command output remains index-reviewable.

Issue 142 adds the deterministic layout editor state reducer for editable layout loading, ID-based selection, viewport state, default/fine snap mode, validation warnings, and dirty state. It does not add a visible stage, drag/drop, resizing, save/load, path sync, or simulation rerun behavior.

Issue 143 adds a proof-only SVG layout editor stage shell with a feet-based grid and viewport frame using the shared feet-to-pixel transform. It does not render editable objects, drag/drop, resize handles, save/load, path sync, or simulation rerun behavior.

Issue 144 adds viewport-only zoom and pan controls for the layout editor stage. Zoom is clamped, pan offsets are stored in feet, reset restores the default viewport, and source editable layout geometry remains unchanged.

Issue 145 adds a deterministic layout selection model for stable editable layout object IDs across rooms, doors, stations, hallways, and zones. Selection remains UI/editor state only and does not add rendering or editing behavior.

Issue 146 adds a read-only inspector panel contract for selected editable layout rooms, doors, stations, hallways, and zones. Inspector values are feet-based operational layout metadata only; no editing inputs, drag/drop, save/load, path sync, or simulation rerun behavior is added.

Issue 147 routes dashboard proof data through shared ratio/intensity assumptions, shared outcome builders, unified pressure bands, operational delta comparison, and the canonical metric registry before the web adapter displays it. The dashboard remains proof-only and does not add API, persistence, optimizer, recommendation, satisfaction, or staffing-certification behavior.

Issue 148 extracts the layout editor proof geometry into `apps/web/src/fixtures/layout-editor/layoutEditorProofFixture.ts`, validates it through the shared editable layout geometry contract, and keeps `LayoutEditorStage` display-only over fixture-owned feet-based geometry.

Issue 149 adds a deterministic layout object render pipeline that turns editable feet-based geometry into display-only render items with layer order, object metadata, pixel rectangles, accessibility labels, and hit-target keys. It does not add visible object shapes or editing behavior.

Issue 150 renders hallway and zone SVG shapes from editable layout geometry through the shared render pipeline. Hallways and zones remain read-only background/context layers with labels and accessibility metadata; no editing or selection wiring is added.

Issue 151 renders read-only room SVG shapes from editable room geometry through the shared render pipeline, including visible room number labels and room type accessibility metadata. No room editing, resizing, path sync, save/load, or simulation rerun behavior is added.

Issue 152 renders read-only door SVG shapes attached to room or hallway owner walls from feet-based owner, wall, offset, and width geometry. Missing owners deterministically do not render, and no door movement or editing behavior is added.

Issue 153 renders read-only station/desk SVG shapes from editable station geometry through the shared render pipeline, including visible station labels and station type accessibility metadata. No station editing, dragging, resizing, path sync, save/load, or simulation rerun behavior is added.

Issue 154 adds display-only selected styling for room, door, station, hallway, and zone shapes from existing editor selection state. It does not add click selection, drag/drop, resizing, inspector editing, path sync, save/load, or simulation rerun behavior.

Issue 155 wires read-only stage click selection for rendered layout objects. Clicking a room, door, station, hallway, or zone dispatches the existing selection action, updates the selected styling, and syncs the inspector without mutating geometry or adding drag/edit behavior.

Issue 156 adds the first constrained layout edit behavior: selected rooms can be moved in feet through snapped `xFeet`/`yFeet` deltas. Width, height, metadata, doors, path graph, persistence, collision validation, and simulation outputs are not synchronized or changed in this issue.

Issue 157 locks room drag snap accumulation semantics: sub-snap pointer movement accumulates in feet until it crosses the active default or fine snap threshold, then emits only snapped `xFeet`/`yFeet` room movement while retaining deterministic remainder feet. It does not add bounds validation, collision validation, door sync, path sync, persistence, resize, or simulation rerun behavior.

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
