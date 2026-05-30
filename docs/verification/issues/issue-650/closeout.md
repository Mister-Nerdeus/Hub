# Issue 650 Closeout

## Problem
Runtime/save/layout final GO/NO-GO reruns the 641-650 validators, reads root wiring, verify-local wiring, manual checklist, and evidence outputs.

## Summary
- Local verification identified blockers for this issue scope.

## Invariants
- Operational simulation tool only.
- No PHI, EHR integration, optimizer behavior, assignment recommendation, or clinical/staffing/outcome claim was added.
- Local verification artifacts are the source of truth.

## Files Changed
- See git diff for source, checker, Docker/local runtime metadata, manifest, and evidence updates.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- npm run check:clean-committed-state
- node scripts/check-editor-runtime-version-proof.mjs --stage final --issue 650
- node scripts/check-editor-stale-runtime-detection.mjs --stage final --issue 650
- node scripts/check-editor-save-command-bar-ux.mjs --stage final --issue 650
- node scripts/check-editor-active-copy-save-status.mjs --stage final --issue 650
- node scripts/check-editor-truthful-save-language.mjs --stage final --issue 650
- node scripts/check-editor-room-door-save-reload-proof.mjs --stage final --issue 650
- node scripts/check-editor-save-pipeline-trace.mjs --stage final --issue 650
- node scripts/check-editor-canvas-height-layout.mjs --stage final --issue 650
- node scripts/check-editor-popup-layout.mjs --stage final --issue 650
- node scripts/check-editor-runtime-save-ux-layout-go-no-go.mjs --stage final --issue 650

## Tests Passed/Failed
- One or more local gates failed; see test-output and first-failure.txt.

## Evidence Artifacts
- docs/verification/issues/issue-650
- docs/verification/editor-runtime-save-ux-layout-repair-manifest.json

## Known Limitations
- NO-GO blockers: manual checklist failure: Unchecked required manual checklist items: Runtime build panel visible, Batch marker visible, Save Working Copy visible and primary, Save As New Copy visible, Export JSON Backup visible, Active copy name and recordId visible, Move one room, Change one door, Click Save Working Copy, Reload browser, Open same saved copy, Changes remain, Export JSON includes changes, Canvas is tall enough to work without constant vertical scrolling, Inspector scrolls if needed, Popup can be docked or remains visible; runtime save UX proof failed

## Non-PHI Confirmation
- Non-PHI rules still pass.

## GO / NO-GO
- NO-GO until listed blockers are fixed.
