# Issue 767 Closeout

## Problem
Rendered Object Identity Contract

## Code Review
- Visible editor objects needed an explicit identity shape tying render IDs to geometry layers, sources, selectability, editability, removability, and lock reasons.

## Summary
- Local validator status: passed.

## Files Changed
- packages/shared/src/floorplans/renderedObjectContract.ts
- packages/shared/src/floorplans/floorplanGeometryContract.ts
- packages/shared/src/index.ts
- scripts/check-rendered-object-identity-contract.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-767/

## Commands Run
- npm --workspace packages/shared test
- node scripts/check-rendered-object-identity-contract.mjs --stage contract --issue 767
- node scripts/check-rendered-object-identity-contract.mjs --stage locked-reason --issue 767
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-767/contract-output.json
- docs/verification/issues/issue-767/locked-reason-output.json
- docs/verification/issues/issue-767/manifest-update-output.json

## Known Limitations
- This issue defines the shared rendered-object identity contract; later issues populate the editor registry from runtime render objects.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
