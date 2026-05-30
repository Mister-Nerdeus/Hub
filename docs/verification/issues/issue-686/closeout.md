# Issue 686 Closeout

## Problem
Split-room assignment and capacity semantics.

## Summary
- Local validation artifacts passed for this issue scope.

## Files Changed
- Split-room source, Docker labels, scripts, manifest, project status, and issue evidence artifacts as applicable.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-split-room-assignment-semantics.mjs --stage contract --allow-partial --issue 686
- node scripts/check-split-room-assignment-semantics.mjs --stage child-assignment --allow-partial --issue 686
- node scripts/check-split-room-assignment-semantics.mjs --stage capacity-count --allow-partial --issue 686
- node scripts/check-split-room-assignment-semantics.mjs --stage parent-not-assignable --allow-partial --issue 686
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-686
- docs/verification/split-room-authoring-manifest.json

## Known Limitations
- Full ER floorplan reconstruction remains gated by local verification artifacts.

## Non-PHI Confirmation
- Non-PHI rules still pass.
