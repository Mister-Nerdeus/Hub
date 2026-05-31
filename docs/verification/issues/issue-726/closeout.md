# Issue 726 Closeout

## Problem
Move Undo/Redo to Advanced

## Code Review
- Undo and redo were part of the prominent editor command surface; they are now explicitly marked as advanced and absent from the normal toolbar.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/EditorAdvancedToolsPanel.tsx
- apps/web/src/features/layout-editor/EditorCommandBar.tsx
- scripts/check-editor-undo-redo-advanced.mjs
- docs/verification/issues/issue-726/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-editor-undo-redo-advanced.mjs --stage undo-redo-hidden-normal --allow-partial --issue 726
- node scripts/check-editor-undo-redo-advanced.mjs --stage undo-redo-advanced --allow-partial --issue 726
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-726/closeout.md
- docs/verification/issues/issue-726/screenshot-index.json
- docs/verification/issues/issue-726/test-output/check-editor-undo-redo-advanced.txt

## Known Limitations
- Undo/redo remain intentionally available through Advanced and continue to use the existing editor history reducer.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
