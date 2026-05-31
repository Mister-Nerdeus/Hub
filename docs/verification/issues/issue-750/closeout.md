# Issue 750 Closeout

## Problem
Global Horizontal Overflow Repair

## Code Review
- The shell used viewport-width sizing and lacked a complete root reset; the repair uses 100% width, root margin reset, and overflow containment for the shell and editor.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/styles.css
- apps/web/src/features/app-shell/appShell.css
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- scripts/check-global-horizontal-overflow.mjs
- docs/verification/issues/issue-750/

## Commands Run
- node scripts/check-global-horizontal-overflow.mjs --stage shell --issue 750
- node scripts/check-global-horizontal-overflow.mjs --stage floorplan-hub --issue 750
- node scripts/check-global-horizontal-overflow.mjs --stage editor --issue 750
- node scripts/check-global-horizontal-overflow.mjs --stage narrow-desktop --issue 750

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-750/screenshot-index.json
- docs/verification/issues/issue-750/test-output/check-global-horizontal-overflow.txt

## Known Limitations
- Browser checks validate page-level overflow at the tested desktop and narrow desktop sizes.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.

## Next Recommended Issue
- Issue 764 is the repair GO/NO-GO; after it passes, durable assignment foundation may start in the next milestone without adding scoring, simulation, optimizer, reports, or clinical claims.

