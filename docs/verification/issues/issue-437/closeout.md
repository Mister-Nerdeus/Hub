# Issue 437 Closeout - Add Object Menu Type-Specific Placement

## Summary
The Add Object path now creates explicit patient-care, storage, and solid-wall semantics at placement time.

## Result
GO for Issue 438.

The primary Add Object path now separates patient-care, storage, and solid-wall placement. Storage placement creates `storage` semantics immediately, solid-wall placement creates `solid_wall` semantics immediately, and both previews use the centralized gray room-type presentation rules.

## Files Changed
- `apps/web/src/features/layout-editor/addObjectMenuViewModel.ts`
- `apps/web/src/features/layout-editor/clickToPlaceObject.ts`
- `apps/web/src/features/layout-editor/ObjectPlacementPreview.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/layout-editor/addRoomTool.ts`
- `apps/web/src/features/layout-editor/__tests__/AddObjectMenu.test.tsx`
- `apps/web/src/features/layout-editor/__tests__/AddObjectMenuRoomTypes.test.tsx`
- `apps/web/src/features/layout-editor/__tests__/clickToPlaceObject.test.ts`
- `apps/web/src/features/layout-editor/__tests__/clickToPlaceStorageSolidWall.test.ts`
- `packages/shared/src/floorplans/addRoomContract.ts`
- `packages/shared/src/floorplans/layoutObjectCreation.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/layout-object-creation-storage-solid-wall.test.mjs`
- `scripts/check-room-type-semantics.mjs`
- `docs/verification/room-type-semantics-manifest.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-437/*`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-room-type-semantics.mjs --stage add-object-placement --allow-partial --issue 437`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 437`

## Tests Passed / Failed
- Passed: shared package tests.
- Passed: web tests.
- Passed: web production build.
- Passed: Issue 437 add-object placement gate.
- Passed: no-PHI scan.
- Passed: default plans 2 through 5 unchanged gate.
- Initial failure recorded in `first-failure.txt`: one stale web test still referenced the removed generic room placement id and was corrected.

## Evidence Artifacts
- `add-object-menu-before-output.json`
- `patient-care-room-placement-output.json`
- `storage-room-placement-output.json`
- `solid-wall-placement-output.json`
- `storage-preview-gray-output.json`
- `solid-wall-preview-gray-output.json`
- `solid-wall-no-door-node-output.json`
- `no-ambiguous-room-output.json`
- `manifest-update-output.json`
- `screenshots/add-object-type-specific-menu.png`
- `screenshots/storage-placement-preview.png`
- `screenshots/solid-wall-placement-preview.png`
- `test-output/shared.txt`
- `test-output/web.txt`
- `test-output/web-build.txt`
- `test-output/room-type-semantics-gate.txt`

## Known Limitations
- Screenshots are local generated evidence for the implemented semantic styling path; they are not manual visual approval.
- Path graph and travel-blocking behavior remains scheduled for Issue 438.

## Non-PHI Confirmation
The no-PHI gate passed. This issue added no PHI, no EHR data, no real patient identity, no real nurse names, no employee IDs, no real hospital identifiers, no medication names, no diagnosis text, and no clinical notes.

## Next Recommended Issue
Issue 438.
