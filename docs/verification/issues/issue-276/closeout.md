# Issue 276 Closeout - Plan 1 Demo Seed Pack

## Summary
Issue 276 adds the deterministic Plan 1 demo seed pack and read-only demo seed panel for the normal guided workflow. The pack covers typical, slammed, walking-heavy, trauma-heavy, and comparison demo paths using existing synthetic Plan 1 profiles and deterministic numeric seeds.

## Files changed
- `packages/shared/fixtures/demo/plan-1/plan-1-demo-seed-pack.json`
- `packages/shared/src/simulation/plan1DemoSeedPack.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/plan-1-demo-seed-pack.test.mjs`
- `apps/web/src/features/demo/Plan1DemoGuide.tsx`
- `apps/web/src/features/demo/Plan1DemoSeedPanel.tsx`
- `apps/web/src/features/demo/Plan1DemoSeedPanel.test.tsx`
- `apps/web/src/styles.css`
- `scripts/check-plan-1-demo-readiness.mjs`
- `docs/verification/plan-1-demo-readiness-manifest.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-276/*`

## Commands run
See `docs/verification/issues/issue-276/commands.txt` and `docs/verification/issues/issue-276/command-output-map.json`.

## Tests passed/failed
Passed:
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 276`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 276`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 276`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 276`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 276`
- `node scripts/check-plan-1-demo-readiness.mjs --stage demo-seed-pack --allow-partial --issue 276`

Failed:
- Initial local build attempt found TypeScript `unknown` numeric narrowing in the new seed validator. Fixed before final evidence.

## Evidence artifacts
- `first-failure.txt` captures the missing seed-pack failure.
- `demo-seed-pack-output.json`, `demo-seed-validation-output.json`, `demo-seed-reproducibility-output.json`, and `expected-signals-output.json` prove deterministic seed coverage.
- `demo-seed-panel-output.json` and `screenshots/plan-1-demo-seed-panel.png` prove UI presence.
- Final gate outputs live under `test-output/`.

## Known limitations
- The seed panel is read-only proof UX; it does not load or execute seeds directly from the panel.
- The demo seed pack references existing Plan 1 synthetic profiles and deterministic seeds; it does not add new simulation behavior.

## Non-PHI confirmation
Non-PHI rules still pass. The seed pack uses synthetic profile IDs, deterministic numeric seeds, synthetic assumptions, and operational non-claims only. No PHI, EHR fields, real patient identity, real staff identity, employee IDs, hospital identifiers, diagnosis text, medication names, clinical notes, staffing guidance, optimizer behavior, or production deployment was introduced.

## Next Recommended Issue
Issue 277 - Exportable Demo Proof Bundle.

## GO / NO-GO for Issue 277
GO for Issue 277. Demo seeds created, expected signals verified, and the best seed path for demo is `demo-plan-1-comparison` because it ties the typical, slammed, walking-heavy, and trauma-heavy profiles into the comparison workflow.
