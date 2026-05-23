# Issue 109 Closeout

## Summary

Added projected timing explanation fields for `not_started_shift_window_exceeded` missed task events. The simulator still does not start these tasks, does not emit nurse `started_task` events for them, and does not count nurse busy minutes for the missed-not-started outcome.

## Files Changed

- `packages/shared/src/simulation/simulationRunContract.ts`
- `packages/shared/src/simulation/simulationExecution.ts`
- `packages/shared/tests/simulation-missed-task-explanation.test.mjs`
- `packages/shared/tests/simulation-missed-task-semantics.test.mjs`
- `packages/shared/tests/simulation-lifecycle-ordering.test.mjs`
- `packages/shared/fixtures/simulation-missed-not-started.json`
- `packages/shared/fixtures/simulation-run-surge.json`
- `apps/api/app/schemas/simulation.py`
- `apps/api/tests/test_simulation_missed_task_explanation.py`
- `apps/api/tests/test_simulation_lifecycle_ordering.py`
- `apps/api/tests/test_simulation_contract.py`
- `README.md`
- `scripts/phase-evidence-gates.mjs`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-109/closeout.md`
- `docs/verification/issues/issue-109/commands.txt`
- `docs/verification/issues/issue-109/missed-task-explanation-output.json`
- `docs/verification/issues/issue-109/test-output/shared.txt`
- `docs/verification/issues/issue-109/test-output/api.txt`

## Commands Run

- `npm --workspace packages/shared run build; node --test packages/shared/tests/simulation-missed-task-explanation.test.mjs`
- `python -m pytest apps/api/tests/test_simulation_missed_task_explanation.py`
- `npm --workspace packages/shared run build; node --test packages/shared/tests/simulation-missed-task-explanation.test.mjs packages/shared/tests/simulation-missed-task-semantics.test.mjs packages/shared/tests/simulation-lifecycle-ordering.test.mjs`
- `python -m pytest apps/api/tests/test_simulation_missed_task_explanation.py apps/api/tests/test_simulation_lifecycle_ordering.py apps/api/tests/test_simulation_contract.py`
- `npm --workspace packages/shared test`
- `python -m pytest apps/api`
- `npm --workspace packages/shared test > docs/verification/issues/issue-109/test-output/shared.txt`
- `cd apps/api && python -m pytest > ../../docs/verification/issues/issue-109/test-output/api.txt`
- `node scripts/check-no-phi-fields.mjs`
- `docker compose config`
- `node scripts/check-docs-contracts.mjs`
- `npm run verify`
- `docker compose down`

## Tests Passed/Failed

- Pre-fix failed: missed-not-started events did not expose projected timing fields, and Python rejected the future projected-field shape as extra input.
- Passed: Issue 109 TypeScript missed-task explanation tests.
- Passed: Issue 109 Python API missed-task explanation tests.
- Passed: shared package test suite.
- Passed: API test suite.
- Passed: no-PHI scanner.
- Passed: docs contract gate.
- Passed: local verifier, including Docker Compose build/start, migrations, Docker service status, API smoke proof, shared tests, web tests, API tests, and web build.
- Completed: Docker Compose stack stopped after verification.

## Evidence Paths

- `docs/verification/issues/issue-109/closeout.md`
- `docs/verification/issues/issue-109/commands.txt`
- `docs/verification/issues/issue-109/missed-task-explanation-output.json`
- `docs/verification/issues/issue-109/test-output/shared.txt`
- `docs/verification/issues/issue-109/test-output/api.txt`

## Known Limitations

- Attempted-overrun behavior remains deferred; this issue only explains not-started missed tasks.
- No optimizer behavior, API route, persistence schema, UI, report, export, or dependency change was added.

## Non-PHI Confirmation

Non-PHI rules still pass. The change adds deterministic operational timing fields only and does not add PHI, real patient identity, EHR integration, patient records, clinical safety certification language, recommendation language, hidden scoring, optimizer behavior, unseeded randomness, or dependency changes.

## Next Recommended Issue

Issue 110 — Unified Cross-Language Parity Manifest.
