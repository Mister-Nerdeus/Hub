# Issue 220 Closeout

## Summary

Added the open-default JSON floorplan workflow. The app now has deterministic active floorplan state, the library can open validated JSON defaults, opened defaults remain read-only, switching plans resets selection-specific state, and the active summary avoids DOCX source exposure.

## Files Changed

- `apps/web/src/features/floorplans/activeFloorplanState.ts`
- `apps/web/src/features/floorplans/ActiveFloorplanSummary.tsx`
- `apps/web/src/features/floorplans/activeFloorplanState.test.ts`
- `apps/web/src/features/floorplans/FloorplanLibrary.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-220/*`

## Commands Run

- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-docs-contracts.mjs`

## Tests Passed/Failed

- Passed: `npm --workspace apps/web test` (61 web test files).
- Passed: `npm --workspace apps/web run build`.
- Passed: `node scripts/check-docs-contracts.mjs`.
- Failed final gates: none. An initial local web test iteration caught an invalid test fixture typing issue; fixed and reran successfully.

## Evidence

- `first-failure.txt`
- `open-default-floorplan-output.json`
- `active-floorplan-state-output.json`
- `no-docx-open-output.json`
- `command-output-map.json`
- `test-output/web.txt`
- `test-output/web-build.txt`
- `test-output/docs-gate.txt`

## Non-PHI Confirmation

No PHI fields, EHR integration, clinical safety claims, legal compliance claims, or exact-CAD claims were introduced.

## DOCX Privacy Confirmation

Opening a floorplan uses validated JSON default fixtures only. Active state and summaries do not include DOCX source paths, filenames, preview links, download links, or payloads.

## Non-Claims

This issue does not edit floorplans, save floorplans, open DOCX files, add route or walking-truth logic, or change assignment/scoring/simulation behavior.

## Known Limitations

Active defaults are read-only. Duplicate-to-editable and saved local storage workflows are deferred to later issues in the batch.

## Next Recommended Issue

Issue 221: Duplicate Default Floorplan to Editable Copy.
