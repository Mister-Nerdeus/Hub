# Issue 213 Closeout - Convert ER Layout Plan 3 to Structured Default Plan Fixture

## First-Failure / Current-Gap Evidence

Before this issue, Plan 3 had a manifest entry and mapping skeleton but no structured default plan
wrapper or documented differences from Plans 1-2.

## Bounded Implementation Summary

- Added `default-er-layout-plan-3.json` as a read-only default saved plan fixture.
- Expanded Plan 3 source mapping with concrete object targets and coded deferred labels.
- Added tests for wrapper validation, mapping target resolution, and differences from Plans 1-2.
- Documented Plan 3 object counts and approximation limits.

## Files Changed

- `packages/shared/fixtures/default-plans/default-er-layout-plan-3.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-3.json`
- `packages/shared/tests/default-er-layout-plan-3.test.mjs`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-213/*`

## Commands Run

- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- Shared tests: passed, 498 tests.
- No-PHI gate: passed.
- Docs/contracts gate: passed.

## Evidence Artifacts

- `plan-3-source-mapping-output.json`
- `plan-3-default-fixture-output.json`
- `plan-3-difference-notes.md`
- `plan-3-object-count-summary.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/docs-gate.txt`

## TypeScript / Python Parity

TypeScript fixture/import foundation only. No Python API contract changed in this issue.

## Non-PHI Confirmation

Fixture labels, mapping labels, limitations, and nested plan text are covered by runtime guards and
the repository no-PHI scanner.

## Non-Claims

This issue does not claim exact geometry, certify layout safety, add UI, seed a database, change
simulation, change pathfinding, change scoring, or change optimizer behavior.

## Known Limitations

- The source DOCX is represented by manifest reference only; no binary source content is embedded.
- Path nodes and path edges are validated placeholders for fixture/render proof, not walking truth.
- Manual coordinate approximation remains subject to later visual parity review.

## Next Recommended Issue

Issue 214 - Convert ER Layout Plan 4 to Structured Default Plan Fixture.
