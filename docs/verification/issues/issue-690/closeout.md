# Issue 690 Closeout

## Problem
Real Manual Assignment split-room browser workflow proof.

## Summary
- Local validation artifacts passed for this issue scope.

## Files Changed
- apps/web/src/App.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/SplitBayShape.tsx
- apps/web/src/features/layout-editor/layoutAssignmentOverlayViewModel.ts
- apps/web/src/features/manual-assignment/ManualAssignmentRoomList.tsx
- apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx
- apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx
- apps/web/src/features/manual-assignment/NurseBurdenTable.tsx
- apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts
- apps/web/src/features/manual-assignment/manualBurdenViewModel.ts
- packages/shared/src/floorplans/splitRoomAssignmentSemantics.ts
- packages/shared/fixtures/default-plans/default-er-layout-plan-1.json
- packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json
- package.json
- scripts/check-split-room-manual-assignment-browser.mjs
- docs/verification/split-room-closeout-hardening-manifest.json
- docs/verification/issues/issue-690/
- docs/verification/issues/issue-224/default-plan-walking-baselines-output.json
- docs/verification/issues/issue-232/plan-1-room-geometry-output.json
- docs/verification/issues/issue-234/plan-1-door-access-output.json
- docs/verification/issues/issue-236/plan-1-walking-baseline-after.json
- docs/verification/issues/issue-238/screenshots/plan-1-after-updated-render.html

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-split-room-manual-assignment-browser.mjs --stage user-flow --allow-partial --issue 690
- node scripts/check-split-room-manual-assignment-browser.mjs --stage child-room-4-assignment --allow-partial --issue 690
- node scripts/check-split-room-manual-assignment-browser.mjs --stage child-room-5-assignment --allow-partial --issue 690
- node scripts/check-split-room-manual-assignment-browser.mjs --stage parent-not-assignable --allow-partial --issue 690
- node scripts/check-split-room-manual-assignment-browser.mjs --stage assigned-counts --allow-partial --issue 690
- node scripts/check-split-room-manual-assignment-browser.mjs --stage child-burden-output --allow-partial --issue 690
- node scripts/check-split-room-manual-assignment-browser.mjs --stage editor-overlay-colors --allow-partial --issue 690
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-690
- docs/verification/split-room-closeout-hardening-manifest.json

## Known Limitations
- Browser proof uses the real editor and Manual Assignment routes with synthetic operational room-load data.
- The split room is saved before route transition so the remounted editor receives the same saved working-copy layout.

## Non-PHI Confirmation
- Non-PHI rules still pass.
