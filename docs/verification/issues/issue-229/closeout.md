# Issue 229 Closeout - Plan 1 Source Truth Contract and Visual Parity Gate

## Summary

Issue 229 introduces a machine-checkable Plan 1 source-truth contract and validator evidence so visual parity claims can be made only against an explicit, required-list baseline. No Plan 1 fixture geometry or object set was edited in this issue.
The accumulating visual parity gate now exists and records the current old-fixture failure under `--allow-current-failure`.

## Files Changed

- `docs/contracts/plan-1-visual-parity-contract.md`
- `docs/project/plan-1-visual-parity-status.md`
- `packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json`
- `packages/shared/src/default-plans/planVisualParitySourceTruth.ts`
- `packages/shared/src/default-plans/planVisualParityAudit.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/plan-1-source-truth-contract.test.mjs`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/verification/issues/issue-229/commands.txt`
- `docs/verification/issues/issue-229/command-output-map.json`
- `docs/verification/issues/issue-229/first-failure.txt`
- `docs/verification/issues/issue-229/plan-1-source-truth-contract-output.json`
- `docs/verification/issues/issue-229/plan-1-source-truth-validation-output.json`
- `docs/verification/issues/issue-229/plan-1-current-object-counts.json`
- `docs/verification/issues/issue-229/plan-1-legacy-fixture-rejection-output.json`
- `docs/verification/issues/issue-229/plan-1-required-visible-labels.md`
- `docs/verification/issues/issue-229/plans-2-through-5-unchanged-output.json`
- `docs/verification/issues/issue-229/known-gaps.md`
- `docs/verification/issues/issue-229/follow-up-issues.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json` (updated)

## Commands Run

- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --allow-current-failure --issue 229`

## Tests Passed / Failed

- Shared tests: passed, 539 tests.
- no-PHI gate: passed.
- Docs/contracts gate: passed after visual parity gate output was captured.
- Plan 1 visual parity gate: passed in `--allow-current-failure` mode while recording current fixture failures.

## Evidence Artifacts

- `docs/verification/issues/issue-229/first-failure.txt`
- `docs/verification/issues/issue-229/plan-1-source-truth-contract-output.json`
- `docs/verification/issues/issue-229/plan-1-source-truth-validation-output.json`
- `docs/verification/issues/issue-229/plan-1-current-object-counts.json`
- `docs/verification/issues/issue-229/plan-1-legacy-fixture-rejection-output.json`
- `docs/verification/issues/issue-229/plan-1-required-visible-labels.md`
- `docs/verification/issues/issue-229/plans-2-through-5-unchanged-output.json`
- `docs/verification/issues/issue-229/known-gaps.md`
- `docs/verification/issues/issue-229/follow-up-issues.md`
- `docs/verification/issues/issue-229/command-output-map.json`
- `docs/verification/issues/issue-229/commands.txt`
- `docs/verification/issues/issue-229/test-output/shared.txt`
- `docs/verification/issues/issue-229/test-output/no-phi.txt`
- `docs/verification/issues/issue-229/test-output/docs-gate.txt`
- `docs/verification/issues/issue-229/test-output/plan-1-visual-parity-gate.txt`

## Known Limitations

- This issue does not change Plan 1 fixture geometry.
- The source-truth contract is currently `pending` for all objects and therefore does not claim completion.
- Door/access and hallway minimums are represented in contract but not yet realized in Plan 1 geometry.
- Current Plan 1 room count is 8; required minimum room count is 23.
- Source-image ambiguity remains for grey unlabeled blocks; they are recorded as required annotation coverage until a later issue represents or defers them with a reason.
- Legacy labels currently present are `room-01`, `space-07`, and `station-provider-pharmacy`.

## Non-PHI Confirmation

No PHI content was introduced. Fields remain synthetic and validation gates passed for no-PHI checks before docs-gate correction.

## Next Recommended Issue

Start Issue 230 (Plan 1 Current Fixture Gap Report) using this source-truth contract and existing fixture references to enumerate missing/misplaced/mismatched objects.

## GO / NO-GO for Issue 230

- GO for Issue 230: Yes (contract and validator are in place).
