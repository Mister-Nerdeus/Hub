# Issue 788 Closeout

## Problem
Convert Room to Split Room

## Code Review
- Legacy split-room authoring was pair-oriented; this issue adds a single parent-room conversion path with derived bed positions.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/splitRoomActions.ts
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-convert-room-to-split-room.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-788/

## Commands Run
- node scripts/check-convert-room-to-split-room.mjs --stage single-room-conversion --issue 788
- node scripts/check-convert-room-to-split-room.mjs --stage no-room-merge-required --issue 788
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-788/single-room-conversion-output.json
- docs/verification/issues/issue-788/no-room-merge-required-output.json
- docs/verification/issues/issue-788/manifest-update-output.json

## Known Limitations
- This issue adds the single-room conversion action; split-room visual rendering and independent bed selection are handled by following issues.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
