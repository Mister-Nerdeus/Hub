# Phase Evidence Gate Registry

Phase evidence gates live in `scripts/phase-evidence-gates.mjs` and are consumed by `scripts/check-docs-contracts.mjs`.

## Registry Shape

Each gate contains:

- `label`: human-readable gate name used in failure output.
- `paths`: required evidence files that must exist and be non-empty.
- `contentChecks`: optional per-file phrase checks for phase-level evidence docs and checklists.

## Rules For New Gates

- Add new phase gates to `scripts/phase-evidence-gates.mjs`.
- Keep `scripts/check-docs-contracts.mjs` responsible for generic issue closeout checks and registry execution.
- Do not remove or weaken existing Phase 2-7 gates when adding later phases.
- Missing required evidence must fail the docs checker.
- Empty required evidence must fail the docs checker.
- Content checks should require the phase scope and explicit boundary language, including no PHI and any issue-specific non-goals.

## Local-First Boundary

The registry is a local docs checker input only. It does not add GitHub Actions, remote proof, dependencies, API endpoints, persistence, optimizer behavior, scenario recommendation, file upload, file download, PDF export, clinical safety claims, or PHI.
