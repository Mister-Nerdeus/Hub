# Issue 233 Closeout - Plan 1 Zones, Hallways, Provider/Pharmacy, and Nurse Stations

## Summary

Issue 233 represents the source-visible Plan 1 operational areas: two nurse stations, Provider Pharmacy Area as a support zone, required hallway segments, and required room-cluster zones. Geometry is approximate and feet-based.

## Files Changed

- `packages/shared/fixtures/default-plans/default-er-layout-plan-1.json`
- `packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json`
- `packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-1.json`
- `packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json`
- `packages/shared/tests/plan-1-operational-areas.test.mjs`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-233/*`

## Commands Run

- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 233`
- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- PASS: `npm --workspace packages/shared test` completed with 545 passing tests and 0 failures.
- PASS: `node scripts/check-no-phi-fields.mjs` found no PHI-like fields.
- PASS: `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 233` had no required Issue 233 operational-area stage failures. Remaining door/access and grey-block gaps are expected for later issues.
- PASS: `node scripts/check-docs-contracts.mjs` passed after Issue 233 evidence artifacts were present.

## Evidence Artifacts

- `first-failure.txt`
- `plan-1-zone-geometry-output.json`
- `plan-1-hallway-geometry-output.json`
- `plan-1-station-geometry-output.json`
- `plan-1-provider-pharmacy-output.json`
- `plan-1-provider-not-station-output.json`
- `plan-1-zone-known-approximations.md`
- `plans-2-through-5-unchanged-output.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- Door/access detail remains for Issue 234.
- Path graph topology remains provisional until Issue 235.
- Walking baseline remains a deterministic compatibility rebuild until Issue 236.

## Non-PHI Confirmation

No PHI, patient identity, EHR integration, DOCX/source image exposure, clinical safety certification language, optimizer behavior, scoring, or simulation behavior was added.

## GO / NO-GO for Issue 234

- GO: required Plan 1 zones, hallways, provider/pharmacy support zone, and two nurse stations are represented.

## Next Recommended Issue

- Issue 234: add door and access-point coverage for required rooms and source-visible access ovals.
