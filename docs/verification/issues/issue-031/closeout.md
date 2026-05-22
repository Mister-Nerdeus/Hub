# Issue 031 Closeout

## Summary

Made local evidence pack output explicit. Default mode now writes transient evidence under the OS temp directory, while tracked output requires `--tracked`, `--out docs/verification/local-runs/latest`, or `LOCAL_EVIDENCE_DIR=docs/verification/local-runs/latest`.

## Files Changed

- `scripts/generate-local-evidence-pack.mjs`
- `README.md`
- `docs/verification/local-evidence-pack.md`
- `docs/contracts/local-first-verification-contract.md`
- `package.json`
- `docs/verification/issues/issue-031/*`

## Commands Run

See `docs/verification/issues/issue-031/commands.txt`.

## Tests Passed/Failed

Transient and tracked evidence runs are recorded in this issue folder. Full local verification is recorded in the batch commands.

## Evidence

- `transient-evidence-output.txt`
- `tracked-evidence-output.txt`

## Known Limitations

The evidence pack still runs local Docker and local test commands; only the default output location changed.

## Non-PHI Confirmation

No PHI fields, patient identity, clinical notes, EHR integration, or safety-certification claims were added.

## Next Recommended Issue

Issue 032.
