# Issue 718 Closeout

## Problem
Simulation Copy Overclaim Fix

## Code Review
- The floorplan card exposed a direct simulation action and default floorplans were marked selected for simulation; normal floorplan flow now stops at assignment/scenario preparation.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/ActiveFloorplanCard.tsx
- apps/web/src/features/floorplans/ActiveFloorplanHub.tsx
- apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx
- apps/web/src/features/floorplans/activeFloorplanSelectorViewModel.ts
- apps/web/src/features/floorplans/activeFloorplanState.ts
- apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts
- apps/web/src/App.tsx
- scripts/check-simulation-copy-overclaim.mjs
- docs/verification/issues/issue-718/

## Commands Run
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-simulation-copy-overclaim.mjs --stage no-use-for-simulation-floorplan-only --allow-partial --issue 718
- node scripts/check-simulation-copy-overclaim.mjs --stage prepare-copy --allow-partial --issue 718
- node scripts/check-milestone-a-no-overclaim.mjs --stage no-simulation-overclaim --issue 718
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-718/closeout.md
- docs/verification/issues/issue-718/screenshot-index.json
- docs/verification/issues/issue-718/test-output/check-simulation-copy-overclaim.txt

## Known Limitations
- The Simulation route still exists as a gated workflow step, but floorplan-only normal flow no longer navigates there.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
