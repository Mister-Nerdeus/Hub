# Issue 784 Closeout

## Problem
Geometry Hit Testing

## Code Review
- Hit-test semantics needed a central contract covering editable geometry, locked wall geometry, and non-interactive reference overlays.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/layoutHitTesting.ts
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-geometry-hit-testing.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-784/

## Commands Run
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-geometry-hit-testing.mjs --stage all-editable-kinds --issue 784
- node scripts/check-geometry-hit-testing.mjs --stage reference-does-not-steal-hit --issue 784
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-784/all-editable-kinds-output.json
- docs/verification/issues/issue-784/reference-does-not-steal-hit-output.json
- docs/verification/issues/issue-784/manifest-update-output.json

## Known Limitations
- This issue defines the hit-testing contract; split-bed hit tests are expanded in the split-room selection issues.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
