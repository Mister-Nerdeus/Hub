# Issue 025A Closeout

## Summary
Added an executable package-level web test runner that discovers and runs every `apps/web/src/**/*.test.ts` file with runtime assertions.

## Files Changed
- `apps/web/scripts/run-web-tests.mjs`
- `apps/web/package.json`
- `scripts/verify-local.mjs`
- `scripts/verify-local.ps1`
- `scripts/verify-local.sh`
- `.github/workflows/ci.yml`
- `README.md`

## Failure Reproduced
The missing web test script failed, and a temporary runtime assertion was not caught by `npm --workspace apps/web run build`. After the runner was added, the same temporary assertion failed `npm --workspace apps/web test` with a non-zero exit.

## Commands Run
See `docs/verification/issues/issue-025A/commands.txt`.

## Tests Passed
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `npm --workspace packages/shared test`

## Evidence
- `docs/verification/issues/issue-025A/failure-reproduction.txt`
- `docs/verification/issues/issue-025A/test-output.txt`

## Known Limitations
The runner is intentionally lightweight and Node-based. It does not provide browser rendering coverage.

## Non-PHI Confirmation
No PHI-like fields or clinical free-text fields were added.

## Next Recommended Issue
Issue 025B - Enforce Phase 2 Evidence in Docs Gate.
