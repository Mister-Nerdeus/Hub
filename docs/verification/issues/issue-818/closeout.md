# Issue 818 Closeout

## Problem
Remove Legacy Split-Bay Action from Normal Editor Flow

## Code Review
- Normal Add Split Room now dispatches single-room split-room conversion and no longer imports or renders legacy split-bay quick-edit flow.

## Files Changed
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/layoutEditorReducer.ts
- docs/verification/issues/issue-818/

## Commands Run
- node scripts/check-legacy-split-bay-normal-flow.mjs --stage normal-flow-clean --issue 818
- node scripts/check-legacy-split-bay-normal-flow.mjs --stage legacy-only-if-marked --issue 818
- node scripts/check-legacy-split-bay-normal-flow.mjs --stage no-pair-split-dispatch-normal --issue 818

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-818/test-output/check-legacy-split-bay-normal-flow.txt
- docs/verification/issues/issue-818/manifest-update-output.json

## Known Limitations
- Legacy split-bay reducer support remains only for compatibility with older data.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
