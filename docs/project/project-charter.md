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
