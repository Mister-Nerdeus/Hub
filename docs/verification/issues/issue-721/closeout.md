# Issue 721 Closeout

## Problem
Active Floorplan Persistence Resilience

## Code Review
- Persisted active-floorplan selection parsed untrusted localStorage directly; corrupted JSON and invalid schema now return null so startup uses the safe fallback floorplan state.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/activeFloorplanPersistence.ts
- scripts/check-active-floorplan-persistence-resilience.mjs
- docs/verification/issues/issue-721/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-active-floorplan-persistence-resilience.mjs --stage corrupted-localstorage --allow-partial --issue 721
- node scripts/check-active-floorplan-persistence-resilience.mjs --stage fallback-floorplan --allow-partial --issue 721
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-721/closeout.md
- docs/verification/issues/issue-721/test-output/check-active-floorplan-persistence-resilience.txt

## Known Limitations
- Invalid persisted selections are ignored; this issue does not add a user-facing recovery banner.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
