# Issue 823 Closeout

## Problem
Wire Split Room Parent Move and Resize Behavior

## Code Review
- Split-room parent drag and resize dispatch dedicated reducer actions that mutate the parent footprint while preserving bed relative bounds.

## Files Changed
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/layoutEditorReducer.ts
- apps/web/src/features/layout-editor/roomResizeHandlesViewModel.ts
- docs/verification/issues/issue-823/

## Commands Run
- node scripts/check-split-parent-move-resize-wiring.mjs --stage parent-move --issue 823
- node scripts/check-split-parent-move-resize-wiring.mjs --stage parent-resize --issue 823
- node scripts/check-split-parent-move-resize-wiring.mjs --stage beds-relative-after-resize --issue 823
- node scripts/check-split-parent-move-resize-wiring.mjs --stage no-fake-child-room-resize --issue 823

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-823/test-output/check-split-parent-move-resize-wiring.txt
- docs/verification/issues/issue-823/screenshot-index.json

## Known Limitations
- Screenshot index is populated by issue 829 hard browser proof.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
