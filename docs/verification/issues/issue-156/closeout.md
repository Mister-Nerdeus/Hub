# Issue 156 Closeout

## Summary
- Added a room-only drag move helper that updates `xFeet` and `yFeet` through the layout snap engine.
- Added a `moveRoom` reducer action that sets `isDirty` and preserves width, height, metadata, doors, path-adjacent data, and non-room geometry.
- Wired `RoomShape` pointer movement to dispatch snapped room moves while leaving all non-room objects non-draggable.

## Files changed
- `apps/web/src/features/layout-editor/roomDragMove.ts`
- `apps/web/src/features/layout-editor/roomDragMove.test.ts`
- `apps/web/src/features/layout-editor/layoutSnapEngine.ts`
- `apps/web/src/features/layout-editor/layoutSnapEngine.test.ts`
- `apps/web/src/features/layout-editor/layoutEditorReducer.ts`
- `apps/web/src/features/layout-editor/layoutEditorReducer.test.ts`
- `apps/web/src/features/layout-editor/RoomShape.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `docs/verification/issues/issue-156/commands.txt`
- `docs/verification/issues/issue-156/command-output-map.json`
- `docs/verification/issues/issue-156/screenshots/room-drag-move-proof.png`
- `docs/verification/issues/issue-156/test-output/web.txt`
- `docs/verification/issues/issue-156/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- Headless Edge DevTools room drag screenshot capture against a temporary local Vite dev server.

## Tests passed/failed
- Failed before fix: no room drag-move helper existed.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Passed: screenshot capture for `room-drag-move-proof.png`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-156/commands.txt`
- `docs/verification/issues/issue-156/command-output-map.json`
- `docs/verification/issues/issue-156/screenshots/room-drag-move-proof.png`
- `docs/verification/issues/issue-156/test-output/web.txt`

## Known limitations
- Doors and any future path graph are not synchronized with room movement in this issue.
- No resize handles, collision validation, station/hallway/zone dragging, persistence, path sync, save/load, or simulation rerun behavior was added.

## Next Recommended Issue
- Continue with the next scoped layout-editor issue after documenting the unresolved door/path graph synchronization limitation.

## Non-PHI Confirmation
- Room movement uses synthetic proof layout IDs and feet-based geometry only.
- No real identity, diagnosis field, note field, EHR integration, staffing-certification wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
