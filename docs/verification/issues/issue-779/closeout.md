# Issue 779 Closeout

## Problem
Hallway Inspector and Controls

## Code Review
- Hallways could be selected, but normal inspector controls did not expose hallway label and dimensions as editable first-class geometry controls.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/HallwayInspectorPanel.tsx
- apps/web/src/features/layout-editor/layoutInspectorViewModel.ts
- apps/web/src/features/layout-editor/layoutInspectorViewModel.test.ts
- apps/web/src/features/layout-editor/roomInspectorDimensionEdit.ts
- apps/web/src/features/layout-editor/layoutEditorReducer.ts
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- scripts/check-hallway-inspector-controls.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-779/

## Commands Run
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-hallway-inspector-controls.mjs --stage normal-controls --issue 779
- node scripts/check-hallway-inspector-controls.mjs --stage advanced-ids-hidden --issue 779
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-779/normal-controls-output.json
- docs/verification/issues/issue-779/advanced-ids-hidden-output.json
- docs/verification/issues/issue-779/manifest-update-output.json

## Known Limitations
- This issue adds hallway label and footprint controls; wall and support-area inspectors are handled by later geometry issues.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
