# Issue 790 Closeout

## Problem
Split Bed Position Selection

## Code Review
- Bed-position shapes needed their own selectable hit targets and event handling so child selection does not collapse into parent selection.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/BedPositionShape.tsx
- apps/web/src/features/layout-editor/SplitRoomShape.tsx
- apps/web/src/features/layout-editor/layoutHitTesting.ts
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-split-bed-position-selection.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-790/

## Commands Run
- node scripts/check-split-bed-position-selection.mjs --stage bed-a-selectable --issue 790
- node scripts/check-split-bed-position-selection.mjs --stage bed-b-selectable --issue 790
- node scripts/check-split-bed-position-selection.mjs --stage parent-separate-selection --issue 790
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-790/bed-a-selectable-output.json
- docs/verification/issues/issue-790/bed-b-selectable-output.json
- docs/verification/issues/issue-790/parent-separate-selection-output.json
- docs/verification/issues/issue-790/screenshot-index.json
- docs/verification/issues/issue-790/manifest-update-output.json

## Known Limitations
- This issue establishes component and hit-test selection contracts; full inspector behavior for selected bed positions follows in later split-room issues.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
