# Issue 211 Closeout - Convert ER Layout Plan 1 to Structured Default Plan Fixture

## First-Failure / Current-Gap Evidence

Before this issue, Plan 1 had only manifest and mapping skeleton coverage. No structured default
plan wrapper existed for `default-er-layout-plan-1`.

## Bounded Implementation Summary

- Added `default-er-layout-plan-1.json` as a read-only default saved plan fixture.
- Expanded Plan 1 source mapping to concrete target objects and coded deferred labels.
- Added validation that the wrapper, nested `PlanContract`, source mapping, and mapped targets align.
- Documented Plan 1 approximation limits and object counts.

## Files Changed

- `packages/shared/fixtures/default-plans/default-er-layout-plan-1.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-1.json`
- `packages/shared/tests/default-er-layout-plan-1.test.mjs`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-211/*`

## Commands Run

- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- Shared tests: passed, 492 tests.
- No-PHI gate: passed.
- Docs/contracts gate: passed.

## Evidence Artifacts

- `plan-1-source-mapping-output.json`
- `plan-1-default-fixture-output.json`
- `plan-1-known-approximations.md`
- `plan-1-object-count-summary.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/docs-gate.txt`

## TypeScript / Python Parity

TypeScript fixture/import foundation only. No Python API contract changed in this issue.

## Non-PHI Confirmation

Fixture labels, mapping labels, limitations, and nested plan text are covered by runtime guards and
the repository no-PHI scanner.

## Non-Claims

This issue does not import into a database, add UI, claim exact geometry, certify layout safety,
change simulation, change pathfinding, change scoring, or change optimizer behavior.

## Known Limitations

- The source DOCX is represented by manifest reference only; no binary source content is embedded.
- Path nodes and path edges are validated placeholders for fixture/render proof, not walking truth.
- Manual coordinate approximation remains subject to later visual parity review.

## Next Recommended Issue

Issue 212 - Convert ER Layout Plan 2 to Structured Default Plan Fixture.
