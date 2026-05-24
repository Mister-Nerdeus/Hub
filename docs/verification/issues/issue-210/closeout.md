# Issue 210 Closeout - Default Saved Plan Fixture Contract

## First-Failure / Current-Gap Evidence

Before this issue, default saved plans had source manifests and source mappings, but no wrapper
contract distinguished read-only default fixtures from user-created saved plan records.

## Bounded Implementation Summary

- Added a default saved plan fixture wrapper contract.
- Validated nested plans through `PlanContract`.
- Enforced `default-plan-` record IDs and `default-er-layout-plan-` nested plan IDs.
- Enforced `readOnly: true`, import status enums, required limitations, and wrapper no-PHI checks.
- Added optional source and mapping reference validation for tests and future fixture audits.

## Files Changed

- `packages/shared/src/default-plans/defaultSavedPlanFixtureContract.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/default-saved-plan-fixture-contract.test.mjs`
- `docs/contracts/default-saved-plan-import-contract.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-210/*`

## Commands Run

- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- Shared tests: passed, 489 tests.
- No-PHI gate: passed.
- Docs/contracts gate: passed.

## Evidence Artifacts

- `default-plan-fixture-contract-output.json`
- `default-plan-id-namespace-output.json`
- `no-phi-default-plan-wrapper-output.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/docs-gate.txt`

## TypeScript / Python Parity

TypeScript-only contract foundation. No Python API contract changed in this issue.

## Non-PHI Confirmation

Wrapper limitations and nested plan text are checked through existing operational runtime text guards
and the repository no-PHI scanner.

## Non-Claims

This issue does not import all five plans, seed a database, add UI, claim exact geometry, change
simulation, change pathfinding, change scoring, or change optimizer behavior.

## Known Limitations

- The wrapper validator checks source and mapping links only when reference sets are supplied.
- Structured default plan fixtures are added in Issues 211-215.

## Next Recommended Issue

Issue 211 - Convert ER Layout Plan 1 to Structured Default Plan Fixture.
