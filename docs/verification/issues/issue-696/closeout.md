# Issue 696 Closeout

## Problem
Active Floorplan Selector Normal UX

## Summary
- Local validator status: passed.

## Files Changed
- Active floorplan workflow source, docs, Docker metadata, scripts, manifest, and issue evidence as applicable.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-active-floorplan-selector-ux.mjs --stage selector-view-model --allow-partial --issue 696
- node scripts/check-active-floorplan-selector-ux.mjs --stage normal-mode --allow-partial --issue 696
- node scripts/check-active-floorplan-selector-ux.mjs --stage change-dropdown --allow-partial --issue 696
- node scripts/check-active-floorplan-selector-ux.mjs --stage advanced-library --allow-partial --issue 696
- node scripts/check-active-floorplan-selector-ux.mjs --stage technical-copy-hidden --allow-partial --issue 696
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-696
- docs/verification/active-floorplan-workflow-manifest.json
- docs/project/active-floorplan-workflow-status.md

## Known Limitations
- Screenshots are local placeholder artifacts unless rerun with a browser capture script.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
