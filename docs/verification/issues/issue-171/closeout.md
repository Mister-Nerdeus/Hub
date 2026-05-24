# Issue 171 Closeout

## Summary
- Added a pure feet-based room resize geometry helper.
- Supported all eight resize handles with default and fine snap behavior.
- Enforced minimum room size while preserving room metadata and avoiding input mutation.

## Files changed
- `apps/web/src/features/layout-editor/roomResizeGeometry.ts`
- `apps/web/src/features/layout-editor/roomResizeGeometry.test.ts`
- `apps/web/src/features/layout-editor/roomResizeHandlesViewModel.ts`
- `apps/web/src/features/layout-editor/roomResizeHandlesViewModel.test.ts`
- `apps/web/src/features/layout-editor/layoutSnapEngine.ts`
- `apps/web/src/features/layout-editor/layoutSnapEngine.test.ts`
- `docs/verification/issues/issue-171/commands.txt`
- `docs/verification/issues/issue-171/command-output-map.json`
- `docs/verification/issues/issue-171/room-resize-geometry-output.json`
- `docs/verification/issues/issue-171/test-output/web.txt`
- `docs/verification/issues/issue-171/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests passed/failed
- Failed before fix: `npm --workspace apps/web test` failed because `roomResizeGeometry` did not exist.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-171/commands.txt`
- `docs/verification/issues/issue-171/command-output-map.json`
- `docs/verification/issues/issue-171/room-resize-geometry-output.json`
- `docs/verification/issues/issue-171/test-output/web.txt`

## Known limitations
- The resize helper is pure geometry calculation only.
- No pointer interaction, stage wiring, inspector editing, door mutation, path sync, save/load behavior, or simulation rerun was added.

## Next Recommended Issue
- Add pointer-based selected-room resize interaction using the pure geometry helper.

## Non-PHI Confirmation
- Room resize geometry uses synthetic room IDs and feet-based operational geometry only.
- No real identity, diagnosis field, note field, EHR integration, clinical safety certification wording, satisfaction wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
