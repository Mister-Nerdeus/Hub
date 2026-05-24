# Issue 185 Closeout

## Summary
- Added pure shared room move path node sync.
- Linked room path nodes move by the supplied room delta while room-owned door path nodes recalculate from derived door centers.
- Unrelated path nodes and all path edges remain unchanged; no-op room deltas return not required.

## Files changed
- `packages/shared/src/layout-editor/syncRoomMovePathNodeGeometry.ts`
- `packages/shared/tests/sync-room-move-path-node-geometry.test.mjs`
- `packages/shared/src/layout-editor/roomMovePathSyncContract.ts`
- `packages/shared/src/layout-editor/syncDoorPathNodeGeometry.ts`
- `packages/shared/src/index.ts`
- `docs/verification/issues/issue-185/commands.txt`
- `docs/verification/issues/issue-185/command-output-map.json`
- `docs/verification/issues/issue-185/room-move-path-node-sync-output.json`
- `docs/verification/issues/issue-185/test-output/shared.txt`
- `docs/verification/issues/issue-185/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests passed/failed
- Passed: `npm --workspace packages/shared test`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-185/commands.txt`
- `docs/verification/issues/issue-185/command-output-map.json`
- `docs/verification/issues/issue-185/room-move-path-node-sync-output.json`
- `docs/verification/issues/issue-185/test-output/shared.txt`

## Known limitations
- Room move path node sync is a pure shared helper and returns a copied plan.
- It does not mutate path edges, rerun pathfinding, recalculate walking metrics, save/load state, or rerun simulation.
- UI wiring remains deferred.

## Next Recommended Issue
- Continue with Issue 186 to recalculate walking distance from edited path node geometry.

## Non-PHI Confirmation
- Room move sync uses synthetic operational room, door, path node IDs, and feet-based geometry only.
- No PHI fields, real identity data, clinical meaning, recommendation wording, pathfinding change, or simulation rerun was introduced.
- The no-PHI scanner passed locally.
