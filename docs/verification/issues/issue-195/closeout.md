# Issue 195 Closeout

## Summary

Hardened Issue 187+ evidence enforcement and updated the evidence scaffolder so new hardened issues can start with closeout, commands, command-output-map, and non-empty mapped output placeholders.

## Working Discipline

1. Reproduced the pre-fix gap: the docs gate lacked a dedicated Issue 187+ evidence rule and the scaffolder did not create a complete hardened structure.
2. Implemented the smallest bounded fix: added the hardened evidence check and `--create-files` scaffolder support.
3. Added negative self-test coverage for missing closeout, commands, command-output-map, index entry, and empty required evidence.
4. Ran required gates and captured outputs.
5. Added command-output evidence under this issue directory.
6. Updated `docs/verification/ISSUE_EVIDENCE_INDEX.json`.
7. Listed non-claims below.
8. No deferred follow-up issues for this issue.

## Files Changed

- `scripts/check-docs-contracts.mjs`
- `scripts/scaffold-issue-evidence-index-entry.mjs`
- `docs/verification/README.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-195/*`

## Commands Run

- `node scripts/check-docs-contracts.mjs --self-test`
- `node scripts/scaffold-issue-evidence-index-entry.mjs --self-test`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/verify-local.mjs`

## Tests Passed

- Hardened evidence self-tests passed.
- Scaffolder self-tests passed.
- Docs contract gate passed.
- Full local verification passed.

## Evidence Artifacts

- `first-failure.txt`
- `evidence-gate-output.json`
- `negative-docs-gate-output.json`
- `test-output/docs-gate.txt`
- `test-output/verify-local.txt`

## Known Limitations

- The scaffold creates placeholders only; issue owners must replace them with real evidence before closeout.
- Existing command-output-map validation remains responsible for per-command missing or empty mapped output files.

## Next Recommended Issue

Proceed to Issue 196, hardening pause audit and go/no-go.

## Non-Claims

- No product behavior change.
- No API behavior change.
- No simulation behavior change.
- No optimizer behavior.
- No deployment behavior change.

## Non-PHI Confirmation

No PHI fields or support were added. This issue only changes local documentation and evidence gates.
