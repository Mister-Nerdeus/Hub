# Issue 628 Closeout

## Summary
Nurse stations are movable in edit mode with undo, scoped autosave eligibility, and save/reload persistence.

## Files Changed
- See git diff for source, checker, manifest, and evidence updates.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-layout-editor-station-move.mjs --stage move-station --allow-partial --issue 628
- node scripts/check-layout-editor-station-move.mjs --stage undo-redo --allow-partial --issue 628
- node scripts/check-layout-editor-station-move.mjs --stage autosave --allow-partial --issue 628
- node scripts/check-layout-editor-station-move.mjs --stage export-import --allow-partial --issue 628
- node scripts/check-layout-editor-station-move.mjs --stage save-reload --allow-partial --issue 628
- node scripts/check-layout-editor-station-move.mjs --stage read-only-negative --allow-partial --issue 628
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-628
- docs/verification/floorplan-editor-reconstruction-repair-manifest.json

## Known Limitations
- Station movement changes only operational station geometry.
- Station movement is blocked when the active floorplan is read-only.
- Station movement does not change room capacity or patient/task output counts.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction was added.

## GO / NO-GO
- GO for the next scoped editor reconstruction repair issue.
