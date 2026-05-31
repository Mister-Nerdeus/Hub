# Issue 732 Closeout

## Problem
Bottom Details Normal Sections

## Code Review
- Room details were grouped as generic metadata; the bottom panel now uses normal workflow sections for identity, type and capacity, operational capabilities, and geometry.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/inspectorViewModel.ts
- apps/web/src/features/layout-editor/layoutInspectorViewModel.ts
- scripts/check-editor-details-normal-sections.mjs
- docs/verification/issues/issue-732/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-editor-details-normal-sections.mjs --stage normal-sections --allow-partial --issue 732
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-732/closeout.md
- docs/verification/issues/issue-732/screenshot-index.json
- docs/verification/issues/issue-732/test-output/check-editor-details-normal-sections.txt

## Known Limitations
- Door, station, hallway, and zone details continue to use their existing specialized sections.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
