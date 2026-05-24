# Issue 176 Closeout

## Summary
- Added selected-room inspector dimension editing for `xFeet`, `yFeet`, `widthFeet`, and `heightFeet`.
- Inspector edits snap in feet, enforce minimum room size, recalculate resize/door warnings, create deterministic audit entries, and mark metric deltas pending.
- Stored room metadata, doors, path graph, save/load behavior, and simulation outputs are not mutated or rerun.

## Files changed
- `apps/web/src/features/layout-editor/roomInspectorDimensionEdit.ts`
- `apps/web/src/features/layout-editor/roomInspectorDimensionEdit.test.ts`
- `apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx`
- `apps/web/src/features/layout-editor/layoutInspectorViewModel.ts`
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.css`
- `apps/web/src/features/layout-editor/layoutEditorReducer.ts`
- `apps/web/src/features/layout-editor/layoutEditorReducer.test.ts`
- `apps/web/src/features/layout-editor/layoutEditAuditTrail.ts`
- `apps/web/src/features/layout-editor/layoutEditAuditTrail.test.ts`
- `apps/web/src/features/layout-editor/layoutDeltaPreviewViewModel.ts`
- `apps/web/src/features/layout-editor/layoutDeltaPreviewViewModel.test.ts`
- `docs/verification/issues/issue-176/commands.txt`
- `docs/verification/issues/issue-176/command-output-map.json`
- `docs/verification/issues/issue-176/inspector-dimension-edit-output.json`
- `docs/verification/issues/issue-176/screenshots/inspector-dimension-edit-proof.png`
- `docs/verification/issues/issue-176/test-output/web.txt`
- `docs/verification/issues/issue-176/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `npx playwright screenshot --full-page http://127.0.0.1:5177/#layout-editor-stage-proof docs/verification/issues/issue-176/screenshots/inspector-dimension-edit-proof.png`

## Tests passed/failed
- Failed before fix: `npm --workspace apps/web test` failed because `roomInspectorDimensionEdit` did not exist.
- Failed during implementation: `npm --workspace apps/web run build` found a JSX computed-key narrowing issue in the inspector input handler.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-176/commands.txt`
- `docs/verification/issues/issue-176/command-output-map.json`
- `docs/verification/issues/issue-176/inspector-dimension-edit-output.json`
- `docs/verification/issues/issue-176/screenshots/inspector-dimension-edit-proof.png`
- `docs/verification/issues/issue-176/test-output/web.txt`

## Known limitations
- Inspector dimension editing applies only to selected rooms.
- Door geometry is not automatically mutated.
- Path sync, save/load behavior, station/hallway/zone editing, and simulation rerun remain deferred.

## Next Recommended Issue
- Define the next narrow layout-editor behavior only after local evidence for this batch is reviewed.

## Non-PHI Confirmation
- Inspector dimension editing uses synthetic room IDs and feet-based operational geometry only.
- No real identity, diagnosis field, note field, EHR integration, clinical safety certification wording, satisfaction wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
