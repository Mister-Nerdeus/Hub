# Issue 623 Closeout

## Summary
Door removal UX now covers selected doors and selected rooms with attached doors.

## Files Changed
- See git diff for source, checker, manifest, and evidence updates.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-layout-editor-door-delete-ux.mjs --stage selected-door-delete --allow-partial --issue 623
- node scripts/check-layout-editor-door-delete-ux.mjs --stage selected-room-remove-doors --allow-partial --issue 623
- node scripts/check-layout-editor-door-delete-ux.mjs --stage invalid-door-delete --allow-partial --issue 623
- node scripts/check-layout-editor-door-delete-ux.mjs --stage warning-cleanup --allow-partial --issue 623
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-623
- docs/verification/layout-editor-narrow-room-door-provider-pharmacy-manifest.json

## Known Limitations
- Manual visual approval remains required.
- Promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction was added.
