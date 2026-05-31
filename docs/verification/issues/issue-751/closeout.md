# Issue 751 Closeout

## Problem
Active Floorplan Card Layout Repair

## Code Review
- The card allowed actions and thumbnail space to collapse the active floorplan title; the repair removes the card thumbnail column and keeps actions outside the metadata flow.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/ActiveFloorplanCard.tsx
- apps/web/src/styles.css
- scripts/check-active-floorplan-card-repair.mjs
- docs/verification/issues/issue-751/

## Commands Run
- node scripts/check-active-floorplan-card-repair.mjs --stage long-name-readable --issue 751
- node scripts/check-active-floorplan-card-repair.mjs --stage actions-do-not-squeeze-title --issue 751
- node scripts/check-active-floorplan-card-repair.mjs --stage narrow-width-stack --issue 751

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-751/test-output/check-active-floorplan-card-repair.txt

## Known Limitations
- Screenshot proof for the repaired hub layout is captured by Issue 757.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.

## Next Recommended Issue
- Issue 764 is the repair GO/NO-GO; after it passes, durable assignment foundation may start in the next milestone without adding scoring, simulation, optimizer, reports, or clinical claims.

