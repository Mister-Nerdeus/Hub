# Issue 863 Closeout

## Problem
Assignment Target Contract and Resolver

## Code Review
- Resolved targets use deterministic IDs and preserve split-room bed positions as targets rather than rooms.

## Files Changed
- packages/shared/src/assignments/assignmentTargetContract.ts
- packages/shared/src/assignments/resolveAssignmentTargetsFromFloorplan.ts
- packages/shared/src/assignments/assignmentTargetValidation.ts
- packages/shared/src/floorplans/floorplanGeometryContract.ts
- scripts/check-assignment-target-contract.mjs
- docs/verification/issues/issue-863

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-assignment-target-contract.mjs --stage final --issue 863
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-863/assignment-target-contract-output.json
- docs/verification/issues/issue-863/assignment-target-fixture.json
- docs/verification/issues/issue-863/split-bed-target-proof.json

## Known Limitations
- Support-area targets require explicit modeled support geometry; canonical proof uses rooms, split beds, and assignable support zone geometry.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only assignment foundation task.
