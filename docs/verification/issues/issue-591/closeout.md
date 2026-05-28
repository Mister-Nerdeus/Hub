# Issue 591 Closeout

## Summary
- Repaired the false-positive 10 by 10 room-scale claim by replacing the actual add-room hardcode in `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`.
- New shared helper path: `apps/web/src/features/layout-editor/clickToPlaceObject.ts#getDefaultPlacementSizeForObject`.
- Old hardcoded path: `LayoutEditorStage.tsx` sent `defaultWidthFeet: 12` and `defaultHeightFeet: 10` into `buildAddRoomAction`.

## Proof
- Actual placed-room proof: `actual-placement-default-output.json` shows actual placement now derives width and height from the shared helper.
- Preview/actual parity proof: `preview-placement-parity-output.json` shows preview and actual placement use the same helper.
- Negative 12x10 fixture result: `negative-12x10-placement-output.json` confirms the 12 by 10 actual-placement fixture fails.
- Export/import proof: `export-import-proof-output.json` confirms the authoring harness preserves an added 10 by 10 room.
- No fixture mutation proof: `canonical-fixture-unchanged-output.json` and `no-fixture-mutation-output.txt` confirm canonical Plan 1 geometry was not mutated.

## Files Changed
- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/layout-editor/clickToPlaceObject.ts`
- `apps/web/src/features/layout-editor/__tests__/clickToPlaceObject.test.ts`
- `apps/web/src/features/layout-editor/__tests__/LayoutEditorStage.test.tsx`
- `scripts/check-default-room-scale.mjs`
- `scripts/lib/simulation-v0-repair-utils.mjs`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`
- `docs/verification/issues/issue-591/`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-default-room-scale.mjs --stage actual-placement-default --allow-partial --issue 591`
- `node scripts/check-default-room-scale.mjs --stage preview-placement-parity --allow-partial --issue 591`
- `node scripts/check-default-room-scale.mjs --stage export-import-proof --allow-partial --issue 591`
- `node scripts/check-default-room-scale.mjs --stage negative-12x10-placement --allow-partial --issue 591`
- `node scripts/check-default-room-scale.mjs --stage source-scan --allow-partial --issue 591`
- `node scripts/check-no-phi-fields.mjs`

## Tests Passed/Failed
- Passed: shared tests, 964 tests.
- Passed: web tests, 211 files.
- Passed: web build.
- Passed: Issue 591 default-room-scale gate stages.
- Passed: no-PHI scan.

## Evidence Artifacts
- `docs/verification/issues/issue-591/`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`

## Known Limitations
- Simulation v0 remains internal synthetic dry-run only.
- Manual visual review remains required.
- Promotion remains blocked.
- Full-event simulation, optimizer behavior, assignment recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass. This issue added no PHI, real identity, EHR integration, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation behavior, or clinical/staffing/outcome certification claims.

## GO / NO-GO
- GO for next issue.
