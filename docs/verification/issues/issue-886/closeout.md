# Issue 886 Closeout

## Problem
Manual Scenario Create Duplicate Rename UI

## Code Review
- The Scenarios route now exposes manual scenario create, duplicate, rename, select, and linked-reference controls without ranking or scoring copy.

## Files Changed
- apps/web/src/features/manual-scenario/manualScenarioState.ts
- apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx
- apps/web/src/features/manual-scenario/ManualScenarioControls.tsx
- apps/web/src/features/manual-scenario/ManualScenarioList.tsx
- apps/web/src/features/manual-scenario/ManualScenario.css
- apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts
- apps/web/src/features/scenarios/__tests__/ScenarioRatioComparisonPanel.test.tsx
- apps/web/src/App.tsx
- scripts/check-manual-scenario-ui.mjs
- docs/verification/manual-scenario-foundation-manifest.json
- docs/verification/issues/issue-886

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-manual-scenario-ui.mjs --stage final --issue 886
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-886/manual-scenario-ui-output.json
- docs/verification/issues/issue-886/screenshot-index.json
- docs/verification/issues/issue-886/screenshots/manual-scenario-ui.png
- docs/verification/issues/issue-886/test-output/docker-compose-config.txt
- docs/verification/issues/issue-886/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-886/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-886/test-output/docker-compose-production-build-web.txt

## Known Limitations
- Static UI proof is paired with browser proof in Issue 887.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only scenario foundation task.
