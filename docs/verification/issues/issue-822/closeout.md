# Issue 822 Closeout

## Problem
Add Split Room Parent and Bed Position Selection to Editor State

## Code Review
- Selection model now treats split_room_parent and bed_position as real selectable objects with independent parent/bed selection behavior.

## Files Changed
- apps/web/src/features/layout-editor/layoutSelectionModel.ts
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/BedPositionShape.tsx
- apps/web/src/features/layout-editor/SplitRoomShape.tsx
- docs/verification/issues/issue-822/

## Commands Run
- node scripts/check-split-bed-selection-state.mjs --stage selection-types --issue 822
- node scripts/check-split-bed-selection-state.mjs --stage bed-position-selectable --issue 822
- node scripts/check-split-bed-selection-state.mjs --stage parent-separate-selection --issue 822
- node scripts/check-split-bed-selection-state.mjs --stage bed-does-not-resize-parent --issue 822

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-822/test-output/check-split-bed-selection-state.txt
- docs/verification/issues/issue-822/screenshot-index.json

## Known Limitations
- Screenshot index is populated by issue 829 hard browser proof.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
