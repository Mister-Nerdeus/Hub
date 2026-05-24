# Issue 186 Closeout

## Summary
- Added walking distance recalculation from edited path node geometry.
- Rebuilds copied baseline and edited path edge lengths from path node coordinates before comparing deterministic route distance.
- Emits baseline distance, edited distance, delta feet, percent change, route edge IDs, and operational limitations without rerunning simulation.

## Files changed
- `packages/shared/src/layout-editor/recalculateWalkingDistanceFromEditedLayout.ts`
- `packages/shared/tests/recalculate-walking-distance-from-edited-layout.test.mjs`
- `packages/shared/src/pathing/pathTravelTime.ts`
- `packages/shared/src/outcomes/nurseWalkLayoutFrictionSummary.ts`
- `packages/shared/src/layout-editor/syncRoomMovePathNodeGeometry.ts`
- `packages/shared/src/index.ts`
- `docs/verification/issues/issue-186/commands.txt`
- `docs/verification/issues/issue-186/command-output-map.json`
- `docs/verification/issues/issue-186/walking-distance-recalculation-output.json`
- `docs/verification/issues/issue-186/test-output/shared.txt`
- `docs/verification/issues/issue-186/closeout.md`
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
- `docs/verification/issues/issue-186/commands.txt`
- `docs/verification/issues/issue-186/command-output-map.json`
- `docs/verification/issues/issue-186/walking-distance-recalculation-output.json`
- `docs/verification/issues/issue-186/test-output/shared.txt`

## Known limitations
- Recalculation compares one supplied path route at a time.
- It does not rerun full simulation, regenerate task schedules, change pathfinding behavior, or save/load state.
- UI wiring remains deferred.

## Next Recommended Issue
- Use this recalculation output in a later editor delta preview only after explicit UI wiring is requested.

## Non-PHI Confirmation
- Walking distance recalculation uses synthetic operational plan IDs, path node IDs, route IDs, and feet-based geometry only.
- No PHI fields, real identity data, clinical meaning, pathfinding change, or simulation rerun was introduced.
- The no-PHI scanner passed locally.
