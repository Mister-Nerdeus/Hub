# Issue 825 Closeout

## Problem
Replace Split-Bay Quick Edit with Split-Room Inspector in Normal Flow

## Code Review
- Normal split-room editing uses SplitRoomInspectorPanel and no longer exposes legacy split-bay quick edit in the stage.

## Files Changed
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx
- docs/verification/issues/issue-825/

## Commands Run
- node scripts/check-split-room-inspector-normal-flow.mjs --stage no-split-bay-quick-edit-normal --issue 825
- node scripts/check-split-room-inspector-normal-flow.mjs --stage split-room-inspector-used --issue 825
- node scripts/check-split-room-inspector-normal-flow.mjs --stage bed-position-details --issue 825

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-825/test-output/check-split-room-inspector-normal-flow.txt
- docs/verification/issues/issue-825/screenshot-index.json

## Known Limitations
- Screenshot index is populated by issue 829 hard browser proof.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
