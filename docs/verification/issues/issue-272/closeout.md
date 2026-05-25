# Issue 272 Closeout

## Summary

Added the Plan 1 guided demo workflow to the normal app shell. The guide shows the current step, next recommended step, Plan 1 readiness badge, visible non-claims, limitations, and links into the Floorplans, Editor, Assignments, Scenarios, deterministic dry-run, scenario comparison, and proof report flow without embedding developer evidence.

## Files Changed

- apps/web/src/features/demo/Plan1DemoGuide.tsx
- apps/web/src/features/demo/Plan1DemoGuide.test.tsx
- apps/web/src/features/demo/plan1DemoWorkflowViewModel.ts
- apps/web/src/features/demo/plan1DemoWorkflowViewModel.test.ts
- apps/web/src/App.tsx
- apps/web/src/styles.css
- apps/web/scripts/run-web-tests.mjs
- apps/web/src/features/scenarios/Plan1ScenarioComparisonPanel.test.tsx
- docs/verification/plan-1-demo-readiness-manifest.json
- docs/verification/ISSUE_EVIDENCE_INDEX.json
- docs/verification/issues/issue-272/

## Commands Run

- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs
- node scripts/check-docs-contracts.mjs
- node scripts/check-plan-1-visual-parity.mjs --stage final --issue 272
- node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 272
- node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 272
- node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 272
- node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 272
- node scripts/check-plan-1-demo-readiness.mjs --stage guided-workflow --allow-partial --issue 272

## Tests Passed

- Shared tests passed.
- Web tests passed, including `.test.tsx` discovery.
- Web build passed.
- No-PHI, docs, Plan 1 final gates, Plans 2-5 unchanged, and guided-workflow demo readiness gate passed.

## Evidence Artifacts

- docs/verification/issues/issue-272/first-failure.txt
- docs/verification/issues/issue-272/demo-workflow-view-model-output.json
- docs/verification/issues/issue-272/demo-guide-ui-output.json
- docs/verification/issues/issue-272/demo-step-coverage-output.json
- docs/verification/issues/issue-272/demo-non-claims-banner-output.json
- docs/verification/issues/issue-272/developer-evidence-separation-output.json
- docs/verification/issues/issue-272/screenshots/plan-1-demo-guide.png
- docs/verification/issues/issue-272/test-output/

## Known Limitations

The guide links simulation summary and proof report anchors inside the Scenarios surface. Dedicated proof bundle export and route matrix validation are scheduled for later issues in this batch.

## Next Recommended Issue

GO for Issue 273.

## Non-PHI Confirmation

Non-PHI rules still pass. The guided demo uses synthetic operational language only and does not add PHI, EHR fields, real identity data, optimizer behavior, or clinical/staffing claims.
