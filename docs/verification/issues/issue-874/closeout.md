# Issue 874 Closeout

## Problem
Manual Assignment Active Floorplan Fallback Fix

## Code Review
- ManualAssignmentEditor previously selected the canonical fixture unless the active floorplan had split rooms; the selection helper now uses any active floorplan and reserves the canonical fixture for explicit demo/proof mode or no active floorplan.

## Files Changed
- apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx
- apps/web/src/features/manual-assignment/manualAssignmentDemoMode.ts
- apps/web/src/features/manual-assignment/__tests__/manualAssignmentDemoMode.test.ts
- apps/web/src/features/manual-assignment/ManualAssignmentFoundation.css
- scripts/check-manual-assignment-active-floorplan-fallback.mjs
- docs/verification/assignment-foundation-manifest.json
- docs/verification/issues/issue-874

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-manual-assignment-active-floorplan-fallback.mjs --stage final --issue 874
- node scripts/check-manual-assignment-editor-ui.mjs --stage final --issue 874
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-874/manual-assignment-active-floorplan-fallback-output.json
- docs/verification/issues/issue-874/active-floorplan-no-split-room-proof.json
- docs/verification/issues/issue-874/canonical-demo-mode-proof.json
- docs/verification/issues/issue-874/screenshot-index.json
- docs/verification/issues/issue-874/screenshots
- docs/verification/issues/issue-874/test-output/docker-compose-config.txt
- docs/verification/issues/issue-874/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-874/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-874/test-output/docker-compose-production-build-web.txt

## Known Limitations
- No-active-floorplan fallback is contract-verified by the selection helper; the browser route normally starts with the active default floorplan.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only assignment foundation task.
