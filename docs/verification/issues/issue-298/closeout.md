## Summary

Issue 298 creates the Plan 5 source-corrected saved editable copy, records safe provenance, renders visual evidence from that saved copy, attempts simulation-ready export, and keeps the Plan 5 default source fixture unchanged.

## Files Changed

- `packages/shared/fixtures/source-corrections/plan-5/plan-5-corrected-saved-copy.json`
- `packages/shared/fixtures/source-corrections/plan-5/plan-5-correction-notes.md`
- `packages/shared/tests/plan-5-source-correction.test.mjs`
- `docs/verification/source-plan-correction-manifest.json`
- `docs/verification/issues/issue-298/*`

## Commands Run

See `commands.txt` and `command-output-map.json`.

## Tests Passed/Failed

Passed: shared tests, web tests, web build, no-PHI scan, private-source scan, floorplan authoring final gate, Plans 2-5 unchanged gate, source-correction Plan 5 gate, and Plan 1 final gates.

Failed first: source-correction Plan 5 gate before the corrected saved-copy artifact existed.

## Evidence

Evidence includes the corrected copy output, correction diff, room/door changes, hallway/border output, rendered visual output, private-source boundary output, simulation-ready export attempt, source fixture nonmutation, manifest update, and screenshot.

## Known Limitations

Plan 5 simulation-ready export is explicit but may remain blocked pending route/path review. No promotion occurs in this batch.

## Non-PHI Confirmation

Non-PHI rules still pass. The corrected saved copy stores no PHI, source binary, source filename, private path, OCR dump, raw source text, or private-source screenshot.

## Next Recommended Issue

GO for Issue 299. Plan 5 corrected saved copy exists, the Plan 5 source fixture remained unchanged, and simulation-ready export status is recorded.
