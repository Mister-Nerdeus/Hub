# Issue 720 Closeout

## Problem
Readiness Truth Logic

## Code Review
- The split-room readiness item used a condition that was always true; it now reports no split rooms, valid split rooms, and invalid split rooms distinctly.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/floorplanReadinessViewModel.ts
- scripts/check-floorplan-readiness-truth.mjs
- docs/verification/issues/issue-720/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-floorplan-readiness-truth.mjs --stage no-split-room-readiness --allow-partial --issue 720
- node scripts/check-floorplan-readiness-truth.mjs --stage invalid-split-room-readiness --allow-partial --issue 720
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-720/closeout.md
- docs/verification/issues/issue-720/test-output/check-floorplan-readiness-truth.txt

## Known Limitations
- The readiness check validates split-bay geometry and linked room references; it does not add new split-room authoring behavior.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
