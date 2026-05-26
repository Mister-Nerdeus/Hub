# Issue 285 Closeout

## Summary
Auto-hallway V2 now uses deterministic grid subtraction for public-space generation. The proof shows interior non-occupied space between rooms is generated, occupied room cells are excluded, manual hallways are preserved, generated hallway IDs are tagged, and generated hallways save/export with operational metadata.

## Files Changed
- `packages/shared/src/floorplans/autoHallwayGridSubtraction.ts`
- `packages/shared/src/floorplans/autoHallwayGenerator.ts`
- `packages/shared/src/floorplans/simulationReadyExportContract.ts`
- `apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts`
- `apps/web/src/features/layout-editor/AutoHallwayControls.tsx`
- `apps/web/src/features/layout-editor/AutoHallwayControls.test.tsx`
- `packages/shared/tests/auto-hallway-grid-subtraction.test.mjs`
- `packages/shared/fixtures/authoring-proof/plan-1-hallway-v2-fixture.json`
- `scripts/check-floorplan-authoring.mjs`
- `docs/verification/issues/issue-285/`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`

## Commands Run
See `commands.txt` and `command-output-map.json`.

## Tests Passed/Failed
Passed:
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 285`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 285`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 285`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 285`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 285`
- `node scripts/check-floorplan-authoring.mjs --stage hallway-v2 --allow-partial --issue 285`
- `node scripts/check-docs-contracts.mjs`

Failed first, before implementation evidence:
- `node scripts/check-floorplan-authoring.mjs --stage hallway-v2 --allow-partial --issue 285`

## Evidence Artifacts
- `grid-subtraction-output.json`
- `interior-hallway-output.json`
- `occupied-cell-exclusion-output.json`
- `manual-hallway-preservation-output.json`
- `generated-tag-output.json`
- `deterministic-generation-output.json`
- `saved-draft-grid-hallway-output.json`
- `export-grid-hallway-output.json`
- `limitations-output.md`
- `floorplan-authoring-gate-output.json`
- `test-output/`
- `screenshots/auto-hallway-grid-subtraction.png`

## Generated Public-Space Method
The active method is `grid_subtraction`. It subtracts occupied room, station, and zone cells from explicit layout bounds, then merges public cells into deterministic rectangular hallway/public-space zones without over-covering occupied room cells.

## Interior Hallway Result
The proof layout places two rooms with an eight-foot public gap. V2 generates a tagged public-space hallway for that interior gap, proving the method is no longer limited to rectangular envelope difference around the outside of the occupied envelope.

## Known Limitations
Grid subtraction is approximate operational geometry only. Cell size controls precision, generated zones are rectangular approximations, and manual review is still required before route/path sync can be treated as fresh.

## Non-PHI Confirmation
Non-PHI rules still pass. No PHI, EHR data, real patient identity, real staff identity, real hospital identifiers, medication names, diagnosis text, clinical notes, private source payloads, DOCX files, optimizer behavior, or new simulation scoring/model behavior were introduced.

## Next Recommended Issue
GO for Issue 286.
