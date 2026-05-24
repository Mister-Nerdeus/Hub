# Issue 168 Closeout

## Summary
- Added a pure warning recalculation helper for generated bounds and collision warnings.
- Recalculated room-move generated warnings from current geometry instead of carrying stale generated state forward.
- Preserved non-generated warnings while replacing generated warnings by source.

## Files changed
- `apps/web/src/features/layout-editor/layoutWarningRecalculation.ts`
- `apps/web/src/features/layout-editor/layoutWarningRecalculation.test.ts`
- `apps/web/src/features/layout-editor/layoutEditorReducer.ts`
- `apps/web/src/features/layout-editor/layoutEditorReducer.test.ts`
- `docs/verification/issues/issue-168/commands.txt`
- `docs/verification/issues/issue-168/command-output-map.json`
- `docs/verification/issues/issue-168/warning-recalculation-output.json`
- `docs/verification/issues/issue-168/test-output/web.txt`
- `docs/verification/issues/issue-168/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests passed/failed
- Failed before fix: `npm --workspace apps/web test` failed because `layoutWarningRecalculation` did not exist.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-168/commands.txt`
- `docs/verification/issues/issue-168/command-output-map.json`
- `docs/verification/issues/issue-168/warning-recalculation-output.json`
- `docs/verification/issues/issue-168/test-output/web.txt`

## Known limitations
- Recalculation covers generated bounds and collision warnings only.
- Movement remains permissive.
- No resize behavior, blocking behavior, path sync, door sync, save/load behavior, simulation rerun, or recommendation engine was added.

## Next Recommended Issue
- Add room move audit gesture grouping as a separate contract without reducer-level audit compression.

## Non-PHI Confirmation
- Warning recalculation uses synthetic object IDs and feet-based operational layout geometry only.
- No real identity, diagnosis field, note field, EHR integration, clinical safety certification wording, satisfaction wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
