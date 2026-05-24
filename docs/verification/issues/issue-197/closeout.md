# Issue 197 Closeout

## Summary

Expanded runtime no-PHI text guard coverage for synthetic birth-date identifier wording, government identifier wording, contact/location/insurance wording, and visit/encounter/chart/export/lab/discharge identifier wording. TypeScript and Python rule sets now use aligned deterministic categories, and rejection messages keep using `NO_PHI_RUNTIME_REJECTION` without echoing rejected values.

## First-Failure Evidence

`first-failure.txt` shows the pre-change guard allowed synthetic birth-date, government identifier, contact/location, and encounter identifier text.

## Bounded Implementation Summary

- Extended TypeScript runtime text guard rules.
- Extended Python runtime text guard rules with matching categories.
- Added TypeScript and Python negative tests for the expanded categories.
- Added positive tests for operational labels.
- Updated the non-PHI policy to document the expanded runtime boundary.
- Indexed Issue 197 evidence artifacts.

## Files Changed

- `packages/shared/src/no-phi/runtimeTextGuard.ts`
- `packages/shared/tests/no-phi-runtime-text.test.mjs`
- `apps/api/app/contracts.py`
- `apps/api/tests/contracts/test_no_phi_runtime_text.py`
- `docs/compliance/non-phi-policy.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-197/`

## Commands Run

See `commands.txt`.

## Tests Passed

- `npm --workspace packages/shared test`
- `cd apps/api && python -m pytest`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/verify-local.mjs`

## Tests Failed

- Initial `npm --workspace packages/shared test` failed after the first implementation because generic export wording was too broad and rejected existing operational export bundle proof labels. The guard was narrowed to identifier/workflow export wording and the shared test suite passed on rerun.
- Initial `node scripts/verify-local.mjs` failed at the embedded docs gate before the Issue 197 docs-gate artifact existed and before the command-output map was tightened. The docs artifact and command-output map were fixed, then `verify-local` passed on rerun.

## Evidence Artifacts

- `docs/verification/issues/issue-197/first-failure.txt`
- `docs/verification/issues/issue-197/no-phi-guard-expanded-output.json`
- `docs/verification/issues/issue-197/rejected-identifier-text-output.json`
- `docs/verification/issues/issue-197/allowed-operational-labels-output.json`
- `docs/verification/issues/issue-197/test-output/shared.txt`
- `docs/verification/issues/issue-197/test-output/api.txt`
- `docs/verification/issues/issue-197/test-output/no-phi.txt`
- `docs/verification/issues/issue-197/test-output/docs-gate.txt`
- `docs/verification/issues/issue-197/test-output/verify-local.txt`

## TypeScript/Python Parity

Confirmed by matching runtime guard tests and aligned rule categories in TypeScript and Python.

## Non-PHI Confirmation

Runtime rejection messages include `NO_PHI_RUNTIME_REJECTION` and the tests assert rejected values are not echoed. Static no-PHI scanning passed.

## Non-Claims

- Does not guarantee regulatory compliance.
- Does not detect every possible identity string.
- Does not permit PHI.
- Does not add simulation, optimizer, pathfinding, API persistence, or deployment behavior.

## Known Limitations

- Guard coverage remains deterministic and category-based, not exhaustive identity detection.
- Existing operational export bundle labels remain allowed; export wording is rejected only in identifier/workflow contexts.

## Next Recommended Issue

Issue 198 - ER Layout Metadata Architecture Contract.
