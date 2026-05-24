# Issue 161 Closeout

## Summary
- Added a deterministic read-only validation panel view model with stable sorting and duplicate warning collapse.
- Rendered the validation panel beside the inspector with empty and warning states.
- Captured a screenshot proof after a permissive room move produced a collision warning.

## Files changed
- `apps/web/src/features/layout-editor/LayoutValidationPanel.tsx`
- `apps/web/src/features/layout-editor/layoutValidationPanelViewModel.ts`
- `apps/web/src/features/layout-editor/layoutValidationPanelViewModel.test.ts`
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.css`
- `docs/verification/issues/issue-161/commands.txt`
- `docs/verification/issues/issue-161/command-output-map.json`
- `docs/verification/issues/issue-161/screenshots/room-move-validation-panel-proof.png`
- `docs/verification/issues/issue-161/test-output/web.txt`
- `docs/verification/issues/issue-161/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- Temporary local Vite server and headless Edge DevTools screenshot capture for `room-move-validation-panel-proof.png`.

## Tests passed/failed
- Failed before fix: `npm --workspace apps/web test` failed because `layoutValidationPanelViewModel` did not exist.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Passed: screenshot capture for `room-move-validation-panel-proof.png`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-161/commands.txt`
- `docs/verification/issues/issue-161/command-output-map.json`
- `docs/verification/issues/issue-161/screenshots/room-move-validation-panel-proof.png`
- `docs/verification/issues/issue-161/test-output/web.txt`

## Known limitations
- The panel is read-only and does not block edits, auto-fix layout geometry, save/load changes, sync paths, or rerun simulation.
- Warning generation remains limited to bounds and collision warnings implemented in Issues 159 and 160.

## Next Recommended Issue
- Continue with Issue 162 to define the deferred room move path sync contract without mutating the path graph.

## Non-PHI Confirmation
- The panel displays synthetic object IDs and operational layout warning messages only.
- No real identity, diagnosis field, note field, EHR integration, clinical safety certification wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
