# Issue 025F Closeout

## Summary
Added contract length limits matching the database constraints for plan ID, name, and description, with TypeScript, Python, and API test coverage.

## Files Changed
- `packages/shared/src/contracts.ts`
- `packages/shared/tests/contracts.test.mjs`
- `packages/shared/fixtures/invalid/plan-id-too-long.json`
- `packages/shared/fixtures/invalid/plan-name-too-long.json`
- `apps/api/app/contracts.py`
- `apps/api/tests/contracts/test_plan_length_limits.py`
- `apps/api/tests/test_plans_api.py`
- `docs/contracts/phase-2-plan-contract-alignment.md`

## Failure Reproduced
New tests cover overlong `planId`, overlong `name`, and overlong `description` before database writes.

## Commands Run
See `docs/verification/issues/issue-025F/commands.txt`.

## Tests Passed
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `cd apps/api && python -m pytest`

## Evidence
- `docs/verification/issues/issue-025F/validation-output.txt`

## Known Limitations
The limits intentionally mirror current database columns rather than expanding them.

## Non-PHI Confirmation
No PHI-like fields or clinical free-text fields were added.

## Next Recommended Issue
Issue 026 - Phase 3 planning remains blocked until the batch close rule stays green.
