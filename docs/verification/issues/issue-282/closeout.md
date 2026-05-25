# Issue 282 Closeout

## Summary
Saved floorplan reload now uses `authoringDraft.editableLayout` as the active edited geometry instead of rebuilding from stale `sourcePlan` geometry. Save and Save As both reload the edited room geometry, multiple saved versions coexist, duplicate persisted saved IDs are rejected, and private source payload rejection remains enforced.

## Files Changed
- `apps/web/src/features/floorplans/savedFloorplanStore.ts`
- `apps/web/src/features/floorplans/savedFloorplanReloadE2E.test.ts`
- `packages/shared/tests/saved-plan-reload-integrity.test.mjs`
- `scripts/check-floorplan-authoring.mjs`
- `packages/shared/fixtures/authoring-proof/plan-1-save-reload-fixture.json`
- `docs/verification/issues/issue-282/`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`

## Commands Run
See `commands.txt` and `command-output-map.json`.

## Tests Passed/Failed
First failure reproduced: `npm --workspace apps/web test` failed because the loaded saved plan used stale `authoringDraft.sourcePlan` geometry instead of `authoringDraft.editableLayout`.

Passed after implementation: shared tests, web tests, web build, no-PHI scan, private-source artifact gate, save-reload authoring gate, Plan 1 final gates, Plans 2-5 unchanged gate, and docs gate.

## Evidence
- `first-failure.txt`
- `save-reload-output.json`
- `save-as-reload-output.json`
- `multiple-version-output.json`
- `edited-layout-reload-output.json`
- `stale-source-plan-negative-output.json`
- `duplicate-id-negative-output.json`
- `private-source-payload-negative-output.json`
- `default-nonmutation-output.json`
- `test-output/`

## Known Limitations
This issue proves saved editable-copy reload integrity only. It does not add room-authoring UI proof beyond the edited geometry used for reload validation, and it does not claim route/path sync is ready after authoring edits.

## Non-PHI Confirmation
Non-PHI rules still pass. The implementation stores no PHI, EHR fields, real identities, employee IDs, real hospital identifiers, clinical notes, diagnosis text, medication names, source binaries, embedded documents, or private source paths.

## Next Recommended Issue
GO for Issue 283. Save and Save As reload edited geometry, and the stale source-plan reload risk is eliminated by constructing the active plan from the saved editable layout.
