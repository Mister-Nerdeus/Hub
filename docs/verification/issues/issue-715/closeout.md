# Issue 715 Closeout

## Problem
Active Floorplan Card Layout

## Code Review
- The selector card mixed metadata and actions in a two-column layout that could collide; the new card gives thumbnail, metadata, and wrapped actions stable layout areas.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/ActiveFloorplanCard.tsx
- apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx
- apps/web/src/styles.css
- scripts/check-active-floorplan-card-layout.mjs
- docs/verification/issues/issue-715/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-active-floorplan-card-layout.mjs --stage normal-width --allow-partial --issue 715
- node scripts/check-active-floorplan-card-layout.mjs --stage narrow-width --allow-partial --issue 715
- node scripts/check-active-floorplan-card-layout.mjs --stage no-title-collision --allow-partial --issue 715
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-715/closeout.md
- docs/verification/issues/issue-715/screenshot-index.json
- docs/verification/issues/issue-715/test-output/check-active-floorplan-card-layout.txt

## Known Limitations
- This issue adds the card layout shell; the richer thumbnail rendering is implemented in the following floorplan thumbnail issue.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
