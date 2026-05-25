# Issue 232 Closeout - Plan 1 Room and Patient-Area Geometry Rebuild

## Summary

Issue 232 replaces the old simplified Plan 1 room set with all source-truth required room and patient-area objects. Geometry is approximate and feet-based. Provisional door/path links are present only to keep existing local PlanContract and default-plan path gates valid before dedicated access and graph rebuild issues.

## Files Changed

- `packages/shared/fixtures/default-plans/default-er-layout-plan-1.json`
- `packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-1.json`
- `packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json`
- `packages/shared/tests/plan-1-room-geometry.test.mjs`
- `packages/shared/tests/default-plan-path-edge-coverage.test.mjs`
- `packages/shared/tests/default-plan-route-preview.test.mjs`
- `packages/shared/tests/path-metadata-travel-adapter.test.mjs`
- `packages/shared/tests/plan-1-source-truth-contract.test.mjs`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-232/*`

## Commands Run

- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 232`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- PASS: `npm --workspace packages/shared test` completed with 542 passing tests and 0 failures.
- PASS: `node scripts/check-no-phi-fields.mjs` found no PHI-like fields.
- PASS: `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 232` had no required Issue 232 room-stage failures. Remaining hallway, station, provider/pharmacy, and access gaps are expected for Issues 233-234.
- PASS: `node scripts/check-docs-contracts.mjs` passed after the closeout format and self-referential docs evidence were present.

## Evidence Artifacts

- `first-failure.txt`
- `plan-1-before-room-counts.json`
- `plan-1-after-room-counts.json`
- `plan-1-room-geometry-output.json`
- `plan-1-room-label-coverage-output.json`
- `plan-1-removed-old-labels-output.json`
- `plan-1-room-known-approximations.md`
- `plans-2-through-5-unchanged-output.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- Door/access detail remains provisional until Issue 234.
- Path graph topology remains provisional until Issue 235.
- Walking baseline remains a deterministic compatibility rebuild until Issue 236 reviews route groups.
- Provider/pharmacy and nurse station modeling remain for Issue 233.

## Non-PHI Confirmation

No PHI, patient identity, EHR integration, DOCX/source image exposure, clinical safety certification language, optimizer behavior, scoring, or simulation behavior was added.

## GO / NO-GO for Issue 233

- GO: required Plan 1 room IDs are represented and old simplified room IDs are removed.

## Next Recommended Issue

- Issue 233: add the required Plan 1 zones, hallways, provider/pharmacy support zone, and two visible nurse stations.
