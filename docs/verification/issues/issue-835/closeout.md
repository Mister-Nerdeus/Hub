# Issue 835 Closeout

## Problem
Entry / Exit Geometry Contract

## Code Review
- Entries and exits are persisted selectable geometry with destination labels and non-blocking travel semantics.

## Files Changed
- packages/shared/src/floorplans/entryExitContract.ts
- packages/shared/src/floorplans/floorplanGeometryContract.ts
- apps/web/src/features/layout-editor/EntryExitShape.tsx
- docs/verification/issues/issue-835/

## Commands Run
- node scripts/check-entry-exit-contract.mjs --stage final --issue 835

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-835/entry-exit-contract-output.json
- docs/verification/issues/issue-835/entry-exit-fixture.json

## Known Limitations
- Entry/exit objects can become route graph nodes later; this issue does not build route graph behavior.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, or assignment recommendations were added.
