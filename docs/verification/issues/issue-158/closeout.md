# Issue 158 Closeout

## Summary
- Added explicit door-follow tests proving room-owned door display geometry is derived from moved room geometry.
- Exposed the door display rectangle derivation helper and kept stored door geometry wall-relative and unchanged.
- Captured a local screenshot proof after moving the selected room in the stage.

## Files changed
- `apps/web/src/features/layout-editor/doorFollowsMovedRoom.test.ts`
- `apps/web/src/features/layout-editor/layoutObjectRenderPipeline.ts`
- `apps/web/src/features/layout-editor/doorShapeViewModel.ts`
- `apps/web/src/features/layout-editor/doorShapeViewModel.test.ts`
- `apps/web/src/features/layout-editor/roomDragMove.test.ts`
- `docs/verification/issues/issue-158/commands.txt`
- `docs/verification/issues/issue-158/command-output-map.json`
- `docs/verification/issues/issue-158/door-follows-room-output.json`
- `docs/verification/issues/issue-158/screenshots/door-follows-room-proof.png`
- `docs/verification/issues/issue-158/test-output/web.txt`
- `docs/verification/issues/issue-158/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- Temporary local Vite server and headless Edge DevTools screenshot capture for `door-follows-room-proof.png`.

## Tests passed/failed
- Failed before fix: `npm --workspace apps/web test` failed because `deriveDoorDisplayRectFeet` was not exported.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Passed: screenshot capture for `door-follows-room-proof.png`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-158/commands.txt`
- `docs/verification/issues/issue-158/command-output-map.json`
- `docs/verification/issues/issue-158/door-follows-room-output.json`
- `docs/verification/issues/issue-158/screenshots/door-follows-room-proof.png`
- `docs/verification/issues/issue-158/test-output/web.txt`

## Known limitations
- Door path-node sync, path graph updates, persistence, save/load, collision validation, and simulation rerun behavior remain deferred.
- Door editing and door dragging were not added.

## Next Recommended Issue
- Continue with Issue 159 to add deterministic operational bounds warnings for permissive room moves.

## Non-PHI Confirmation
- Door-follow proof uses synthetic layout IDs and feet-based geometry only.
- No real identity, diagnosis field, note field, EHR integration, clinical safety certification wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
