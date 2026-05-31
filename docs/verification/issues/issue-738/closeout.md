# Issue 738 Closeout

## Problem
Compact Validation Row

## Code Review
- Validation details could become another large editor card; the workspace now uses a compact summary row with detailed validation collapsed by default.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- apps/web/src/features/layout-editor/ValidationDrawer.tsx
- scripts/check-editor-compact-validation-row.mjs
- docs/verification/issues/issue-738/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-editor-compact-validation-row.mjs --stage compact-validation-row --allow-partial --issue 738
- node scripts/check-editor-compact-validation-row.mjs --stage validation-details-collapsed --allow-partial --issue 738
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-738/closeout.md
- docs/verification/issues/issue-738/screenshot-index.json
- docs/verification/issues/issue-738/test-output/check-editor-compact-validation-row.txt

## Known Limitations
- Validation detail content remains unchanged and is intentionally available through the drawer disclosure.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
