# Issue 235 Closeout - Plan 1 Path Node and Path Edge Graph Rebuild

## Summary

Issue 235 rebuilds the Plan 1 operational path graph around the repaired rooms, door/access points, nurse stations, provider/pharmacy zone, EMS entry, and hallway network. Edge lengths are approximate and feet-based.

## Files Changed

- `packages/shared/fixtures/default-plans/default-er-layout-plan-1.json`
- `packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json`
- `packages/shared/tests/plan-1-path-graph.test.mjs`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-235/*`

## Commands Run

- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 235`
- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- PASS: `npm --workspace packages/shared test` completed with 551 passing tests and 0 failures.
- PASS: `node scripts/check-no-phi-fields.mjs` found no PHI-like fields.
- PASS: `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 235` had no required Issue 235 path graph stage failures. The remaining grey-block annotation gap is expected for later provenance/deferred handling.
- PASS: `node scripts/check-docs-contracts.mjs` passed after Issue 235 evidence artifacts were present.

## Evidence Artifacts

- `first-failure.txt`
- `plan-1-path-node-output.json`
- `plan-1-path-edge-output.json`
- `plan-1-connectivity-output.json`
- `plan-1-path-coverage-output.json`
- `plan-1-unreachable-node-output.json`
- `plan-1-path-known-approximations.md`
- `plans-2-through-5-unchanged-output.json`
- `test-output/shared.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- Path lengths are approximate operational links, not measured walking truth.
- Walking baseline is regenerated only for deterministic compatibility; Issue 236 performs the dedicated baseline rebuild and route group review.
- Grey unlabeled source blocks remain pending/deferred for later provenance handling.

## Non-PHI Confirmation

No PHI, patient identity, EHR integration, DOCX/source image exposure, clinical safety certification language, optimizer behavior, scoring, or simulation behavior was added.

## GO / NO-GO for Issue 236

- GO: required operational path nodes are connected through the hallway graph.

## Next Recommended Issue

- Issue 236: rebuild route preview groups and walking baseline from the repaired path graph.
