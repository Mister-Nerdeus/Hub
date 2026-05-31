# Issue 752 Closeout

## Problem
Active Floorplan Hub Layout Balance

## Code Review
- The hub had duplicated preview/title treatment and weak layout constraints; the repair keeps the preview as the hub visual and the card as metadata/actions.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/ActiveFloorplanHub.tsx
- apps/web/src/features/floorplans/ActiveFloorplanCard.tsx
- apps/web/src/styles.css
- scripts/check-active-floorplan-hub-layout-balance.mjs
- docs/verification/issues/issue-752/

## Commands Run
- node scripts/check-active-floorplan-hub-layout-balance.mjs --stage no-giant-empty-card --issue 752
- node scripts/check-active-floorplan-hub-layout-balance.mjs --stage preview-balanced --issue 752
- node scripts/check-active-floorplan-hub-layout-balance.mjs --stage actions-clear --issue 752

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-752/test-output/check-active-floorplan-hub-layout-balance.txt

## Known Limitations
- Screenshot proof for visual balance is captured by Issue 757.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.

## Next Recommended Issue
- Issue 764 is the repair GO/NO-GO; after it passes, durable assignment foundation may start in the next milestone without adding scoring, simulation, optimizer, reports, or clinical claims.

