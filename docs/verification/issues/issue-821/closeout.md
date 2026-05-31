# Issue 821 Closeout

## Problem
Replace SplitBay Render Path with SplitRoom Render Path

## Code Review
- The main editor render path now renders SplitRoomShape and nested BedPositionShape instead of SplitBayShape.

## Files Changed
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/SplitRoomShape.tsx
- apps/web/src/features/layout-editor/BedPositionShape.tsx
- docs/verification/issues/issue-821/

## Commands Run
- node scripts/check-split-room-render-path.mjs --stage split-room-shape-used --issue 821
- node scripts/check-split-room-render-path.mjs --stage split-bay-shape-not-normal-path --issue 821
- node scripts/check-split-room-render-path.mjs --stage bed-position-shape-used --issue 821
- node scripts/check-split-room-render-path.mjs --stage data-object-types-correct --issue 821

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-821/test-output/check-split-room-render-path.txt
- docs/verification/issues/issue-821/screenshot-index.json

## Known Limitations
- Screenshot index is populated by issue 829 hard browser proof.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
