# Issue 099 Closeout

## Summary

Implemented explicit V1 missed-task semantics. A task that cannot complete inside the shift window is not started, uses `missReason = "not_started_shift_window_exceeded"`, emits no task or nurse start event, and consumes no nurse busy minutes.

## Files Changed

- `packages/shared/src/simulation/simulationRunContract.ts`
- `packages/shared/src/simulation/simulationExecution.ts`
- `apps/api/app/schemas/simulation.py`
- `apps/api/tests/test_simulation_contract.py`
- `packages/shared/tests/simulation-missed-task-semantics.test.mjs`
- `packages/shared/fixtures/simulation-missed-not-started.json`
- `packages/shared/fixtures/simulation-run-surge.json`
- `docs/verification/issues/issue-083/simulation-output-surge.json`
- `README.md`
- `scripts/phase-evidence-gates.mjs`
- `docs/verification/issues/issue-099/closeout.md`
- `docs/verification/issues/issue-099/commands.txt`
- `docs/verification/issues/issue-099/missed-task-output.json`
- `docs/verification/issues/issue-099/test-output/shared.txt`

## Commands Run

- `npm --workspace packages/shared test -- simulation-missed-task-semantics.test.mjs`
- `cd apps/api && python -m pytest tests/test_simulation_contract.py`
- `npm --workspace packages/shared test > docs/verification/issues/issue-099/test-output/shared.txt`
- `cd apps/api && python -m pytest`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `docker compose config`

## Tests Passed/Failed

- Pre-fix failed: legacy shift-window miss reason was accepted.
- Pre-fix failed: deferred attempted-overrun miss reason was accepted.
- Pre-fix failed: generated missed tasks used the legacy shift-window miss reason.
- Passed: shared package test suite.
- Passed: API pytest suite.
- Passed: no-PHI scanner.
- Passed: docs contract gate.
- Passed: Docker Compose configuration validation.

## Evidence Paths

- `docs/verification/issues/issue-099/closeout.md`
- `docs/verification/issues/issue-099/commands.txt`
- `docs/verification/issues/issue-099/missed-task-output.json`
- `docs/verification/issues/issue-099/test-output/shared.txt`

## Known Limitations

- V1 supports only `unassigned` and `not_started_shift_window_exceeded` miss reasons.
- Attempted-overrun behavior remains deferred and is rejected by current validators.
- This issue does not add optimizer, API route, persistence, UI, or attempted-overrun behavior.

## Non-PHI Confirmation

Non-PHI rules still pass. This issue uses synthetic operational task and nurse IDs only, and adds no PHI, EHR integration, clinical certification wording, hidden scoring path, optimizer behavior, UI behavior, persistence behavior, or unseeded randomness.

## Next Recommended Issue

Issue 100 - Queue Pause/Resume Contract Deferral
