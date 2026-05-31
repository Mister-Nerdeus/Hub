# Issue 787 Closeout

## Problem
Split Room Parent / Bed Position Contract

## Code Review
- Split rooms needed a parent-room contract with two assignable bed positions instead of merge-like child-room geometry.

## Summary
- Local validator status: passed.

## Files Changed
- packages/shared/src/floorplans/splitRoomContract.ts
- packages/shared/src/floorplans/floorplanGeometryContract.ts
- packages/shared/src/index.ts
- scripts/check-split-room-parent-bed-contract.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-787/

## Commands Run
- npm --workspace packages/shared test
- node scripts/check-split-room-parent-bed-contract.mjs --stage contract --issue 787
- node scripts/check-split-room-parent-bed-contract.mjs --stage bed-position-targets --issue 787
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-787/contract-output.json
- docs/verification/issues/issue-787/bed-position-targets-output.json
- docs/verification/issues/issue-787/manifest-update-output.json

## Known Limitations
- This issue defines the shared contract; editor conversion and rendering are handled by following split-room issues.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
