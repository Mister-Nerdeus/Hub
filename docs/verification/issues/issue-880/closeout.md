# Issue 880 Closeout

## Problem
Assignment Editor Layout-Change Reset

## Code Review
- ManualAssignmentEditor now revalidates editor state when the active layout changes, rejects mismatched stored sets, and resets stale assignment target selection.

## Files Changed
- apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx
- apps/web/src/features/manual-assignment/manualAssignmentState.ts
- apps/web/src/features/manual-assignment/manualAssignmentStorage.ts
- apps/web/src/features/manual-assignment/__tests__/manualAssignmentLayoutChangeReset.test.ts
- scripts/check-manual-assignment-layout-change-reset.mjs
- scripts/lib/manual-scenario-foundation-utils.mjs
- docs/verification/manual-scenario-foundation-manifest.json
- docs/verification/issues/issue-880

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-manual-assignment-layout-change-reset.mjs --stage final --issue 880
- node scripts/check-manual-assignment-editor-ui.mjs --stage final --issue 880
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-880/manual-assignment-layout-change-reset-output.json
- docs/verification/issues/issue-880/layout-a-before.json
- docs/verification/issues/issue-880/layout-b-after.json
- docs/verification/issues/issue-880/stale-target-reset-proof.json
- docs/verification/issues/issue-880/screenshot-index.json
- docs/verification/issues/issue-880/screenshots/layout-change-reset-harness.png
- docs/verification/issues/issue-880/test-output/docker-compose-config.txt
- docs/verification/issues/issue-880/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-880/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-880/test-output/docker-compose-production-build-web.txt

## Known Limitations
- The layout-change proof is a deterministic web harness test; visual evidence is a static evidence marker for this issue.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only scenario foundation task.
