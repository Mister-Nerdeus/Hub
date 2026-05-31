# Issue 728 Closeout

## Problem
Compact Canvas Controls

## Code Review
- Viewport controls were only available as a bulky toolbar surface; normal mode now has a compact floating canvas-local control cluster.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/CanvasViewportControls.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- scripts/check-compact-canvas-controls.mjs
- docs/verification/issues/issue-728/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-compact-canvas-controls.mjs --stage compact-controls --allow-partial --issue 728
- node scripts/check-compact-canvas-controls.mjs --stage controls-do-not-crowd-toolbar --allow-partial --issue 728
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-728/closeout.md
- docs/verification/issues/issue-728/screenshot-index.json
- docs/verification/issues/issue-728/test-output/check-compact-canvas-controls.txt

## Known Limitations
- The compact control labels are intentionally terse and backed by accessible labels and titles.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
