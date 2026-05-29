# Issue 636 Closeout

## Summary
Door move, offset, width, add, and delete changes survive named-copy save, browser reload, same-copy reopen, and export.

## Files Changed
- See git diff for source, checker, manifest, Docker/local verification wiring, and evidence updates.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-layout-editor-door-change-persistence.mjs --stage door-move-save-reload --allow-partial --issue 636
- node scripts/check-layout-editor-door-change-persistence.mjs --stage door-width-save-reload --allow-partial --issue 636
- node scripts/check-layout-editor-door-change-persistence.mjs --stage door-add-save-reload --allow-partial --issue 636
- node scripts/check-layout-editor-door-change-persistence.mjs --stage door-delete-save-reload --allow-partial --issue 636
- node scripts/check-layout-editor-door-change-persistence.mjs --stage export-after-reload --allow-partial --issue 636
- node scripts/check-layout-editor-door-change-persistence.mjs --stage lost-door-negative --allow-partial --issue 636
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-636
- docs/verification/floorplan-editor-save-reload-truth-loop-manifest.json

## Known Limitations
- This issue proves door geometry persistence only; local draft separation and truthful save-status wording are handled later.
- Path graph sync can remain stale; the proof requires door geometry and count semantics to persist.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction was added.

## GO / NO-GO
- GO for the next scoped save/reload truth-loop issue.
