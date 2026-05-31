# Issue 791 Closeout

## Problem
Split Room Parent Move Behavior

## Code Review
- Split-room movement should update the physical parent footprint while preserving child bed relative bounds.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/splitRoomActions.ts
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-split-room-parent-move.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-791/

## Commands Run
- node scripts/check-split-room-parent-move.mjs --stage parent-move --issue 791
- node scripts/check-split-room-parent-move.mjs --stage beds-move-with-parent --issue 791
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-791/parent-move-output.json
- docs/verification/issues/issue-791/beds-move-with-parent-output.json
- docs/verification/issues/issue-791/screenshot-index.json
- docs/verification/issues/issue-791/manifest-update-output.json

## Known Limitations
- This issue defines the movement action semantics; drag-handle integration remains governed by the existing parent room movement flow.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
