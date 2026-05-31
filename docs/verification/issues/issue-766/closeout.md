# Issue 766 Closeout

## Problem
Geometry Layer Contract

## Code Review
- The editor had selectable objects but no shared layer enum that separated editable geometry, locked/reference objects, labels, measurements, handles, grid, and popovers.

## Summary
- Local validator status: passed.

## Files Changed
- packages/shared/src/floorplans/geometryLayerContract.ts
- packages/shared/src/floorplans/floorplanGeometryContract.ts
- packages/shared/src/index.ts
- scripts/check-geometry-layer-contract.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-766/

## Commands Run
- npm --workspace packages/shared test
- node scripts/check-geometry-layer-contract.mjs --stage layer-enum --issue 766
- node scripts/check-geometry-layer-contract.mjs --stage selectability-contract --issue 766
- node scripts/check-geometry-layer-contract.mjs --stage editability-contract --issue 766
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-766/layer-enum-output.json
- docs/verification/issues/issue-766/selectability-contract-output.json
- docs/verification/issues/issue-766/editability-contract-output.json
- docs/verification/issues/issue-766/manifest-update-output.json

## Known Limitations
- This issue defines the shared layer contract; later issues wire rendered object identity and specific renderers to it.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
