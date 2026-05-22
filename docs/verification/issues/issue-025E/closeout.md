# Issue 025E Closeout

## Summary
Made `npm run validate:plan -- <file>` clean-checkout safe by building the shared package before invoking the CLI and adding a clear missing-build error path.

## Files Changed
- `package.json`
- `scripts/validate-plan-contract.mjs`
- `README.md`
- `docs/verification/plan-json-validation.md`

## Failure Reproduced
After deleting `packages/shared/dist`, the previous root validation command failed because `scripts/validate-plan-contract.mjs` imported missing generated output.

## Commands Run
See `docs/verification/issues/issue-025E/commands.txt`.

## Tests Passed
- `npm run validate:plan -- packages/shared/fixtures/plan-er-pod-phase2.json`
- `npm run validate:plan -- packages/shared/fixtures/invalid/plan-bad-room-type.json` failed as expected with exit code 1.

## Evidence
- `docs/verification/issues/issue-025E/clean-checkout-validation-output.txt`
- `docs/verification/issues/issue-025E/invalid-validation-output.txt`

## Known Limitations
The CLI still depends on the shared TypeScript build output; the root npm script now creates it explicitly.

## Non-PHI Confirmation
No PHI-like fields or clinical content were added.

## Next Recommended Issue
Issue 025D - Prove Docker Migrations and Plan API Against Postgres.
