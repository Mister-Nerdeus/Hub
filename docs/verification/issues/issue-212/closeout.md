# Issue 212 Closeout - Convert ER Layout Plan 2 to Structured Default Plan Fixture

## First-Failure / Current-Gap Evidence

Before this issue, Plan 2 had a manifest entry and mapping skeleton but no structured default plan
wrapper or documented differences from Plan 1.

## Bounded Implementation Summary

- Added `default-er-layout-plan-2.json` as a read-only default saved plan fixture.
- Expanded Plan 2 source mapping with concrete object targets and coded deferred labels.
- Added tests for wrapper validation, mapping target resolution, and Plan 1 difference notes.
- Documented Plan 2 object counts and approximation limits.

## Files Changed

- `packages/shared/fixtures/default-plans/default-er-layout-plan-2.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-2.json`
- `packages/shared/tests/default-er-layout-plan-2.test.mjs`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-212/*`

## Commands Run

- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- Shared tests: passed, 495 tests.
- No-PHI gate: passed.
- Docs/contracts gate: passed.

## Evidence Artifacts

- `plan-2-source-mapping-output.json`
- `plan-2-default-fixture-output.json`
- `plan-2-difference-notes.md`
- `plan-2-object-count-summary.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/docs-gate.txt`

## TypeScript / Python Parity

TypeScript fixture/import foundation only. No Python API contract changed in this issue.

## Non-PHI Confirmation

Fixture labels, mapping labels, limitations, and nested plan text are covered by runtime guards and
the repository no-PHI scanner.

## Non-Claims

This issue does not add database seed data, add UI, claim exact geometry, certify layout safety,
change simulation, change pathfinding, change scoring, or change optimizer behavior.

## Known Limitations

- The source DOCX is represented by manifest reference only; no binary source content is embedded.
- Path nodes and path edges are validated placeholders for fixture/render proof, not walking truth.
- Manual coordinate approximation remains subject to later visual parity review.

## Next Recommended Issue

Issue 213 - Convert ER Layout Plan 3 to Structured Default Plan Fixture.
