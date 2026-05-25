# Issue 230 Closeout - Plan 1 Current Fixture Gap Report

## Summary

Issue 230 generated a deterministic gap report that compares the source-truth contract against the current
`default-er-layout-plan-1.json` fixture and preserved the Plan 1 repair boundary by keeping plans 2–5 untouched.
The resulting audit output captures missing required objects, extra legacy objects, mismatched references, and minimum-count shortfalls.

## Files Changed

- `packages/shared/src/index.ts`
- `packages/shared/tests/plan-1-visual-parity-gap.test.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-230/closeout.md`
- `docs/verification/issues/issue-230/commands.txt`
- `docs/verification/issues/issue-230/command-output-map.json`
- `docs/verification/issues/issue-230/first-failure.txt`
- `docs/verification/issues/issue-230/plan-1-source-visible-inventory.json`
- `docs/verification/issues/issue-230/plan-1-current-fixture-inventory.json`
- `docs/verification/issues/issue-230/plan-1-missing-object-report.json`
- `docs/verification/issues/issue-230/plan-1-extra-object-report.json`
- `docs/verification/issues/issue-230/plan-1-mismatched-object-report.json`
- `docs/verification/issues/issue-230/plan-1-minimum-count-failure-output.json`
- `docs/verification/issues/issue-230/plan-1-provider-pharmacy-failure-output.json`
- `docs/verification/issues/issue-230/plan-1-nurse-station-failure-output.json`
- `docs/verification/issues/issue-230/plan-1-legacy-label-failure-output.json`
- `docs/verification/issues/issue-230/plan-1-legacy-fixture-rejection-output.json`
- `docs/verification/issues/issue-230/plan-1-gap-report.md`
- `docs/verification/issues/issue-230/plans-2-through-5-unchanged-output.json`
- `docs/verification/issues/issue-230/test-output/shared.txt`
- `docs/verification/issues/issue-230/test-output/no-phi.txt`
- `docs/verification/issues/issue-230/test-output/docs-gate.txt`

## Commands Run

- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --allow-current-failure --issue 230`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- `npm --workspace packages/shared test` -> PASS (539 passed, 0 failed).
- `node scripts/check-no-phi-fields.mjs` -> PASS (`No PHI-like fields found.`).
- `node scripts/check-plan-1-visual-parity.mjs --allow-current-failure --issue 230` -> PASS in allowed current-failure mode; recorded 51 current parity failures.
- `node scripts/check-docs-contracts.mjs` -> PASS (`Docs and contract guardrails pass.`).

## Evidence Artifacts

- `plan-1-source-visible-inventory.json`
- `plan-1-current-fixture-inventory.json`
- `plan-1-missing-object-report.json`
- `plan-1-extra-object-report.json`
- `plan-1-mismatched-object-report.json`
- `plan-1-minimum-count-failure-output.json`
- `plan-1-provider-pharmacy-failure-output.json`
- `plan-1-nurse-station-failure-output.json`
- `plan-1-legacy-label-failure-output.json`
- `plan-1-legacy-fixture-rejection-output.json`
- `plan-1-gap-report.md`
- `plans-2-through-5-unchanged-output.json`
- `command-output-map.json`
- `first-failure.txt`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- This issue does not yet edit Plan 1 fixture geometry.
- The gap report intentionally documents a pre-repair mismatch state and does not claim completeness.
- No door/path/station/hallway rebuild is performed in this issue.

## Non-PHI Confirmation

No PHI fields, patient identities, EHR integration, DOCX payload, clinical safety certification, or measured
CAD-level claims were added.

## Next Recommended Issue

- Issue 231: Plan 1 Coordinate Frame and Layout Scaffold.

## GO / NO-GO for Issue 231

- GO: Issue 230 successfully characterizes the current fixture gaps; proceed to Issue 231 scaffold repair.
