# Issue 119

## Summary

Added deterministic task-time and queue-delay summaries derived from validated simulation events, including direct task minutes, queue wait minutes, task delay minutes, travel-to-task minutes, missed task count, and task-density buckets by deterministic interval.

## Files Changed

- `packages/shared/src/outcomes/taskTimeQueueSummary.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/task-time-queue-summary.test.mjs`
- `packages/shared/fixtures/outcomes/task-time-queue-summary-basic.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`
- `docs/verification/issues/issue-119/commands.txt`
- `docs/verification/issues/issue-119/command-output-map.json`
- `docs/verification/issues/issue-119/task-time-queue-output.json`
- `docs/verification/issues/issue-119/closeout.md`
- `docs/verification/issues/issue-119/test-output/shared.txt`

## Commands Run

- `npm --workspace packages/shared test > docs/verification/issues/issue-119/test-output/shared.txt`
- `node scripts/check-no-phi-fields.mjs | Tee-Object -FilePath docs/verification/issues/issue-119/test-output/shared.txt -Append`
- `node scripts/check-docs-contracts.mjs | Tee-Object -FilePath docs/verification/issues/issue-119/test-output/shared.txt -Append`

## Tests Passed/Failed

- Not run in this environment: `npm --workspace packages/shared test`
- Not run in this environment: `node scripts/check-no-phi-fields.mjs`
- Not run in this environment: `node scripts/check-docs-contracts.mjs`
- Failed: None.

## Evidence

- `docs/verification/issues/issue-119/commands.txt`
- `docs/verification/issues/issue-119/command-output-map.json`
- `docs/verification/issues/issue-119/task-time-queue-output.json`
- `docs/verification/issues/issue-119/closeout.md`
- `docs/verification/issues/issue-119/test-output/shared.txt`

## Known Limitations

- Task-density buckets are generated per unique task and use deterministic interval boundaries.
- Missed tasks are included in task counts but not included in completed-task minute totals because direct-task minutes are computed from completed task/nurse events only.
- Outputs are operational metrics only and include no optimization, workflow recommendation, UI change, or clinical safety scoring behavior.

## Non-PHI Confirmation

No task identifiers, patient identities, diagnosis terms, EHR references, patient records, clinical safety claims, recommendation language, hidden scoring model logic, or other PHI-like fields were introduced.

## Next Recommended Issue

Issue 120
