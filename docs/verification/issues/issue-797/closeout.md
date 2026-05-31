# Issue 797 Closeout

## Problem
Split Room Unsplit / Revert Action

## Code Review
- Unsplit needed an explicit parent-bed-model action that removes bed positions while preserving the parent room footprint.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/splitRoomActions.ts
- apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx
- scripts/check-split-room-unsplit-action.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-797/

## Commands Run
- node scripts/check-split-room-unsplit-action.mjs --stage unsplit-action --issue 797
- node scripts/check-split-room-unsplit-action.mjs --stage parent-footprint-preserved --issue 797
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-797/unsplit-action-output.json
- docs/verification/issues/issue-797/parent-footprint-preserved-output.json
- docs/verification/issues/issue-797/screenshot-index.json
- docs/verification/issues/issue-797/manifest-update-output.json

## Known Limitations
- This issue defines the parent-bed-model revert semantics; durable assignment persistence is still out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
