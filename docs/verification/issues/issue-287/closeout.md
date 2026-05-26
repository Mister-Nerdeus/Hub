# Issue 287 Closeout

## Summary
Implemented and proved the door-to-path-node generation prototype for authored doors. The generator deterministically creates tagged `room_door` path nodes, connects them to nearby hallway nodes when possible, preserves existing path nodes, and emits manual-review warnings when no hallway connection is available.

## Files Changed
- `packages/shared/src/floorplans/doorPathNodeGenerator.ts`
- `packages/shared/tests/door-path-node-generator.test.mjs`
- `apps/web/src/features/layout-editor/DoorPathNodeSyncControls.tsx`
- `apps/web/src/features/layout-editor/DoorPathNodeSyncControls.test.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `scripts/check-floorplan-authoring.mjs`
- `packages/shared/fixtures/authoring-proof/plan-1-door-path-node-fixture.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-287/`

## Commands Run
See `commands.txt` and `command-output-map.json`.

## Tests Passed/Failed
Passed:
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 287`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 287`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 287`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 287`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 287`
- `node scripts/check-floorplan-authoring.mjs --stage door-path-node-generation --allow-partial --issue 287`
- `node scripts/check-docs-contracts.mjs`

Failed first by design:
- `node scripts/check-floorplan-authoring.mjs --stage door-path-node-generation --allow-partial --issue 287` before Issue 287 evidence existed.

## Evidence Artifacts
- `door-path-node-generator-output.json`
- `generated-node-output.json`
- `generated-edge-output.json`
- `no-nearby-hallway-negative-output.json`
- `manual-review-warning-output.json`
- `existing-node-preservation-output.json`
- `path-sync-status-after-generation-output.json`
- `door-path-node-sync-controls-output.json`
- `floorplan-authoring-gate-output.json`
- `test-output/shared.txt`
- `test-output/web.txt`
- `test-output/web-build.txt`
- `test-output/no-phi.txt`
- `test-output/docs-gate.txt`
- `test-output/floorplan-authoring-gate.txt`
- `test-output/plans-2-through-5-unchanged.txt`

## Generated Node Count
Focused generator proof created 1 tagged door path node. The authoring gate behavioral harness generated 24 door path nodes on the Plan 1 editable-copy path.

## Generated Edge Count
Focused generator proof created 1 valid hallway edge. The authoring gate behavioral harness generated 18 door path edges on the Plan 1 editable-copy path.

## Manual Review Warnings
The no-nearby-hallway negative proof emits `NO_NEARBY_HALLWAY_NODE`, `PATH_EDGE_GENERATION_SKIPPED`, `MANUAL_PATH_REVIEW_REQUIRED`, and `GENERATED_PATH_NODE_APPROXIMATE`. Manual-review generation keeps `pathSyncStatus` at `stale_warning`.

## Known Limitations
Generated nodes and edges are approximate authoring aids. They do not claim exact route truth, CAD accuracy, optimizer behavior, clinical safety, staffing guidance, EHR integration, or simulation scoring changes.

## Non-PHI Confirmation
Non-PHI rules still pass. No PHI, real patient identity, real staff identity, EHR data, hospital identifiers, medication names, diagnosis text, clinical notes, private source payloads, or DOCX/runtime source assets were introduced.

## Next Recommended Issue
GO for Issue 288. Simulation-ready export gating can now validate generated door/path-node output and block stale or incomplete route access.
