# Issue 286 Closeout

## Summary
Implemented route access audit proof and a visible editor Path Sync Status panel. The authoring gate for `path-sync-audit` now executes the behavioral harness and verifies local evidence, rather than passing on module presence alone.

## Files Changed
- `packages/shared/tests/path-sync-audit.test.mjs`
- `apps/web/src/features/layout-editor/PathSyncStatusPanel.tsx`
- `apps/web/src/features/layout-editor/PathSyncStatusPanel.test.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `scripts/check-floorplan-authoring.mjs`
- `packages/shared/fixtures/authoring-proof/plan-1-path-sync-fixture.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-286/`

## Commands Run
See `commands.txt` and `command-output-map.json`.

## Tests Passed/Failed
Passed:
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 286`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 286`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 286`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 286`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 286`
- `node scripts/check-floorplan-authoring.mjs --stage path-sync-audit --allow-partial --issue 286`
- `node scripts/check-docs-contracts.mjs`

Failed first by design:
- `node scripts/check-floorplan-authoring.mjs --stage path-sync-audit --allow-partial --issue 286` before Issue 286 evidence existed.

## Evidence Artifacts
- `first-failure.txt`
- `path-sync-audit-output.json`
- `route-access-output.json`
- `missing-door-output.json`
- `missing-path-node-output.json`
- `unreachable-room-output.json`
- `simulation-ready-block-output.json`
- `path-sync-panel-output.json`
- `floorplan-authoring-gate-output.json`
- `test-output/shared.txt`
- `test-output/web.txt`
- `test-output/web-build.txt`
- `test-output/no-phi.txt`
- `test-output/docs-gate.txt`
- `test-output/floorplan-authoring-gate.txt`
- `test-output/plans-2-through-5-unchanged.txt`

## Path Sync Status
The audit reports `pathSyncStatus`, room counts, rooms with doors, rooms with path nodes, missing door/path-node lists, unreachable room IDs, blocking issues, warning issues, `simulationReady`, and limitations. Stale drafts surface `PATH_SYNC_STALE`.

## Rooms Missing Route Access
The proof covers rooms missing doors, rooms missing path nodes, and rooms unreachable from the route graph. The required warning codes are produced: `ROOM_MISSING_DOOR`, `ROOM_MISSING_PATH_NODE`, and `PATH_GRAPH_UNREACHABLE_ROOM`.

## Simulation-Ready Block Behavior
Simulation-ready export is blocked when path sync is stale or route access is incomplete. The stale-path export result returns `blocked_path_sync` and includes `SIMULATION_READY_EXPORT_BLOCKED`.

## Known Limitations
This is route-access validation only. It does not claim exact walking truth, CAD accuracy, optimizer behavior, clinical safety, staffing guidance, EHR integration, or scoring-model changes.

## Non-PHI Confirmation
Non-PHI rules still pass. No PHI, real patient identity, real staff identity, EHR data, hospital identifiers, medication names, diagnosis text, clinical notes, private source payloads, or DOCX/runtime source assets were introduced.

## Next Recommended Issue
GO for Issue 287. Door-to-path-node generation can build on the route access audit and status panel.
