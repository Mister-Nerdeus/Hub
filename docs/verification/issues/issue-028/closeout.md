# Issue 028 Closeout

## Summary
Added `npm run evidence:local`, which generates a local evidence pack under `docs/verification/local-runs/latest/` and writes an artifact manifest. The command runs Docker proof, guardrail checks, shared/web/API tests, web build, and plan validation locally.

## Files Changed
- `scripts/generate-local-evidence-pack.mjs`
- `package.json`
- `README.md`
- `docs/contracts/local-first-verification-contract.md`
- `docs/codex/codex-operating-rules.md`
- `docs/verification/local-evidence-pack.md`
- `docs/verification/local-runs/latest/`
- `docs/verification/issues/issue-028/closeout.md`
- `docs/verification/issues/issue-028/commands.txt`
- `docs/verification/issues/issue-028/local-evidence-manifest.json`
- `docs/verification/issues/issue-028/local-evidence-output.txt`

## Commands Run
See `commands.txt`.

## Tests Passed/Failed
Pre-fix reproduction failed because `scripts/generate-local-evidence-pack.mjs` did not exist. Passed after implementation: `npm run evidence:local`, no-PHI scanner, and docs contract check.

## Evidence
- `docs/verification/issues/issue-028/local-evidence-manifest.json`
- `docs/verification/issues/issue-028/local-evidence-output.txt`
- `docs/verification/local-runs/latest/manifest.json`

## Known Limitations
`docs/verification/local-runs/latest/` is intentionally overwritten on each evidence pack run.

## Non-PHI Confirmation
The evidence pack includes passing no-PHI output and direct no-PHI scanner execution passed.

## Next Recommended Issue
Use `npm run evidence:local` for consolidated local evidence when future issues need a reproducible artifact pack.
