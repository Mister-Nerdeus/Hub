# Issue 231 Closeout - Plan 1 Coordinate Frame and Layout Scaffold

## Summary

Issue 231 added a Plan 1 coordinate-frame scaffold to the fixture before detailed room rebuild work.
The Plan 1 zone scaffold now includes the required source-aligned workspace regions and validates a source-sized approximate frame envelope in feet.
No room/zone final topology is being finalized in this issue beyond scaffolding.

## Files Changed

- `packages/shared/fixtures/default-plans/default-er-layout-plan-1.json`
- `packages/shared/tests/default-plan-fixtures.test.mjs`
- `packages/shared/tests/plan-1-visual-parity-gap.test.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-231/commands.txt`
- `docs/verification/issues/issue-231/command-output-map.json`
- `docs/verification/issues/issue-231/first-failure.txt`
- `docs/verification/issues/issue-231/plan-1-coordinate-frame-output.json`
- `docs/verification/issues/issue-231/plan-1-scaffold-region-output.json`
- `docs/verification/issues/issue-231/plan-1-before-object-counts.json`
- `docs/verification/issues/issue-231/plan-1-after-scaffold-counts.json`
- `docs/verification/issues/issue-231/plan-1-partial-parity-gate-output.json`
- `docs/verification/issues/issue-231/plan-1-legacy-fixture-rejection-output.json`
- `docs/verification/issues/issue-231/plans-2-through-5-unchanged-output.json`
- `docs/verification/issues/issue-231/test-output/shared.txt`
- `docs/verification/issues/issue-231/test-output/no-phi.txt`
- `docs/verification/issues/issue-231/test-output/plan-1-visual-parity-gate.txt`
- `docs/verification/issues/issue-231/test-output/docs-gate.txt`

## Commands Run

- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 231`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- `npm --workspace packages/shared test` -> **PASS** (539 passed, 0 failed).
- `node scripts/check-no-phi-fields.mjs` -> **PASS** (`No PHI-like fields found.`).
- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 231` -> **PASS** in allowed partial mode; records remaining room/hallway/door gaps.
- `node scripts/check-docs-contracts.mjs` -> **PASS** (`Docs and contract guardrails pass.`).

## Evidence Artifacts

- `plan-1-coordinate-frame-output.json`
- `plan-1-scaffold-region-output.json`
- `plan-1-before-object-counts.json`
- `plan-1-after-scaffold-counts.json`
- `plan-1-partial-parity-gate-output.json`
- `plan-1-legacy-fixture-rejection-output.json`
- `plans-2-through-5-unchanged-output.json`
- `first-failure.txt`
- `command-output-map.json`
- `commands.txt`
- `closeout.md`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- This issue only adds high-level scaffold regions and frame checks.
- Room rebuild details, hallways/stations/path coverage, doors, and routes are deferred to later issues (232+).
- Region `region-main-hallways` remains deferred/legacy in source-truth mapping references until source mapping/provenance repair in Issue 237.

## Non-PHI Confirmation

No PHI fields, patient identity, EHR integrations, DOCX payloads, clinical safety language, or CAD-measurement claims were added.

## Next Recommended Issue

- Issue 232: Plan 1 Room and Patient-Area Geometry Rebuild.

## GO / NO-GO for Issue 232

- GO: scaffold and coordinate frame evidence captured; proceed to room geometry rebuild.
