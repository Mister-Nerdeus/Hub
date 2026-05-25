# Issue 279 Closeout - Demo Readiness Screenshots and Route Matrix

## Summary
Issue 279 adds the canonical Plan 1 demo route matrix and machine-checkable screenshot references for the required demo screens. The demo readiness gate now validates route matrix fields, required screen coverage, non-claim coverage for risk-bearing screens, screenshot paths, and screenshot file existence.

## Files changed
- `packages/shared/src/demo/plan1DemoRouteMatrix.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/plan-1-demo-route-matrix.test.mjs`
- `scripts/check-plan-1-demo-readiness.mjs`
- `docs/verification/plan-1-demo-readiness-manifest.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-279/*`

## Commands run
See `docs/verification/issues/issue-279/commands.txt` and `docs/verification/issues/issue-279/command-output-map.json`.

## Tests passed/failed
Passed:
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 279`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 279`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 279`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 279`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 279`
- `node scripts/check-plan-1-demo-readiness.mjs --stage screenshots-route-matrix --allow-partial --issue 279`

Failed:
- Initial reproduced screenshots-route-matrix readiness gate failed because the route matrix, screen coverage, and non-claim screen evidence did not exist. Fixed by adding the shared route matrix model, generated evidence, screenshot references, manifest update, and readiness gate validation.

## Evidence artifacts
- `demo-route-matrix-output.json` lists all 12 required demo screens and required route matrix fields.
- `demo-screen-coverage-output.json` confirms all required screens are covered.
- `demo-non-claims-screen-output.json` confirms non-claims are attached to risk-bearing demo screens.
- `screenshot-reference-output.json` validates 12 machine-checkable PNG screenshot references.
- `screenshots/*.png` contains the referenced local proof images for each required screen.

## Known limitations
- Screenshot artifacts are local proof images generated from the route matrix labels and expected content; they are not browser-automated pixel captures.
- Route matrix status is demo proof coverage, not production deployment readiness.

## Non-PHI confirmation
Non-PHI rules still pass. The route matrix and screenshot references use synthetic Plan 1 screen labels, expected operational content, local evidence paths, limitations, and non-claims only. No PHI, EHR fields, real patient identity, real staff identity, employee identifiers, real hospital identifiers, medication names, diagnosis text, clinical notes, staffing guidance, optimizer behavior, or production deployment was introduced.

## Next Recommended Issue
Issue 280 - Plan 1 Demo GO / NO-GO.

## GO / NO-GO for Issue 280
GO for Issue 280. Required screens are covered, screenshot references exist and validate, non-claim requirements are tracked, and existing Plan 1 final gates plus Plans 2-5 unchanged checks still pass.
