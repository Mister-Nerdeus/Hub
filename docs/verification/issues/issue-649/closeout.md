# Issue 649 Closeout

## Summary
Issue 649 local closeout evidence for Codex Batch 641-650 editor runtime, save UX, and layout repair.

## Problem
Object popup mode supports Auto, On canvas, and Docked; canvas popups clamp inside the stage and can dock into the side inspector.

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
- node scripts/check-editor-popup-layout.mjs --stage popup-mode-contract --allow-partial --issue 649
- node scripts/check-editor-popup-layout.mjs --stage clamp-inside-canvas --allow-partial --issue 649
- node scripts/check-editor-popup-layout.mjs --stage docked-mode --allow-partial --issue 649
- node scripts/check-editor-popup-layout.mjs --stage small-viewport --allow-partial --issue 649
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-649
- docs/verification/editor-runtime-save-ux-layout-repair-manifest.json

## Known Limitations
- Later issues in this batch remain blocked until their own validators pass.

## Non-PHI Confirmation
- Non-PHI rules still pass.

## GO / NO-GO
- GO for Issue 650.
