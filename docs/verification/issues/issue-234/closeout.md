# Issue 234 Closeout - Plan 1 Door and Access-Point Coverage

## Summary

Issue 234 adds deterministic Plan 1 door/access IDs and direct access coverage for every modeled patient/room area. Positions are approximate and feet-based.

## Files Changed

- `packages/shared/fixtures/default-plans/default-er-layout-plan-1.json`
- `packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json`
- `packages/shared/tests/plan-1-door-access.test.mjs`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-234/*`

## Commands Run

- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 234`
- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- PASS: `npm --workspace packages/shared test` completed with 548 passing tests and 0 failures.
- PASS: `node scripts/check-no-phi-fields.mjs` found no PHI-like fields.
- PASS: `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 234` had no required Issue 234 door/access stage failures. The remaining grey-block annotation gap is expected for later provenance/deferred handling.
- PASS: `node scripts/check-docs-contracts.mjs` passed after Issue 234 evidence artifacts were present.

## Evidence Artifacts

- `first-failure.txt`
- `plan-1-door-access-output.json`
- `plan-1-door-coverage-output.json`
- `plan-1-clustered-access-output.json`
- `plan-1-access-deferred-output.json`
- `plan-1-door-known-approximations.md`
- `plans-2-through-5-unchanged-output.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- Door positions are approximate visual/access markers, not measured door locations.
- Path graph topology remains provisional until Issue 235.
- Walking baseline remains a deterministic compatibility rebuild until Issue 236.

## Non-PHI Confirmation

No PHI, patient identity, EHR integration, DOCX/source image exposure, clinical safety certification language, optimizer behavior, scoring, or simulation behavior was added.

## GO / NO-GO for Issue 235

- GO: every required room has direct access coverage and source-truth access IDs are represented.

## Next Recommended Issue

- Issue 235: rebuild the path node and path edge graph around the repaired hallway/access network.
