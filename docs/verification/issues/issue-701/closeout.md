# Issue 701 Closeout

## Problem
Active Floorplan Banner Across All Modes

## Summary
- Local validator status: passed.

## Files Changed
- Active floorplan workflow source, docs, Docker metadata, scripts, manifest, and issue evidence as applicable.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-active-floorplan-banner-all-modes.mjs --stage banner-contract --allow-partial --issue 701
- node scripts/check-active-floorplan-banner-all-modes.mjs --stage floorplan-mode --allow-partial --issue 701
- node scripts/check-active-floorplan-banner-all-modes.mjs --stage editor-mode --allow-partial --issue 701
- node scripts/check-active-floorplan-banner-all-modes.mjs --stage manual-assignment-mode --allow-partial --issue 701
- node scripts/check-active-floorplan-banner-all-modes.mjs --stage scenario-mode --allow-partial --issue 701
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-701
- docs/verification/active-floorplan-workflow-manifest.json
- docs/project/active-floorplan-workflow-status.md

## Known Limitations
- Banner is app-shell scoped; Developer/Evidence remains advanced.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
