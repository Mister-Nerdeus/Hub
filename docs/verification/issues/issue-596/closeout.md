# Issue 596 Closeout

## Summary
- Repaired the final Simulation v0 refinement repair gate so it no longer trusts manifest flags alone.
- The gate now independently inspects committed source/artifacts for default room scale, evidence index content, docs-contract scope, UI status truth, visible-copy hardening, and no-claim boundaries.
- Added a contradiction negative where manifest says passed but source still contains 12x10 placement.

## Proof
- Independent revalidation: `independent-revalidation-output.json`.
- Manifest contradiction negative: `manifest-contradiction-negative-output.json`.
- Default scale revalidation: `default-scale-revalidation-output.json`.
- Evidence index revalidation: `evidence-index-revalidation-output.json`.
- Docs contract revalidation: `docs-contract-revalidation-output.json`.
- UI status revalidation: `ui-status-revalidation-output.json`.
- Visible-copy policy revalidation: `visible-copy-policy-revalidation-output.json`.

## Files Changed
- `scripts/check-simulation-v0-refinement-repair.mjs`
- `scripts/lib/simulation-v0-repair-utils.mjs`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`
- `docs/verification/issues/issue-596/`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-simulation-v0-refinement-repair.mjs --stage independent-revalidation --allow-partial --issue 596`
- `node scripts/check-simulation-v0-refinement-repair.mjs --stage manifest-contradiction-negative --allow-partial --issue 596`
- `node scripts/check-simulation-v0-refinement-repair.mjs --stage final --issue 596`
- `node scripts/check-no-phi-fields.mjs`

## Tests Passed/Failed
- Passed: shared tests, 964 tests.
- Passed: web tests, 212 files.
- Passed: web build.
- Passed: independent revalidation, manifest contradiction negative, and final repair gate.
- Passed: no-PHI scan.

## Evidence Artifacts
- `docs/verification/issues/issue-596/`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`

## Known Limitations
- Clean committed-state verification is still pending Issue 597.
- Simulation v0 remains internal synthetic dry-run only.
- Manual visual review remains required.
- Promotion remains blocked.
- Full-event simulation, optimizer behavior, assignment recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass. This issue added no PHI, real identity, EHR integration, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation behavior, or clinical/staffing/outcome certification claims.

## GO / NO-GO
- GO for next issue.
