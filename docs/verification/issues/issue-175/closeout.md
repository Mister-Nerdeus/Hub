# Issue 175 Closeout

## Summary
- Added deterministic door validity warnings after room resize.
- Attached room-owned doors now warn when `offsetFeet + widthFeet` exceeds the resized wall length or when owner room geometry is missing.
- Integrated door validity warning recalculation into `resizeRoom` while leaving stored door geometry unchanged and resize permissive.

## Files changed
- `apps/web/src/features/layout-editor/doorValidityAfterRoomResize.ts`
- `apps/web/src/features/layout-editor/doorValidityAfterRoomResize.test.ts`
- `apps/web/src/features/layout-editor/roomResizeValidation.ts`
- `apps/web/src/features/layout-editor/layoutEditorReducer.ts`
- `docs/verification/issues/issue-175/commands.txt`
- `docs/verification/issues/issue-175/command-output-map.json`
- `docs/verification/issues/issue-175/door-validity-after-resize-output.json`
- `docs/verification/issues/issue-175/test-output/web.txt`
- `docs/verification/issues/issue-175/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests passed/failed
- Failed before fix: `npm --workspace apps/web test` failed because `doorValidityAfterRoomResize` did not exist.
- Passed: `npm --workspace apps/web test`
- Passed: `npm --workspace apps/web run build`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-175/commands.txt`
- `docs/verification/issues/issue-175/command-output-map.json`
- `docs/verification/issues/issue-175/door-validity-after-resize-output.json`
- `docs/verification/issues/issue-175/test-output/web.txt`

## Known limitations
- Door validity warnings are permissive and do not block resize.
- Doors are not automatically repositioned or mutated.
- Path sync, save/load behavior, simulation rerun, and recommendation behavior remain deferred.

## Next Recommended Issue
- Add selected-room inspector dimension editing that uses the same validation, audit, and pending-delta mechanisms.

## Non-PHI Confirmation
- Door validity warnings use synthetic room and door IDs plus feet-based operational geometry only.
- No real identity, diagnosis field, note field, EHR integration, clinical safety certification wording, satisfaction wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
