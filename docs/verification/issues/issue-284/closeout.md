# Issue 284 Closeout

## Summary
Door authoring is now proven end to end on an editable saved Plan 1 copy. The proof covers adding one door, keeping multiple doors on a room, moving a door, deleting a door, reassigning a door to another room, saving/reloading the authored draft, and exporting the authored layout while preserving the valid door edits.

## Files Changed
- `packages/shared/tests/door-authoring-e2e.test.mjs`
- `apps/web/src/features/layout-editor/doorAuthoringE2E.test.ts`
- `scripts/check-floorplan-authoring.mjs`
- `packages/shared/fixtures/authoring-proof/plan-1-door-authoring-fixture.json`
- `docs/verification/issues/issue-284/`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`

## Commands Run
See `commands.txt` and `command-output-map.json`.

## Tests Passed/Failed
Passed:
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 284`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 284`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 284`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 284`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 284`
- `node scripts/check-floorplan-authoring.mjs --stage door-edit-e2e --allow-partial --issue 284`
- `node scripts/check-docs-contracts.mjs`

Failed first, before implementation evidence:
- `node scripts/check-floorplan-authoring.mjs --stage door-edit-e2e --allow-partial --issue 284`

## Evidence Artifacts
- `first-failure.txt`
- `add-door-e2e-output.json`
- `multiple-doors-e2e-output.json`
- `move-door-e2e-output.json`
- `delete-door-e2e-output.json`
- `assign-door-e2e-output.json`
- `non-finite-door-negative-output.json`
- `stale-path-sync-output.json`
- `save-reload-door-output.json`
- `export-door-output.json`
- `default-nonmutation-output.json`
- `floorplan-authoring-gate-output.json`
- `behavioral-harness-output.json`
- `test-output/`
- `screenshots/door-authoring-e2e.png`

## Door Operations Proven
- Add door on editable saved copy.
- Preserve multiple doors per room.
- Move door along the room perimeter.
- Delete door.
- Reassign door to another room.
- Save/reload/export preserves the intended door set.

## Numeric Validation
Rejected by tests:
- `NaN` `offsetFeet`
- `Infinity` `offsetFeet`
- `NaN` `widthFeet`
- `widthFeet <= 0`
- Door offset outside the room perimeter
- Read-only default door edits

## Path Sync Behavior
Every route-affecting door edit is required to leave `pathSyncStatus` at `stale_warning`. This issue does not claim route correctness after door authoring; route/path sync remains an explicit later validation step.

## Known Limitations
Door authoring still preserves or edits geometric door metadata only. It does not regenerate route nodes or claim walking-route correctness until path sync and door-path-node generation are reviewed.

## Non-PHI Confirmation
Non-PHI rules still pass. No PHI, EHR data, real patient identity, real staff identity, real hospital identifiers, medication names, diagnosis text, clinical notes, private source payloads, DOCX files, optimizer behavior, or new simulation scoring/model behavior were introduced.

## Next Recommended Issue
GO for Issue 285.
