# Issue 773 Closeout

## Problem
Locked Reference Styling

## Code Review
- Locked reference visuals were rendered with geometry-like styling and inline metadata, which made them too easy to confuse with editable floorplan objects.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/ReferenceOverlayRenderer.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- scripts/check-locked-reference-styling.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-773/

## Commands Run
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-locked-reference-styling.mjs --stage faded-style --issue 773
- node scripts/check-locked-reference-styling.mjs --stage no-edit-handles --issue 773
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-773/faded-style-output.json
- docs/verification/issues/issue-773/no-edit-handles-output.json
- docs/verification/issues/issue-773/manifest-update-output.json

## Known Limitations
- This issue styles the current reference overlay path; later artifact quarantine issues classify additional unknown visuals.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
