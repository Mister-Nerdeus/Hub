# Issue 152 Closeout

## Summary
- Added read-only door SVG rendering from layout render pipeline items.
- Added a door shape view model with owner-wall derived pixel geometry, wall metadata, and hit target key.
- Tested north, south, east, and west wall placement plus missing-owner non-render behavior through the render pipeline.

## Files changed
- `apps/web/src/features/layout-editor/DoorShape.tsx`
- `apps/web/src/features/layout-editor/doorShapeViewModel.ts`
- `apps/web/src/features/layout-editor/doorShapeViewModel.test.ts`
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/layout-editor/LayoutEditorStage.css`
- `docs/verification/issues/issue-152/commands.txt`
- `docs/verification/issues/issue-152/command-output-map.json`
- `docs/verification/issues/issue-152/screenshots/door-shape-proof.png`
- `docs/verification/issues/issue-152/test-output/web.txt`
- `docs/verification/issues/issue-152/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- Headless Edge screenshot capture against a temporary local Vite preview server.

## Tests passed/failed
- Failed before fix: no door shape view model existed.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Passed: screenshot capture for `door-shape-proof.png`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-152/commands.txt`
- `docs/verification/issues/issue-152/command-output-map.json`
- `docs/verification/issues/issue-152/screenshots/door-shape-proof.png`
- `docs/verification/issues/issue-152/test-output/web.txt`

## Known limitations
- Door rendering is read-only.
- Missing door owners produce deterministic non-render output.
- No door dragging, wall switching, door editing, path sync, save/load, or simulation rerun behavior was added.

## Next Recommended Issue
- Issue 153 - Station and Desk Shape Rendering.

## Non-PHI Confirmation
- Door metadata uses synthetic layout fixture IDs, wall names, offsets, and feet-based width values only.
- No real identity, diagnosis field, note field, EHR integration, staffing-certification wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
