# Issue 725 Closeout

## Problem
Editor Normal Toolbar Extraction

## Code Review
- The editor exposed broad command and detailed tool rows in normal mode; a dedicated normal toolbar now carries only save, done, explicit add actions, and an Advanced disclosure.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/EditorNormalToolbar.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- scripts/check-editor-normal-toolbar-ux.mjs
- docs/verification/issues/issue-725/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-editor-normal-toolbar-ux.mjs --stage normal-toolbar --allow-partial --issue 725
- node scripts/check-editor-normal-toolbar-ux.mjs --stage explicit-add-actions --allow-partial --issue 725
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-725/closeout.md
- docs/verification/issues/issue-725/screenshot-index.json
- docs/verification/issues/issue-725/test-output/check-editor-normal-toolbar-ux.txt

## Known Limitations
- The detailed controls remain available through Advanced; later issues further split undo/redo, canvas controls, and technical status into dedicated advanced surfaces.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
