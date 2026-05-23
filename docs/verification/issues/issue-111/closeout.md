# Issue 111 Closeout

## Summary

Added a structured persisted simulation validation error response for invalid stored run JSON. Invalid persisted data is still blocked on read, but the response now carries a stable `PERSISTED_SIMULATION_RUN_INVALID` code and a deterministic message without returning the raw stored payload.

## Files Changed

- `apps/api/app/routes/simulation.py`
- `apps/api/app/schemas/simulation.py`
- `apps/api/tests/test_simulation_persisted_error_contract.py`
- `apps/api/tests/test_simulation_read_validation.py`
- `README.md`
- `scripts/phase-evidence-gates.mjs`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-111/closeout.md`
- `docs/verification/issues/issue-111/commands.txt`
- `docs/verification/issues/issue-111/api-responses/invalid-persisted-run-error.json`
- `docs/verification/issues/issue-111/test-output/api.txt`

## Commands Run

- `python -m pytest apps/api/tests/test_simulation_persisted_error_contract.py`
- `python -m pytest apps/api/tests/test_simulation_persisted_error_contract.py apps/api/tests/test_simulation_read_validation.py`
- `cd apps/api && python -m pytest > ../../docs/verification/issues/issue-111/test-output/api.txt`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `npm run verify`
- `docker compose down`

## Tests Passed/Failed

- Pre-fix failed: invalid persisted simulation JSON returned only an unstructured string detail.
- Passed: Issue 111 persisted error contract tests.
- Passed: API test suite.
- Passed: no-PHI scanner.
- Passed: docs contract gate.
- Passed: local verifier, including Docker Compose build/start, migrations, Docker service status, API smoke proof, shared tests, web tests, API tests, and web build.
- Completed: Docker Compose stack stopped after verification.

## Evidence Paths

- `docs/verification/issues/issue-111/closeout.md`
- `docs/verification/issues/issue-111/commands.txt`
- `docs/verification/issues/issue-111/api-responses/invalid-persisted-run-error.json`
- `docs/verification/issues/issue-111/test-output/api.txt`

## Known Limitations

- This issue only changes validation error response shape for invalid persisted simulation run reads. It does not add UI, persistence schema changes, auth or ownership changes, simulation behavior, optimizer behavior, or API route expansion.

## Non-PHI Confirmation

Non-PHI rules still pass. The response contains only a stable operational error code and message and does not leak raw persisted payload content, PHI, real patient identity, EHR integration, patient records, clinical safety certification language, recommendation language, hidden scoring, optimizer behavior, unseeded randomness, or dependency changes.

## Next Recommended Issue

Issue 112 — Command-to-Output Evidence Mapping.
