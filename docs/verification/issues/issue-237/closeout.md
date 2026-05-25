# Issue 237 Closeout - Plan 1 Source Mapping and Conversion Provenance Repair

## Summary

Issue 237 repairs Plan 1 source mapping provenance so source-visible objects, manual approximations, generated graph objects, inferred objects, and deferred labels are explicitly distinguished. The mapping validates against the repaired Plan 1 fixture and covers all target-bearing source-truth objects.

## Files Changed

- `packages/shared/src/default-plans/sourceToPlanMappingContract.ts`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-1.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-2.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-3.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-4.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-5.json`
- `packages/shared/tests/default-plan-source-mapping.test.mjs`
- `packages/shared/tests/plan-1-source-mapping-provenance.test.mjs`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-237/*`

## Commands Run

- `node custom first-failure source mapping provenance audit`
- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 237`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- PASS: `npm --workspace packages/shared test` completed with 557 passing tests and 0 failures.
- PASS: `node scripts/check-no-phi-fields.mjs` found no PHI-like fields.
- PASS: `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 237` reported no required stage failures. The remaining partial parity item is the intentionally pending grey unlabeled block annotation.
- PASS: `node scripts/check-docs-contracts.mjs` after evidence artifacts were present.

## Evidence Artifacts

- `first-failure.txt`
- `plan-1-source-mapping-before.json`
- `plan-1-source-mapping-after.json`
- `plan-1-provenance-coverage-output.json`
- `plan-1-deferred-source-labels-output.json`
- `plan-1-mapping-validation-output.json`
- `plans-2-through-5-unchanged-output.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/docs-gate.txt`
- `test-output/plan-1-visual-parity-gate.txt`

## Known Limitations

- Grey unlabeled blocks remain deferred because they are visible but not operationally modeled yet.
- Generated doors, path nodes, and path edges are explicitly marked as generated or inferred, not source-visible truth.
- This issue does not introduce runtime image overlays, DOCX exposure, assignment, scoring, simulation, optimizer, reports, or production deployment.

## Non-PHI Confirmation

No PHI, patient identity, EHR integration, DOCX/source image exposure, clinical safety certification language, optimizer behavior, scoring, or simulation behavior was added.

## GO / NO-GO for Issue 238

- GO: Plan 1 mapping now validates with conversion provenance coverage, generated/inferred object honesty, and deferred source labels documented.

## Source-Visible Coverage Percentage

- Source-truth expected targets covered by mapping: 50/50 target-bearing objects, 100%.
- Total source-truth objects: 51, with 1 annotation pending/deferred separately.

## Deferred Labels

- Grey unlabeled blocks.
- Small unlabeled support marks.
- Legacy simplified Room 01.
- Legacy simplified Space 07.

## Generated / Inferred Object Counts

- `generated_required_for_graph`: 75.
- `conversion_inferred`: 1.

## Next Recommended Issue

- Issue 238: produce Plan 1 app render visual parity proof from JSON fixture rendering.
