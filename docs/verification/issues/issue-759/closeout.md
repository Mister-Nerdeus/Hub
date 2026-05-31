# Issue 759 Closeout

## Problem
Split Normal vs Advanced Inspector Sections

## Code Review
- A single section set made technical fields easy to leak into normal mode; the repair splits normal and advanced sections in the view model.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/layoutInspectorViewModel.ts
- apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx
- apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx
- scripts/check-inspector-normal-advanced-section-split.mjs
- docs/verification/issues/issue-759/

## Commands Run
- node scripts/check-inspector-normal-advanced-section-split.mjs --stage normal-advanced-model --issue 759
- node scripts/check-inspector-normal-advanced-section-split.mjs --stage advanced-consumes-technical --issue 759

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-759/test-output/check-inspector-normal-advanced-section-split.txt

## Known Limitations
- The legacy sections alias remains mapped to normalSections for existing tests.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.

## Next Recommended Issue
- Issue 764 is the repair GO/NO-GO; after it passes, durable assignment foundation may start in the next milestone without adding scoring, simulation, optimizer, reports, or clinical claims.

