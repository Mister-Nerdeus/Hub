# Issue 733 Closeout

## Problem
Technical Inspector Fields Advanced-Only

## Code Review
- The normal details panel still showed object IDs and source units; those technical fields now live under Advanced details.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx
- apps/web/src/features/layout-editor/EditorDetailsPanel.tsx
- apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-technical-inspector-fields-advanced.mjs
- docs/verification/issues/issue-733/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-technical-inspector-fields-advanced.mjs --stage technical-fields-hidden-normal --allow-partial --issue 733
- node scripts/check-technical-inspector-fields-advanced.mjs --stage technical-fields-advanced --allow-partial --issue 733
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-733/closeout.md
- docs/verification/issues/issue-733/screenshot-index.json
- docs/verification/issues/issue-733/test-output/check-technical-inspector-fields-advanced.txt

## Known Limitations
- Advanced details intentionally retain object IDs and raw status for troubleshooting.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
