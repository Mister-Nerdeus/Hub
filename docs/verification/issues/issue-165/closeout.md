# Issue 165 Closeout

## Summary
- Added a read-only layout delta preview placeholder that marks operational metric recalculation as pending after room move audit entries.
- Listed affected metric categories without displaying fake improvement or regression values.
- Kept simulation rerun, path sync, persistence, recommendations, and real metric recalculation deferred.

## Files changed
- `apps/web/src/features/layout-editor/LayoutDeltaPreviewPanel.tsx`
- `apps/web/src/features/layout-editor/layoutDeltaPreviewViewModel.ts`
- `apps/web/src/features/layout-editor/layoutDeltaPreviewViewModel.test.ts`
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.css`
- `docs/verification/issues/issue-165/commands.txt`
- `docs/verification/issues/issue-165/command-output-map.json`
- `docs/verification/issues/issue-165/screenshots/layout-delta-preview-placeholder.png`
- `docs/verification/issues/issue-165/test-output/web.txt`
- `docs/verification/issues/issue-165/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests passed/failed
- Failed before fix: `npm --workspace apps/web test` failed because `layoutDeltaPreviewViewModel` did not exist.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-165/commands.txt`
- `docs/verification/issues/issue-165/command-output-map.json`
- `docs/verification/issues/issue-165/screenshots/layout-delta-preview-placeholder.png`
- `docs/verification/issues/issue-165/test-output/web.txt`

## Known limitations
- The panel is a placeholder only.
- No simulation rerun, real metric recalculation, path sync, persistence, recommendation engine, or fake metric delta values were added.

## Next Recommended Issue
- Continue with Issue 166 to add visual-only room resize handles for selected rooms.

## Non-PHI Confirmation
- The panel uses operational metric category labels and synthetic edit IDs only.
- No real identity, diagnosis field, note field, EHR integration, clinical safety certification wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
