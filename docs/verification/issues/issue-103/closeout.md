# Issue 103 Closeout

## Summary

Added read-hardening for persisted simulation runs. The list endpoint now applies finite pagination, and list/get serialization validates stored simulation JSON before returning it. Invalid stored JSON receives a deterministic error response instead of being returned as valid simulation data.

## Files Changed

- `apps/api/app/routes/simulation.py`
- `apps/api/app/repositories/simulation_runs.py`
- `apps/api/app/schemas/simulation.py`
- `apps/api/tests/test_simulation_read_validation.py`
- `README.md`
- `scripts/phase-evidence-gates.mjs`
- `docs/verification/issues/issue-103/closeout.md`
- `docs/verification/issues/issue-103/commands.txt`
- `docs/verification/issues/issue-103/api-responses/list-simulation-runs-response.json`
- `docs/verification/issues/issue-103/api-responses/get-invalid-persisted-run-response.json`
- `docs/verification/issues/issue-103/test-output/api.txt`

## Commands Run

- `cd apps/api && python -m pytest tests/test_simulation_read_validation.py`
- `cd apps/api && python -m pytest > ../../docs/verification/issues/issue-103/test-output/api.txt`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `docker compose config`

## Tests Passed/Failed

- Pre-fix failed: list response had no pagination metadata.
- Pre-fix failed: `limit=101` was accepted.
- Pre-fix failed: invalid stored simulation JSON was returned without read-time validation.
- Passed: simulation read validation API tests.
- Passed: API pytest suite.
- Passed: no-PHI scanner.
- Passed: docs contract gate.
- Passed: Docker Compose configuration validation.

## Evidence Paths

- `docs/verification/issues/issue-103/closeout.md`
- `docs/verification/issues/issue-103/commands.txt`
- `docs/verification/issues/issue-103/api-responses/list-simulation-runs-response.json`
- `docs/verification/issues/issue-103/api-responses/get-invalid-persisted-run-response.json`
- `docs/verification/issues/issue-103/test-output/api.txt`

## Known Limitations

- This is read-hardening only.
- It does not add UI, auth/ownership behavior, optimizer persistence expansion, PDF export, file transfer behavior, or new dependencies.

## Non-PHI Confirmation

Non-PHI rules still pass. This issue adds bounded read validation only and no PHI, EHR integration, patient record behavior, clinical certification wording, hidden scoring path, unseeded randomness, UI behavior, optimizer behavior, or dependency changes.

## Next Recommended Issue

Issue 104 - Captured Command Output Evidence Gate
