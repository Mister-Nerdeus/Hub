# Issue 754 Closeout

## Problem
Remove Floorplan-Only Simulation Readiness

## Code Review
- Floorplan readiness could claim simulation readiness from a floorplan-only state; the repair limits the contract to assignment readiness and blocks later readiness until later contracts exist.

## Summary
- Local validator status: passed.

## Files Changed
- packages/shared/src/floorplans/floorplanReadinessContract.ts
- apps/web/src/features/floorplans/floorplanReadinessViewModel.ts
- apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx
- scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs
- docs/verification/issues/issue-754/

## Commands Run
- node scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs --stage no-active-for-simulation-item --issue 754
- node scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs --stage no-floorplan-only-ready-for-simulation --issue 754
- node scripts/check-milestone-a-no-overclaim.mjs --stage no-simulation-overclaim --issue 754

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-754/test-output/check-floorplan-simulation-readiness-overclaim-repair.txt

## Known Limitations
- Scenario and simulation readiness remain intentionally blocked for later milestones.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.

## Next Recommended Issue
- Issue 764 is the repair GO/NO-GO; after it passes, durable assignment foundation may start in the next milestone without adding scoring, simulation, optimizer, reports, or clinical claims.

