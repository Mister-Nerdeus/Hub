# Issue 868 Closeout

## Problem
Assignment Overlay

## Code Review
- Overlay badges render manual assignment labels for room and split-bed targets without evaluative copy.

## Files Changed
- apps/web/src/features/manual-assignment/AssignmentOverlay.tsx
- apps/web/src/features/manual-assignment/AssignmentBadge.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/manual-assignment/ManualAssignmentFoundation.css
- scripts/check-manual-assignment-overlay.mjs
- docs/verification/issues/issue-868

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-manual-assignment-overlay.mjs --stage final --issue 868
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-868/manual-assignment-overlay-output.json
- docs/verification/issues/issue-868/screenshot-index.json
- docs/verification/issues/issue-868/screenshots/manual-assignment-overlay.png

## Known Limitations
- Static overlay proof is paired with browser proof in Issue 870.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only assignment foundation task.
