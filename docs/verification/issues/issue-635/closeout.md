# Issue 635 Closeout

## Summary
Room move persistence survives real editor edit, undo/redo, named-copy save, browser reload, same-copy reopen, and export.

## Files Changed
- See git diff for source, checker, manifest, Docker/local verification wiring, and evidence updates.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-layout-editor-room-move-persistence.mjs --stage immediate-edit --allow-partial --issue 635
- node scripts/check-layout-editor-room-move-persistence.mjs --stage save-reload --allow-partial --issue 635
- node scripts/check-layout-editor-room-move-persistence.mjs --stage export-after-reload --allow-partial --issue 635
- node scripts/check-layout-editor-room-move-persistence.mjs --stage default-not-mutated --allow-partial --issue 635
- node scripts/check-layout-editor-room-move-persistence.mjs --stage stale-room-negative --allow-partial --issue 635
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-635
- docs/verification/floorplan-editor-save-reload-truth-loop-manifest.json

## Known Limitations
- This issue proves room movement only; door persistence is handled by Issue 636.
- The UI still contains legacy save-state wording that is intentionally corrected in Issue 638.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction was added.

## GO / NO-GO
- GO for the next scoped save/reload truth-loop issue.
