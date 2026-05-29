# Issue 632 Closeout

## Summary
Red/green browser harness reproduces and guards the reported room/door save-loss workflow.

## Files Changed
- See git diff for source, checker, manifest, Docker/local verification wiring, and evidence updates.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-layout-editor-save-failure-repro.mjs --stage red-mode-detects-loss --allow-partial --issue 632
- node scripts/check-layout-editor-save-failure-repro.mjs --stage browser-save-reload --allow-partial --issue 632
- node scripts/check-layout-editor-save-failure-repro.mjs --stage room-move-compare --allow-partial --issue 632
- node scripts/check-layout-editor-save-failure-repro.mjs --stage door-change-compare --allow-partial --issue 632
- node scripts/check-layout-editor-save-failure-repro.mjs --stage same-record-reload --allow-partial --issue 632
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-632
- docs/verification/floorplan-editor-save-reload-truth-loop-manifest.json

## Known Limitations
- This issue adds browser verification only; product persistence repair and UI copy changes are handled in later issues.
- Browser evidence uses synthetic operational rooms and doors only.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction was added.

## GO / NO-GO
- GO for the next scoped save/reload truth-loop issue.
