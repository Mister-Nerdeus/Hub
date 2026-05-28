# Issue 592 Closeout

## Summary
- Repaired the evidence-index truth gap by adding committed-content validation from repo root.
- Added `scripts/lib/evidence-index-utils.mjs` for non-empty, non-whitespace committed index reads.
- The committed index now includes Issue 592 evidence and remains valid JSON with schema metadata.

## Proof
- Index byte size: see `committed-index-content-output.json`.
- Schema version: `1.0.0`.
- Issue coverage: `issue-coverage-output.json` confirms Issues 571-592 are indexed and Issues 581-592 have required evidence.
- Blank-index negative result: `blank-committed-index-negative-output.json`.
- Local-only negative result: `local-only-index-negative-output.json`.
- Missing-evidence negative/result: `missing-evidence-negative-output.json` and `missing-evidence-output.json`.
- Committed index path: `docs/verification/ISSUE_EVIDENCE_INDEX.json`.

## Files Changed
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/check-issue-evidence-index.mjs`
- `scripts/lib/evidence-index-utils.mjs`
- `scripts/lib/simulation-v0-repair-utils.mjs`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`
- `docs/verification/issues/issue-592/`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-issue-evidence-index.mjs --stage committed-index-content --allow-partial --issue 592`
- `node scripts/check-issue-evidence-index.mjs --stage valid-json --allow-partial --issue 592`
- `node scripts/check-issue-evidence-index.mjs --stage issue-coverage --allow-partial --issue 592`
- `node scripts/check-issue-evidence-index.mjs --stage blank-committed-index-negative --allow-partial --issue 592`
- `node scripts/check-issue-evidence-index.mjs --stage local-only-index-negative --allow-partial --issue 592`
- `node scripts/check-no-phi-fields.mjs`

## Tests Passed/Failed
- Passed: shared tests, 964 tests.
- Passed: web tests, 211 files.
- Passed: web build.
- Passed: Issue 592 evidence-index gate stages.
- Passed: no-PHI scan.
- Note: an initial parallel shared/web run produced a transient shared `dist` race; rerunning the required gates sequentially passed.

## Evidence Artifacts
- `docs/verification/issues/issue-592/`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`

## Known Limitations
- Simulation v0 remains internal synthetic dry-run only.
- Manual visual review remains required.
- Promotion remains blocked.
- Clean clone enforcement is still pending Issue 597.
- Full-event simulation, optimizer behavior, assignment recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass. This issue added no PHI, real identity, EHR integration, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation behavior, or clinical/staffing/outcome certification claims.

## GO / NO-GO
- GO for next issue.
