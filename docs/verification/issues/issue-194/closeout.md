# Issue 194 Closeout

## Summary

Updated the simulation run list endpoint to tolerate invalid persisted simulation JSON per row. Valid summaries remain unchanged, while invalid rows return a redacted summary with stable ID, status, and code.

## Working Discipline

1. Reproduced the pre-fix failure: one invalid persisted row caused the entire list endpoint to return an invalid-record error.
2. Implemented the smallest bounded fix: catch invalid persisted rows only during list-summary serialization.
3. Added tests for valid plus invalid list results, payload redaction, and deterministic get-by-id invalid behavior.
4. Ran required gates and captured outputs.
5. Added command-output evidence under this issue directory.
6. Updated `docs/verification/ISSUE_EVIDENCE_INDEX.json`.
7. Listed non-claims below.
8. No deferred follow-up issues for this issue.

## Files Changed

- `apps/api/app/routes/simulation.py`
- `apps/api/tests/test_simulation_read_validation.py`
- `docs/contracts/api-error-contract.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-194/*`

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
- `simulation-list-tolerance-output.json`
- `test-output/api.txt`
- `test-output/docs-gate.txt`
- `test-output/verify-local.txt`

## Known Limitations

- Invalid persisted records are not repaired.
- Invalid payload content remains hidden and is not exposed through list responses.
- No admin tooling is added.

## Next Recommended Issue

Proceed to Issue 195, evidence index and local gate hardening.

## Non-Claims

- No TypeScript simulation behavior change.
- No report behavior change.
- No optimizer behavior.
- No corrupted-record repair.
- No PHI support.

## Non-PHI Confirmation

No PHI fields or support were added. Invalid persisted payloads remain redacted in list and detail responses.
