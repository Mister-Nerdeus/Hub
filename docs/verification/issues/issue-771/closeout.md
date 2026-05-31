# Issue 771 Closeout

## Problem
Reference Overlay Contract

## Code Review
- Reference/parity visuals needed a first-class locked overlay contract so they cannot be mistaken for editable floorplan geometry.

## Summary
- Local validator status: passed.

## Files Changed
- packages/shared/src/floorplans/referenceOverlayContract.ts
- apps/web/src/features/layout-editor/referenceOverlayViewModel.ts
- packages/shared/src/index.ts
- scripts/check-reference-overlay-contract.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-771/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web run build
- node scripts/check-reference-overlay-contract.mjs --stage contract --issue 771
- node scripts/check-reference-overlay-contract.mjs --stage locked-toggleable --issue 771
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-771/contract-output.json
- docs/verification/issues/issue-771/locked-toggleable-output.json
- docs/verification/issues/issue-771/manifest-update-output.json

## Known Limitations
- This issue defines the contract and view model; issue 772 adds the normal-toolbar toggle UI.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
