# Issue 729 Closeout

## Problem
Move Technical Editor Status to Advanced

## Code Review
- Normal editor mode still exposed record, plan, recovery, reload, validation, and JSON status surfaces; those are now contained in Advanced.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/EditorAdvancedStatusPanel.tsx
- apps/web/src/features/layout-editor/EditorCommandBar.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-editor-technical-status-advanced.mjs
- docs/verification/issues/issue-729/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-editor-technical-status-advanced.mjs --stage technical-status-hidden-normal --allow-partial --issue 729
- node scripts/check-editor-technical-status-advanced.mjs --stage technical-status-advanced --allow-partial --issue 729
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-729/closeout.md
- docs/verification/issues/issue-729/screenshot-index.json
- docs/verification/issues/issue-729/test-output/check-editor-technical-status-advanced.txt

## Known Limitations
- The advanced disclosure still contains the existing technical fields so support/debug workflows remain reachable.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
