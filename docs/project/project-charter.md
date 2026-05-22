# Project Charter

The Nerdeus ER Pod Shift Simulator models operational workload in an ER pod using abstract layouts, room load, nurse assignments, scoring, and later seeded simulation.

## Goals

- Build a reproducible planning and simulation tool for operational ER pod workflows.
- Keep contracts explicit across the API, web app, shared TypeScript package, fixtures, and Python models.
- Preserve non-PHI boundaries in code, docs, fixtures, tests, and reports.
- Require evidence artifacts for every issue before it is considered complete.

## Non-Goals

- No PHI.
- No real patient identity.
- No EHR integration.
- No clinical safety certification language.
- No patient outcome prediction.
- No hidden scoring model.
- No optimizer before scoring.

## First Foundation Scope

Issues `001` through `014B` establish the repo structure, local runtime, API shell, web shell, database migration base, CI, non-PHI scanner, shared contracts, Python contracts, fixture parity, and contract parity workflow.

## Phase 2 Plan Builder Foundation

Issues `015` through `024` establish configurable Docker host ports, the expanded physical layout plan contract, JSONB plan persistence, plan API save/load endpoints, plan JSON validation, a read-only SVG renderer, deterministic local draft editing, browser save/load, browser JSON import/export, and the Phase 2 evidence gate.

## Phase 3 Manual Assignment Foundation

Phase 3 adds manual nurse assignment contracts, abstract room-load enum contracts, deterministic room workload scoring, deterministic warning generation, deterministic nurse burden scoring, and an API-free web proof surface. Phase 3 remains local-first and uses synthetic operational data only.

## Phase 4 Deterministic Task Generation Foundation

Phase 4 adds visible assumptions, operational task templates, typical and slammed day profiles, expanded shift scenario inputs, deterministic seeded randomness, and a basic reproducible generated operational task proof. Phase 4 remains local-first and uses synthetic operational data only.

## Phase 5 Task Assignment Foundation

Phase 5 adds assumptions-driven scoring parity, generated task-set validation, deterministic task timeline aggregation, nurse task assignment contracts, and a basic rule-based proof that generated operational tasks can be assigned through existing manual room coverage. Phase 5 remains local-first and uses synthetic operational data only.

Task completion simulation, walking route calculation, delay calculation, seeded full-shift simulation, assignment persistence, workload balancing, and optimization remain out of scope until later accepted contracts.
