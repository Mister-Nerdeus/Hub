# Issue 236 Closeout - Plan 1 Route Preview and Walking Baseline Rebuild

## Summary

Issue 236 rebuilds the Plan 1 walking baseline from the repaired JSON path graph with the required route groups. Distances and times remain approximate operational route previews.

## Files Changed

- `packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json`
- `packages/shared/tests/default-plan-walking-baselines.test.mjs`
- `packages/shared/tests/plan-1-walking-baseline.test.mjs`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-236/*`

## Commands Run

- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 236`
- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- PASS: `npm --workspace packages/shared test` completed with 554 passing tests and 0 failures.
- PASS: `node scripts/check-no-phi-fields.mjs` found no PHI-like fields.
- PASS: `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 236` had no required Issue 236 walking-baseline route-group failures. The remaining grey-block annotation gap is expected for later provenance/deferred handling.
- PASS: `node scripts/check-docs-contracts.mjs` passed after Issue 236 evidence artifacts were present.

## Evidence Artifacts

- `first-failure.txt`
- `plan-1-walking-baseline-before.json`
- `plan-1-walking-baseline-after.json`
- `plan-1-route-group-summary.json`
- `plan-1-unreachable-route-output.json`
- `plan-1-walking-baseline-known-limits.md`
- `plans-2-through-5-unchanged-output.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- Walking distances and times are approximate path-graph outputs, not measured walking truth.
- Source mapping/provenance remains for Issue 237.
- Grey unlabeled source blocks remain pending/deferred for later provenance handling.

## Non-PHI Confirmation

No PHI, patient identity, EHR integration, DOCX/source image exposure, clinical safety certification language, optimizer behavior, scoring, or simulation behavior was added.

## GO / NO-GO for Issue 237

- GO: required Plan 1 route groups exist and all baseline routes are reachable.

## Next Recommended Issue

- Issue 237: repair source mapping and conversion provenance.
