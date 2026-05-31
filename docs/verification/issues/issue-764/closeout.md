# Issue 764 Closeout

## Problem
Workspace UX Repair GO/NO-GO Audit

## Code Review
- Follow-up review found an additional floorplan-only simulation-readiness leak outside the original readiness summary: active floorplan state and shared workflow/version contracts still allowed `ready_for_simulation`, and some advanced/editor display copy still said "simulation-ready export".
- The follow-up removes the active floorplan simulation workflow state, removes the shared floorplan workflow/version simulation-ready status, changes visible copy to route/export readiness, and strengthens the Issue 754 validator so these surfaces are checked.

## Summary
- Local validator status: passed.
- Docker config/build status: passed.
- Branch remains within Milestone A UX repair scope; durable assignment foundation is still not started.

## Files Changed
- packages/shared/src/floorplans/floorplanReadinessContract.ts
- packages/shared/src/floorplans/activeFloorplanContract.ts
- packages/shared/src/floorplans/floorplanVersionContract.ts
- packages/shared/src/floorplans/operationalDemoSnapshot.ts
- packages/shared/src/floorplans/simulationReadyExportContract.ts
- packages/shared/tests/operational-demo-snapshot.test.mjs
- apps/web/src/features/floorplans/floorplanReadinessViewModel.ts
- apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx
- apps/web/src/features/floorplans/activeFloorplanState.ts
- apps/web/src/features/floorplans/activeFloorplanSelectorViewModel.ts
- apps/web/src/features/floorplans/RenderedPlanPreviewPanel.tsx
- apps/web/src/features/floorplans/renderedPlanPreviewViewModel.ts
- apps/web/src/features/floorplans/statusLabels.ts
- apps/web/src/features/floorplans/planStatusViewModel.ts
- apps/web/src/features/floorplans/planBuilderReviewFlowViewModel.ts
- apps/web/src/features/floorplans/planBuilderReviewFlowTypes.ts
- apps/web/src/features/floorplans/__tests__/operatorStatusLabels.test.ts
- apps/web/src/features/floorplans/__tests__/planBuilderReviewFlowViewModel.test.ts
- apps/web/src/features/floorplans/__tests__/planStatusViewModel.test.ts
- apps/web/src/features/layout-editor/PathSyncStatusPanel.tsx
- apps/web/src/features/layout-editor/PathSyncStatusPanel.test.tsx
- apps/web/src/features/layout-editor/SimulationReadyExportPanel.tsx
- apps/web/src/features/layout-editor/SimulationReadyExportPanel.test.tsx
- scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs
- docs/verification/issues/issue-764/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs --stage final --issue 754
- node scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs --stage final --issue 764
- node scripts/check-workspace-ux-repair-go-no-go.mjs --stage final --issue 764
- node scripts/check-milestone-a-no-overclaim.mjs --stage final --issue 764
- node scripts/check-no-phi-fields.mjs
- node scripts/check-docs-contracts.mjs
- docker compose config
- docker compose build web

## Tests Passed/Failed
- Passed: packages/shared tests.
- Passed: apps/web tests.
- Passed: apps/web build.
- Passed: strengthened floorplan simulation overclaim repair validator.
- Passed: workspace UX repair GO/NO-GO.
- Passed: milestone no-overclaim check.
- Passed: no-PHI scanner.
- Passed: Docker compose config and web image build.
- Failed: docs contracts, due to pre-existing broad evidence-index/closeout backlog outside this repair follow-up.

## Evidence Artifacts
- docs/verification/issues/issue-764/test-output/check-floorplan-simulation-readiness-overclaim-repair.txt
- docs/verification/issues/issue-764/test-output/check-workspace-ux-repair-go-no-go.txt
- docs/verification/issues/issue-764/test-output/check-milestone-a-no-overclaim.txt
- docs/verification/issues/issue-764/test-output/shared.txt
- docs/verification/issues/issue-764/test-output/web.txt
- docs/verification/issues/issue-764/test-output/web-build.txt
- docs/verification/issues/issue-764/test-output/docs-contracts.txt
- docs/verification/issues/issue-764/test-output/docker-compose-config-review.txt
- docs/verification/issues/issue-764/test-output/docker-compose-build-web-review.txt

## Known Limitations
- Scenario and simulation readiness remain intentionally blocked for later milestones.
- Underlying legacy route-export contract identifiers still use `simulationReadyExport*` names; this follow-up removed the floorplan-only workflow state and user-visible simulation-readiness copy without broad contract renaming outside this UX repair batch.
- `node scripts/check-docs-contracts.mjs` still fails on pre-existing evidence-index and closeout metadata gaps across historical issues; this repair does not attempt that repository-wide docs cleanup.

## Non-PHI Confirmation
- Non-PHI rules still pass. `node scripts/check-no-phi-fields.mjs` reported no PHI-like fields.

## Next Recommended Issue
- Durable assignment foundation may start in the next milestone only after preserving these repair gates; scoring, scenario simulation, optimizer, reports, and clinical claims remain out of scope for this repair branch.
