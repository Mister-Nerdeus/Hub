# Issue 758 Closeout

## Problem
Editor Bottom Details Copy Repair

## Code Review
- Normal selected-object details leaked implementation labels; the repair uses operational labels and moves IDs/raw state to Advanced.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/layoutInspectorViewModel.ts
- apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx
- apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx
- scripts/check-editor-bottom-details-copy-repair.mjs
- docs/verification/issues/issue-758/

## Commands Run
- node scripts/check-editor-bottom-details-copy-repair.mjs --stage normal-copy-operational --issue 758
- node scripts/check-editor-bottom-details-copy-repair.mjs --stage no-technical-normal-fields --issue 758

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-758/test-output/check-editor-bottom-details-copy-repair.txt

## Known Limitations
- Screenshot proof for normal editor copy is captured by Issue 763.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.

## Next Recommended Issue
- Issue 764 is the repair GO/NO-GO; after it passes, durable assignment foundation may start in the next milestone without adding scoring, simulation, optimizer, reports, or clinical claims.

