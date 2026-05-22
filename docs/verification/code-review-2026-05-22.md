# Code Review Evidence - 2026-05-22

## Findings Resolved

1. Python `PlanContract` accepted missing Phase 2 array fields while the TypeScript validator rejected them. The Python model now requires `hallways`, `doors`, `nurseStations`, `zones`, `pathNodes`, and `pathEdges`.
2. Web plan API responses validated layout shape but did not reject mismatched response metadata. The client now rejects `id` and `name` mismatches against `layout.planId` and `layout.name`.
3. Saved-plan refresh could lose the newly saved selection and render a duplicate fallback option. Refresh now preserves the preferred saved ID and only renders the fallback option before any saved plans are loaded.
4. The first web build after the refresh change caught a TypeScript handler mismatch. The refresh button now wraps the async call in a click handler.

## Commands Run

- `node scripts/verify-local.mjs`
- `npm --workspace packages/shared test`
- `cd apps/api && python -m pytest tests/contracts`
- `cd apps/api && python -m pytest`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Final Result

- Shared contract tests: `14 passed`
- API test suite: `44 passed`
- Web tests: `4 executed`
- Web build: passed
- Docker-backed plan API smoke: passed
- Local verification: passed
- Non-PHI scanner: passed
- Docs contract check: passed
