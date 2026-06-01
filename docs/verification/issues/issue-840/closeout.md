# Issue 840 Closeout

## Problem
Boundary / Door Destination Save-Reload Proof

## Code Review
- Editable layout export/import paths now preserve perimeter walls, entry/exit points, and door destination labels.

## Files Changed
- apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts
- apps/web/src/features/floorplans/floorplanJsonImportExport.ts
- apps/web/src/features/layout-editor/layoutEditorState.ts
- docs/verification/issues/issue-840/

## Commands Run
- node scripts/check-boundary-door-destination-save-reload.mjs --stage final --issue 840

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-840/boundary-door-destination-save-reload-output.json
- docs/verification/issues/issue-840/boundary-door-destination-before.json
- docs/verification/issues/issue-840/boundary-door-destination-after.json

## Known Limitations
- Browser save/reload behavior is proven in issue 841.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, or assignment recommendations were added.
