# Issue 753 Closeout

## Problem
Floorplan Advanced Panel Open Behavior

## Code Review
- The Advanced button only scrolled to a collapsed region; the repair makes the details element controlled and moves focus after opening.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/ActiveFloorplanHub.tsx
- apps/web/src/features/floorplans/ActiveFloorplanCard.tsx
- scripts/check-floorplan-advanced-open-behavior.mjs
- docs/verification/issues/issue-753/

## Commands Run
- node scripts/check-floorplan-advanced-open-behavior.mjs --stage button-opens-panel --issue 753
- node scripts/check-floorplan-advanced-open-behavior.mjs --stage focus-accessible --issue 753

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-753/test-output/check-floorplan-advanced-open-behavior.txt

## Known Limitations
- The behavior is local UI state only; no durable assignment work is introduced.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.

## Next Recommended Issue
- Issue 764 is the repair GO/NO-GO; after it passes, durable assignment foundation may start in the next milestone without adding scoring, simulation, optimizer, reports, or clinical claims.

