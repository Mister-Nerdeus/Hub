# Issue 595 Closeout

## Summary
- Replaced the hardcoded pending Simulation v0 reproducibility UI status.
- The web view model now derives `stable hash proof passed` from `buildDryRunReproducibilityStatus`.
- Simulation v0 remains internal synthetic dry-run only with no optimizer, recommendation, clinical, staffing, or outcome claims.

## Proof
- UI status truth: `ui-status-truth-output.json`.
- Reproducibility status: `reproducibility-status-output.json`.
- Pending status negative: `pending-status-negative-output.json`.
- Route render proof: `simulation-route-render-output.json`.
- Screenshot: `screenshots/simulation-status-truth.png`.

## Files Changed
- `apps/web/src/features/simulation/simulationV0ViewModel.ts`
- `apps/web/src/features/simulation/__tests__/simulationV0ViewModel.test.ts`
- `packages/shared/src/simulation/dryRunReproducibilityProof.ts`
- `scripts/check-simulation-v0-ui-shell.mjs`
- `scripts/lib/simulation-v0-repair-utils.mjs`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`
- `docs/verification/issues/issue-595/`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-simulation-v0-ui-shell.mjs --stage ui-status-truth --allow-partial --issue 595`
- `node scripts/check-simulation-v0-ui-shell.mjs --stage reproducibility-status --allow-partial --issue 595`
- `node scripts/check-simulation-v0-ui-shell.mjs --stage pending-status-negative --allow-partial --issue 595`
- `node scripts/check-no-phi-fields.mjs`

## Tests Passed/Failed
- Passed: shared tests, 964 tests.
- Passed: web tests, 212 files.
- Passed: web build.
- Passed: Simulation v0 UI shell truth, reproducibility, and negative stages.
- Passed: no-PHI scan.

## Evidence Artifacts
- `docs/verification/issues/issue-595/`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`

## Known Limitations
- Simulation v0 remains internal synthetic dry-run only.
- Manual visual review remains required.
- Promotion remains blocked.
- Full-event simulation, optimizer behavior, assignment recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass. This issue added no PHI, real identity, EHR integration, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation behavior, or clinical/staffing/outcome certification claims.

## GO / NO-GO
- GO for next issue.
