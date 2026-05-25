# Issue 239 Closeout - Editor Export Integrity for Edited Plan 1

## Summary

Issue 239 fixes editor export so exported Plan 1 JSON reflects current editable room, station, and zone geometry instead of serializing stale `sourcePlan` geometry. Doors, path nodes, and path edges are preserved from the source plan with explicit sync deferral.

## Files Changed

- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts`
- `apps/web/src/features/layout-editor/editableLayoutToPlanContract.test.ts`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-239/*`

## Commands Run

- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 239`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed / Failed

- PASS: `npm --workspace apps/web test` executed 70 web test files.
- PASS: `npm --workspace apps/web run build` completed successfully. Vite reported the existing large chunk warning.
- PASS: `node scripts/check-no-phi-fields.mjs` found no PHI-like fields.
- PASS: `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 239` reported no required stage failures. The remaining grey-block annotation gap is expected until final deferred handling.
- PASS: `node scripts/check-docs-contracts.mjs` after evidence artifacts were present.

## Evidence Artifacts

- `first-failure.txt`
- `stale-export-negative-output.json`
- `editable-layout-to-plan-output.json`
- `edited-plan-export-output.json`
- `source-plan-nonmutation-output.json`
- `path-sync-deferred-output.json`
- `no-docx-export-output.json`
- `test-output/web.txt`
- `test-output/web-build.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- Door position sync is deferred and explicitly preserves source-plan doors.
- Path node and path edge sync is deferred and explicitly preserves the source-plan graph.
- No automatic route, walking baseline, assignment, scoring, simulation, optimizer, report, production deployment, DOCX exposure, PHI, EHR integration, or exact-CAD behavior was added.

## Non-PHI Confirmation

No PHI, patient identity, EHR integration, DOCX/source image exposure, clinical safety certification language, optimizer behavior, scoring, or simulation behavior was added.

## GO / NO-GO for Issue 240

- GO: edited Plan 1 exports current supported geometry, validates as PlanContract, preserves the source plan object, and documents deferred door/path sync.

## Export Reflects Edited Room Geometry

- Yes. The evidence edits `room-14` and verifies exported `x`, `y`, `widthFeet`, and `lengthFeet` changed.

## Geometry Objects Export Correctly

- Rooms: supported.
- Nurse stations: supported.
- Zones: supported.

## Sync Behaviors Deferred

- Door geometry sync.
- Path node sync.
- Path edge sync.

## Next Recommended Issue

- Issue 240: final Plan 1 visual parity audit and GO/NO-GO.
