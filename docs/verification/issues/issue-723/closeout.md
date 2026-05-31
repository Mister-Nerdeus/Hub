# Issue 723 Closeout

## Problem
Editor Canvas Expansion

## Code Review
- The editor canvas was sharing space evenly with the side inspector; the workspace now gives the canvas the dominant grid share and a viewport-based height floor.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- scripts/check-editor-canvas-expansion.mjs
- docs/verification/issues/issue-723/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-editor-canvas-expansion.mjs --stage canvas-primary --allow-partial --issue 723
- node scripts/check-editor-canvas-expansion.mjs --stage canvas-width-expanded --allow-partial --issue 723
- node scripts/check-editor-canvas-expansion.mjs --stage canvas-height-expanded --allow-partial --issue 723
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-723/closeout.md
- docs/verification/issues/issue-723/screenshot-index.json
- docs/verification/issues/issue-723/test-output/check-editor-canvas-expansion.txt

## Known Limitations
- The right inspector still exists until the later dedicated removal issue.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
