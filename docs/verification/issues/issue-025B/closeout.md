# Issue 025B Closeout

## Summary
Expanded the docs guardrail to convention-check Issue 015+ evidence folders and enforce the Phase 2 Issue 024 evidence bundle.

## Files Changed
- `scripts/check-docs-contracts.mjs`
- `docs/codex/codex-operating-rules.md`
- `docs/codex/codex-issue-template-v2.md`
- `README.md`
- Issue 015-023 closeouts updated with next-issue sections.

## Failure Reproduced
Before the checker change, temporarily renaming `docs/verification/issues/issue-024/closeout.md` still allowed `node scripts/check-docs-contracts.mjs` to pass.

## Commands Run
See `docs/verification/issues/issue-025B/commands.txt`.

## Tests Passed
- `node scripts/check-docs-contracts.mjs`
- `node scripts/check-no-phi-fields.mjs`

## Evidence
- `docs/verification/issues/issue-025B/negative-proof.txt`
- `docs/verification/issues/issue-025B/docs-check-output.txt`

## Known Limitations
The special screenshot and exported JSON checks are currently scoped to Issue 024 because not every issue requires visual artifacts.

## Non-PHI Confirmation
The docs gate changes add evidence enforcement only and do not introduce PHI-like fields.

## Next Recommended Issue
Issue 025E - Make Plan Validation CLI Clean-Checkout Safe.
