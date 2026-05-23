# Issue 132 Closeout

## Summary
- Added `travelDistanceFeet` to path travel responses and simulation travel events, derived from feet-based path edge lengths.
- Added walk distance metrics for total walk distance feet and nurse-level walk distance feet.
- Updated shared travel-event tests, API validation parity, and web timeline fixture shape to carry the new distance field.

## Files changed
- `packages/shared/src/pathing/pathTravelContract.ts`
- `packages/shared/src/pathing/pathTravelTime.ts`
- `packages/shared/src/simulation/simulationRunContract.ts`
- `packages/shared/src/simulation/simulationExecution.ts`
- `packages/shared/src/outcomes/nurseWalkLayoutFrictionSummary.ts`
- `packages/shared/tests/path-travel-time.test.mjs`
- `packages/shared/tests/nurse-walk-layout-friction-summary.test.mjs`
- `packages/shared/tests/task-time-queue-summary.test.mjs`
- `packages/shared/tests/simulation-event-reference-integrity.test.mjs`
- `packages/shared/tests/walk-distance-metric-support.test.mjs`
- `packages/shared/fixtures/outcomes/nurse-walk-layout-friction-summary-basic.json`
- `apps/api/app/schemas/simulation.py`
- `apps/api/tests/test_simulation_event_reference_integrity.py`
- `apps/web/src/fixtures/simulationTimelineProof.ts`
- `docs/verification/issues/issue-132/commands.txt`
- `docs/verification/issues/issue-132/command-output-map.json`
- `docs/verification/issues/issue-132/walk-distance-output.json`
- `docs/verification/issues/issue-132/test-output/shared.txt`
- `docs/verification/issues/issue-132/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `npm --workspace apps/web run build`
- `pytest apps/api/tests/test_simulation_event_reference_integrity.py`

## Tests passed/failed
- Failed before implementation: `npm --workspace packages/shared test` because `travelDistanceFeet` was missing from path travel output and rejected on travel events.
- Passed: `node --test packages/shared/tests/walk-distance-metric-support.test.mjs packages/shared/tests/nurse-walk-layout-friction-summary.test.mjs packages/shared/tests/path-travel-time.test.mjs packages/shared/tests/task-time-queue-summary.test.mjs packages/shared/tests/simulation-event-reference-integrity.test.mjs`
- Passed: `npm --workspace packages/shared test`
- Passed: `npm --workspace apps/web run build`
- Blocked: `pytest apps/api/tests/test_simulation_event_reference_integrity.py` could not run because `pytest` is not available in the current shell.
- Failed after final patching: none in required shared/local contract commands

## Evidence artifacts
- `docs/verification/issues/issue-132/commands.txt`
- `docs/verification/issues/issue-132/command-output-map.json`
- `docs/verification/issues/issue-132/walk-distance-output.json`
- `docs/verification/issues/issue-132/test-output/shared.txt`

## Known limitations
- `packages/shared/fixtures/simulation-run-basic.json` and `packages/shared/fixtures/simulation-run-surge-hardened.json` do not contain travel events, so there was no travel-distance field to add there.
- Walk distance is summarized from travel events only; no pathfinding algorithm, UI, API route, or simulation rerun behavior was added.
- API parity test execution was blocked locally by missing `pytest`; the API schema/test files were updated to include `travelDistanceFeet`.

## Next Recommended Issue
- Issue 133: Layout Editor Architecture and Interaction Contract.

## Non-PHI Confirmation
- Walk distance remains an operational layout-friction metric only.
- No pixel-derived distance, real identity, clinical interpretation, recommendation wording, or PHI was introduced.
- `node scripts/check-no-phi-fields.mjs` reports `No PHI-like fields found.`
