# Issue 761 Closeout

## Problem
Editor Details Tab Simplification

## Code Review
- Large secondary tabs made the bottom panel feel like a second app; the repair shows selected-object details first and collapses secondary panels under More details.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/LayoutInspectorTabs.tsx
- apps/web/src/features/layout-editor/EditorDetailsPanel.tsx
- scripts/check-editor-details-tab-simplification.mjs
- docs/verification/issues/issue-761/

## Commands Run
- node scripts/check-editor-details-tab-simplification.mjs --stage selected-object-first --issue 761
- node scripts/check-editor-details-tab-simplification.mjs --stage secondary-tabs-collapsed --issue 761

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-761/test-output/check-editor-details-tab-simplification.txt

## Known Limitations
- The same underlying room, door, assignment, and validation capabilities remain available under More details.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.

## Next Recommended Issue
- Issue 764 is the repair GO/NO-GO; after it passes, durable assignment foundation may start in the next milestone without adding scoring, simulation, optimizer, reports, or clinical claims.

