# Issue 727 Closeout

## Problem
Move Legacy Tool Strip to Advanced

## Code Review
- Legacy editor mode, palette, viewport, popup, and proof-oriented controls were crowding the normal row; they now live in the advanced controls block.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-editor-detailed-tools-advanced.mjs
- docs/verification/issues/issue-727/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-editor-detailed-tools-advanced.mjs --stage detailed-toolbar-advanced --allow-partial --issue 727
- node scripts/check-editor-detailed-tools-advanced.mjs --stage normal-mode-hidden --allow-partial --issue 727
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-727/closeout.md
- docs/verification/issues/issue-727/screenshot-index.json
- docs/verification/issues/issue-727/test-output/check-editor-detailed-tools-advanced.txt

## Known Limitations
- The compact canvas-control issue follows with a separate normal-mode viewport affordance.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
