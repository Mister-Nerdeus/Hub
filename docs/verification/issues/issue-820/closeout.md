# Issue 820 Closeout

## Problem
Add Split Rooms to Editable Layout State Model

## Code Review
- Editable and plan contracts now carry splitRooms while keeping legacy splitBays compatibility-only.

## Files Changed
- packages/shared/src/layout-editor/editableLayoutGeometryContract.ts
- packages/shared/src/contracts.ts
- apps/web/src/features/layout-editor/layoutEditorState.ts
- apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts
- docs/verification/issues/issue-820/

## Commands Run
- node scripts/check-editable-layout-split-room-state.mjs --stage split-rooms-collection --issue 820
- node scripts/check-editable-layout-split-room-state.mjs --stage no-fake-child-rooms --issue 820
- node scripts/check-editable-layout-split-room-state.mjs --stage legacy-split-bays-compat-only --issue 820

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-820/test-output/check-editable-layout-split-room-state.txt
- docs/verification/issues/issue-820/manifest-update-output.json

## Known Limitations
- None beyond the issue scope.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
