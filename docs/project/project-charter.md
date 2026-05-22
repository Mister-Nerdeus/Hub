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

Phase 3 nurse assignment and scoring must not begin until the Phase 2 evidence gate passes.
