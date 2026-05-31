# Issue 806 Closeout

## Problem
Geometry Regression Sweep

## Code Review
- Geometry truth work needed a combined sweep across reference overlays, hallways/walls/support, and split-room parent-bed contracts.

## Summary
- Local validator status: passed.

## Files Changed
- scripts/check-geometry-regression-sweep.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-806/

## Commands Run
- node scripts/check-geometry-regression-sweep.mjs --stage reference-overlay --issue 806
- node scripts/check-geometry-regression-sweep.mjs --stage hallways-walls-support --issue 806
- node scripts/check-geometry-regression-sweep.mjs --stage split-room-parent-bed --issue 806
- node scripts/check-door-authoring-browser-regression.mjs --stage final --issue 806
- node scripts/check-active-floorplan-workflow-go-no-go.mjs --stage final --issue 806
- node scripts/check-workspace-ux-repair-go-no-go.mjs --stage final --issue 806
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-806/reference-overlay-output.json
- docs/verification/issues/issue-806/hallways-walls-support-output.json
- docs/verification/issues/issue-806/split-room-parent-bed-output.json
- docs/verification/issues/issue-806/manifest-update-output.json

## Known Limitations
- Sweep is manifest-driven and local-first; GitHub Actions are not expanded.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
