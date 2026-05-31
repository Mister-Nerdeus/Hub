# Issue 730 Closeout

## Problem
Remove Permanent Right Inspector

## Code Review
- The editor initialized with a permanent right inspector column; normal mode now starts with the inspector collapsed so the canvas receives the full workspace width.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-right-inspector-removed-normal.mjs
- docs/verification/issues/issue-730/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-right-inspector-removed-normal.mjs --stage right-inspector-removed-normal --allow-partial --issue 730
- node scripts/check-right-inspector-removed-normal.mjs --stage editor-canvas-width-expanded --allow-partial --issue 730
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-730/closeout.md
- docs/verification/issues/issue-730/screenshot-index.json
- docs/verification/issues/issue-730/test-output/check-right-inspector-removed-normal.txt

## Known Limitations
- The existing inspector is still available through Advanced until the bottom details panel issue moves it below the canvas.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
