# Issue 714 Closeout

## Problem
Active Floorplan Hub Shell

## Code Review
- The floorplan screen had separate selector, readiness, and advanced sections; it now routes through one hub component while preserving existing floorplan handlers.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/ActiveFloorplanHub.tsx
- apps/web/src/App.tsx
- apps/web/src/styles.css
- apps/web/src/App.test.ts
- apps/web/src/features/demo/__tests__/Plan1DemoGuideDemotion.test.tsx
- apps/web/src/features/floorplans/__tests__/postUnlockCanonicalWorkflow.test.tsx
- scripts/check-active-floorplan-hub.mjs
- docs/verification/issues/issue-714/

## Commands Run
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-active-floorplan-hub.mjs --stage hub-contract --allow-partial --issue 714
- node scripts/check-active-floorplan-hub.mjs --stage hub-composition --allow-partial --issue 714
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-714/closeout.md
- docs/verification/issues/issue-714/screenshot-index.json
- docs/verification/issues/issue-714/test-output/check-active-floorplan-hub.txt

## Known Limitations
- Thumbnail and next-step details are hub slots in this issue; richer extracted components follow in later A3 issues.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
