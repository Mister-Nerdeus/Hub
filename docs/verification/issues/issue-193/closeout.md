# Issue 193 Closeout

## Summary

Added API error code contract V1 with stable machine-readable codes for plan, simulation, validation, no-PHI, and invalid persisted simulation-run failures.

## Working Discipline

1. Reproduced the pre-fix failure: most API errors returned text-only or generic validation details.
2. Implemented the smallest bounded fix: centralized error helpers and route/validation wiring.
3. Added tests covering every required error code and payload redaction behavior.
4. Ran required gates and captured outputs.
5. Added command-output evidence under this issue directory.
6. Updated `docs/verification/ISSUE_EVIDENCE_INDEX.json`.
7. Listed non-claims below.
8. No deferred follow-up issues for this issue.

## Files Changed

- `apps/api/app/errors.py`
- `apps/api/app/main.py`
- `apps/api/app/routes/plans.py`
- `apps/api/app/routes/simulation.py`
- `apps/api/app/schemas/simulation.py`
- `apps/api/tests/test_api_error_codes.py`
- `docs/contracts/api-error-contract.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-193/*`

## Commands Run

- `cd apps/api && python -m pytest`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/verify-local.mjs`

## Tests Passed

- Python API tests passed.
- Docs contract gate passed.
- Full local verification passed.

## Evidence Artifacts

- `first-failure.txt`
- `api-error-contract-output.json`
- `test-output/api.txt`
- `test-output/docs-gate.txt`
- `test-output/verify-local.txt`

## Known Limitations

- Error messages remain intentionally terse.
- Validation error arrays include sanitized locations and messages only, not full rejected payloads.
- This issue does not add client-side error handling.

## Next Recommended Issue

Proceed to Issue 194, persisted simulation list tolerance.

## Non-Claims

- No auth.
- No new resources.
- No simulation behavior change.
- No PHI support.
- No clinical safety claim.

## Non-PHI Confirmation

No PHI fields or support were added. No-PHI rejection responses expose a stable code and do not echo rejected values in full.
