# Issue 039 Closeout

## Summary

Verified and preserved the local evidence pack output-mode truth: default evidence generation writes transient artifacts under the OS temp directory, while tracked repository output requires explicit opt-in through `--tracked` or an explicit tracked output path.

## Files Changed

- `docs/verification/local-runs/latest/*`
- `docs/verification/issues/issue-039/commands.txt`
- `docs/verification/issues/issue-039/output-mode-proof.txt`
- `docs/verification/issues/issue-039/closeout.md`

## Commands Run

See `docs/verification/issues/issue-039/commands.txt`.

## Tests Passed/Failed

Passed:

- `npm run evidence:local`
- `npm run evidence:local -- --tracked`
- `npm run evidence:local -- --out <os-temp>\nerdeus-evidence-custom-issue039`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `cd apps/api && python -m pytest`
- `npm --workspace apps/web run build`
- `npm run validate:plan -- packages/shared/fixtures/plan-er-pod-phase2.json`
- `docker compose down`
- `node scripts/verify-local.mjs`

Failed: None.

## Evidence

- `docs/verification/issues/issue-039/output-mode-proof.txt`
- `docs/verification/local-runs/latest/manifest.json`

## Known Limitations

The evidence pack still runs the full local Docker and test sequence for every output mode; this issue only verifies where artifacts are written and how the mode is recorded.

## Non-PHI Confirmation

No PHI fields, patient identity, clinical notes, EHR integration, diagnosis text, hidden scoring, optimizer behavior, or clinical safety certification claims were added. `node scripts/check-no-phi-fields.mjs` passes.

## Next Recommended Issue

Issue 040, to enforce Phase 3 evidence artifacts in the docs checker.
