# Issue 438 Closeout - Path Graph and Travel Blocking Rules

## Result
GO for Issue 439.

Storage and solid-wall semantics now flow through centralized path and walking eligibility rules. Storage is excluded from patient-care routing destinations and walking burden/spread calculations. Solid walls are blocked from route/path-node validation and cannot participate in room-door path-node creation.

## Files Changed
- `packages/shared/src/floorplans/walkingDistanceEligibility.ts`
- `packages/shared/src/floorplans/pathGraphValidation.ts`
- `packages/shared/src/floorplans/doorPathNodeGenerator.ts`
- `packages/shared/src/floorplans/pathSyncAudit.ts`
- `packages/shared/src/manual-assignment/walkingBurden.ts`
- `packages/shared/src/manual-assignment/manualAssignmentComparisonFixtures.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/path-graph-storage-solid-wall.test.mjs`
- `apps/web/src/features/layout-editor/pathNodeEditorViewModel.ts`
- `apps/web/src/features/layout-editor/__tests__/pathNodeStorageSolidWall.test.tsx`
- `apps/web/src/features/manual-assignment/walkingBurdenViewModel.ts`
- `apps/web/src/features/manual-assignment/__tests__/walkingBurdenViewModel.test.ts`
- `docs/project/path-graph-storage-solid-wall-rules.md`
- `scripts/check-room-type-semantics.mjs`
- `docs/verification/room-type-semantics-manifest.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-438/*`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-room-type-semantics.mjs --stage path-graph-blocking --allow-partial --issue 438`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 438`

## Tests Passed / Failed
- Passed: shared package tests.
- Passed: web tests.
- Passed: web production build.
- Passed: Issue 438 path-graph blocking gate.
- Passed: no-PHI scan.
- Passed: default plans 2 through 5 unchanged gate.
- Initial failures recorded in `first-failure.txt`: generated storage path references needed clearing in derived output, and a web test fixture needed literal `PlanContract` typing.

## Evidence Artifacts
- `path-eligibility-output.json`
- `solid-wall-no-path-node-output.json`
- `storage-no-patient-routing-output.json`
- `walking-distance-exclusion-output.json`
- `path-validation-negative-output.json`
- `scenario-readiness-only-output.txt`
- `no-full-simulation-output.txt`
- `no-unauthorized-fixture-mutation-output.txt`
- `manifest-update-output.json`
- `test-output/shared.txt`
- `test-output/web.txt`
- `test-output/web-build.txt`
- `test-output/room-type-semantics-gate.txt`

## Known Limitations
- This is path-eligibility and scoring-readiness only. It does not claim exact walking-route truth and does not execute scenarios.
- Existing canonical storage may retain physical fixture path metadata; it is excluded from patient-care route destinations and walking scoring.

## Non-PHI Confirmation
The no-PHI gate passed. This issue added no PHI, no EHR data, no real patient identity, no real nurse names, no employee IDs, no real hospital identifiers, no medication names, no diagnosis text, and no clinical notes.
