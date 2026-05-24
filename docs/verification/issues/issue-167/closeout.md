# Issue 167 Closeout

## Summary
- Added a dedicated layout validation warning contract with severity, source, generated/manual classification, exact-key validation, deterministic sorting, generated-source filtering, and forbidden wording rejection.
- Migrated generated room move bounds and collision warnings to the contract helper.
- Updated the validation panel view model and UI to preserve and display severity and source.

## Files changed
- `apps/web/src/features/layout-editor/layoutValidationWarningContract.ts`
- `apps/web/src/features/layout-editor/layoutValidationWarningContract.test.ts`
- `apps/web/src/features/layout-editor/layoutEditorState.ts`
- `apps/web/src/features/layout-editor/layoutEditorReducer.ts`
- `apps/web/src/features/layout-editor/layoutMoveValidation.ts`
- `apps/web/src/features/layout-editor/layoutMoveValidation.test.ts`
- `apps/web/src/features/layout-editor/layoutCollisionValidation.ts`
- `apps/web/src/features/layout-editor/layoutCollisionValidation.test.ts`
- `apps/web/src/features/layout-editor/layoutValidationPanelViewModel.ts`
- `apps/web/src/features/layout-editor/layoutValidationPanelViewModel.test.ts`
- `apps/web/src/features/layout-editor/LayoutValidationPanel.tsx`
- `docs/verification/issues/issue-167/commands.txt`
- `docs/verification/issues/issue-167/command-output-map.json`
- `docs/verification/issues/issue-167/layout-warning-contract-output.json`
- `docs/verification/issues/issue-167/test-output/web.txt`
- `docs/verification/issues/issue-167/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests passed/failed
- Failed before fix: `npm --workspace apps/web test` failed because warning state accepted a warning without severity, source, or isGenerated.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Failed during evidence drafting: `node scripts/check-docs-contracts.mjs` caught a missing `Next Recommended Issue` closeout section.
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-167/commands.txt`
- `docs/verification/issues/issue-167/command-output-map.json`
- `docs/verification/issues/issue-167/layout-warning-contract-output.json`
- `docs/verification/issues/issue-167/test-output/web.txt`

## Known limitations
- Warnings remain permissive editor warnings only.
- No resize behavior, path sync, door sync, blocking behavior, save/load behavior, simulation rerun, or recommendation engine was added.

## Next Recommended Issue
- Implement generated warning recalculation and stale-warning clearing as a separate issue without adding blocking behavior.

## Non-PHI Confirmation
- Validation warnings use synthetic object IDs and operational layout geometry only.
- No real identity, diagnosis field, note field, EHR integration, clinical safety certification wording, satisfaction wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
