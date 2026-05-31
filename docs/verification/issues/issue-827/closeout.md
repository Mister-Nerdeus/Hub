# Issue 827 Closeout

## Problem
Persist New Geometry Through Save/Reload

## Code Review
- Plan save/reload paths now preserve splitRooms alongside hallway, wall, support, and assignment-target geometry without converting new split rooms back to splitBays.

## Files Changed
- apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts
- apps/web/src/features/floorplans/floorplanJsonImportExport.ts
- apps/web/src/features/layout-editor/geometryPersistenceProof.ts
- docs/verification/issues/issue-827/

## Commands Run
- node scripts/check-hard-geometry-save-reload-proof.mjs --stage split-rooms --issue 827
- node scripts/check-hard-geometry-save-reload-proof.mjs --stage hallways-walls-support --issue 827
- node scripts/check-hard-geometry-save-reload-proof.mjs --stage stable-assignment-targets --issue 827
- node scripts/check-hard-geometry-save-reload-proof.mjs --stage no-legacy-fallback --issue 827

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-827/save-reload-proof-output.json
- docs/verification/issues/issue-827/test-output/check-hard-geometry-save-reload-proof.txt

## Known Limitations
- Issue 829 provides the browser save/reload interaction proof.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
