# Issue 735 Closeout

## Problem
Preserve Split-Room Editing

## Code Review
- Moving selected-object details below the canvas could have broken split-room creation, child-room labels, divider controls, save/reload, export/import, or unsplit controls; the browser regression and bottom-panel preservation checks passed after updating the harness for the new normal toolbar.

## Summary
- Split-room browser regression status: passed.
- Bottom details split-room controls preservation status: passed.

## Files Changed
- scripts/check-split-room-browser-regression.mjs
- docs/verification/workspace-ux-foundation-manifest.json
- docs/verification/issues/issue-735/

## Commands Run
- node scripts/check-split-room-browser-regression.mjs --stage final --issue 735
- node scripts/check-editor-details-bottom-panel.mjs --stage split-room-controls-preserved --allow-partial --issue 735
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Passed: split-room browser regression final gate.
- Passed: bottom details split-room controls preservation gate.
- Passed: web build.
- Passed: non-PHI scanner.

## Evidence Artifacts
- docs/verification/issues/issue-735/test-output/split-room-browser-regression-final.txt
- docs/verification/issues/issue-735/test-output/split-room-controls-preserved.txt
- docs/verification/issues/issue-735/split-room-browser-regression-proof.json
- docs/verification/issues/issue-735/screenshot-index.json

## Known Limitations
- The browser proof harness was updated only for Milestone A's normal toolbar and Advanced status placement; split-room authoring behavior itself was not changed in this issue.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
