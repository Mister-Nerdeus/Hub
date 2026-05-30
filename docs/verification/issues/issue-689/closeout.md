# Issue 689 Closeout

## Problem
Split-room pair physical adjacency hardening.

## Summary
- Local validation artifacts passed for this issue scope.

## Files Changed
- packages/shared/src/floorplans/splitRoomAdjacency.ts
- packages/shared/src/floorplans/splitRoomPairResolver.ts
- packages/shared/src/index.ts
- packages/shared/tests/split-room-pair-resolver.test.mjs
- apps/web/src/features/layout-editor/__tests__/splitRoomWorkflowViewModel.test.ts
- apps/web/src/features/layout-editor/layoutEditorReducer.test.ts
- scripts/check-split-room-adjacency-hardening.mjs
- scripts/lib/split-room-authoring-utils.mjs
- package.json
- docs/verification/split-room-closeout-hardening-manifest.json
- docs/verification/issues/issue-689/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-split-room-adjacency-hardening.mjs --stage adjacency-contract --allow-partial --issue 689
- node scripts/check-split-room-adjacency-hardening.mjs --stage horizontal-adjacent-valid --allow-partial --issue 689
- node scripts/check-split-room-adjacency-hardening.mjs --stage vertical-adjacent-valid --allow-partial --issue 689
- node scripts/check-split-room-adjacency-hardening.mjs --stage same-row-separated-blocked --allow-partial --issue 689
- node scripts/check-split-room-adjacency-hardening.mjs --stage same-column-separated-blocked --allow-partial --issue 689
- node scripts/check-split-room-adjacency-hardening.mjs --stage overlap-blocked --allow-partial --issue 689
- node scripts/check-split-room-adjacency-hardening.mjs --stage canonical-pairs-still-pass --allow-partial --issue 689
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-689
- docs/verification/split-room-closeout-hardening-manifest.json

## Known Limitations
- The shared resolver now blocks aligned rooms unless their physical edges touch or are within 0.01 ft tolerance.
- Canonical pass evidence uses physically adjacent synthetic pairs; broader default floorplan reconstruction remains governed by later browser gates.

## Non-PHI Confirmation
- Non-PHI rules still pass.
