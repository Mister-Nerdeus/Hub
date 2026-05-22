# Issue 036 Closeout

## Summary

Added deterministic nurse burden scoring that uses room workload scoring and assignment validation, with explicit zero placeholders for task, walking, break coverage, and interruption systems not yet built.

## Files Changed

- `packages/shared/src/scoring/nurseBurdenScore.ts`
- `packages/shared/src/contracts.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/nurseBurdenScore.test.mjs`
- `packages/shared/fixtures/scoring/nurse-burden-cases.json`
- `docs/contracts/nurse-burden-scoring-contract.md`
- `docs/verification/issues/issue-036/*`

## Commands Run

See `docs/verification/issues/issue-036/commands.txt`.

## Tests Passed/Failed

Nurse burden scoring tests passed, including same occupied-room count with different acuity producing different burden. Full local verification is recorded in the batch commands.

## Evidence

- `scoring-output.json`
- `commands.txt`

## Known Limitations

Active task minutes, walking minutes, break coverage penalty, and interruption penalty are explicit zero placeholders until later systems exist.

## Non-PHI Confirmation

Scores use synthetic room loads, nurse IDs, and warnings only.

## Next Recommended Issue

Issue 037.
