# Issue 188 Closeout

## Summary
- Reproduced that the grid and SVG stage were driven by the 64 ft by 40 ft proof bounds.
- Added a separate default editor workspace of 180 ft by 120 ft and a pixel-based 1080 by 720 SVG viewport.
- Updated grid generation to use the visible viewport intersection with the workspace, including 1 ft minor and 5 ft major feet labels.
- Routed default move/resize validation through workspace bounds and kept old local drafts from carrying old proof bounds forward.

## Files changed
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.css`
- `apps/web/src/features/layout-editor/layoutGridViewModel.ts`
- `apps/web/src/features/layout-editor/layoutWorkspaceConfig.ts`
- `apps/web/src/features/layout-editor/layoutMoveValidation.ts`
- `apps/web/src/features/layout-editor/layoutEditorState.ts`
- `apps/web/src/features/layout-editor/layoutEditorReducer.test.ts`
- `apps/web/src/features/layout-editor/layoutGridViewModel.test.ts`
- `apps/web/src/features/layout-editor/layoutLocalDraftPersistence.test.ts`
- `apps/web/src/features/layout-editor/layoutMoveValidation.test.ts`
- `apps/web/src/features/layout-editor/roomResizeValidation.test.ts`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-188/*`

## Commands run
- `npx --yes tsx <issue-188 first-failure probe> > docs/verification/issues/issue-188/first-failure.txt`
- `PowerShell grid proof render > docs/verification/issues/issue-188/screenshots/*.png`
- `npx --yes tsx <issue-188 workspace/grid evidence probes> > docs/verification/issues/issue-188/*.json`
- `npm --workspace apps/web test > docs/verification/issues/issue-188/test-output/web.txt`
- `npm --workspace apps/web run build | Tee-Object -FilePath docs/verification/issues/issue-188/test-output/web.txt -Append`
- `node scripts/check-docs-contracts.mjs | Tee-Object -FilePath docs/verification/issues/issue-188/test-output/docs-gate.txt -Append`
- `node scripts/verify-local.mjs > docs/verification/issues/issue-188/test-output/verify-local.txt`

## Tests passed/failed
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-docs-contracts.mjs`
- Passed: `node scripts/verify-local.mjs`
- Failed during implementation: one web test still expected 64 by 40 bounds; fixed and reran.

## Evidence artifacts
- `docs/verification/issues/issue-188/first-failure.txt`
- `docs/verification/issues/issue-188/workspace-grid-output.json`
- `docs/verification/issues/issue-188/viewport-grid-output.json`
- `docs/verification/issues/issue-188/local-draft-migration-output.json`
- `docs/verification/issues/issue-188/screenshots/before-grid-proof.png`
- `docs/verification/issues/issue-188/screenshots/workspace-180x120-proof.png`
- `docs/verification/issues/issue-188/screenshots/zoom-50-grid-proof.png`
- `docs/verification/issues/issue-188/test-output/web.txt`
- `docs/verification/issues/issue-188/test-output/docs-gate.txt`
- `docs/verification/issues/issue-188/test-output/verify-local.txt`

## Known limitations
- The workspace bounds are local editor defaults only; no persistence API or simulation behavior was added.
- The render proof images are deterministic local grid proofs, not browser screenshots.
- The stage uses fixed default visible viewport pixels; responsive CSS scales the rendered SVG on screen.

## Next Recommended Issue
- Issue 189: Runtime No-PHI Text Guard for Operational Labels.

## Non-PHI Confirmation
- This change touches only synthetic layout geometry, grid rendering, and local editor validation bounds.
- No PHI fields, real identity data, clinical text support, EHR integration, optimizer behavior, or report behavior was introduced.
- Local verification, including the no-PHI scan inside `verify-local`, passed.
