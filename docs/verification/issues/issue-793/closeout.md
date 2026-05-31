# Issue 793 Closeout

## Problem
Split Divider Controls

## Code Review
- Split rooms needed explicit divider orientation and ratio controls that update bed relative bounds.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx
- apps/web/src/features/layout-editor/splitRoomActions.ts
- scripts/check-split-divider-controls.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-793/

## Commands Run
- node scripts/check-split-divider-controls.mjs --stage orientation-controls --issue 793
- node scripts/check-split-divider-controls.mjs --stage ratio-controls --issue 793
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-793/orientation-controls-output.json
- docs/verification/issues/issue-793/ratio-controls-output.json
- docs/verification/issues/issue-793/screenshot-index.json
- docs/verification/issues/issue-793/manifest-update-output.json

## Known Limitations
- Controls are wired as inspector callbacks for the parent-bed model; persisted split-room storage is addressed by later compatibility issues.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
