## Summary

Issue 291 establishes the source-correction protocol and manifest for Batch 291-300. The new gate validates the private-source boundary, saved-copy-only workflow, no exact parity claims, no promotion, and unchanged Plans 2-5 default fixtures.

## Files Changed

- `docs/source-correction/source-correction-protocol.md`
- `docs/source-correction/private-source-boundary.md`
- `docs/verification/source-plan-correction-manifest.json`
- `packages/shared/src/floorplans/sourcePlanCorrectionManifest.ts`
- `packages/shared/tests/source-plan-correction-manifest.test.mjs`
- `scripts/check-source-plan-correction.mjs`
- `packages/shared/src/index.ts`
- `docs/verification/issues/issue-291/*`

## Commands Run

See `commands.txt` and `command-output-map.json`.

## Tests Passed/Failed

Passed: shared tests, web tests, web build, no-PHI scan, private-source artifact scan, floorplan authoring final gate, Plans 2-5 unchanged gate, Plan 1 final gates, and source-correction protocol gate.

Failed first: `node scripts/check-source-plan-correction.mjs --stage protocol --allow-partial --issue 291` before the gate existed.

## Evidence

- `source-correction-protocol-output.md`
- `private-source-boundary-output.json`
- `correction-manifest-output.json`
- `manifest-validation-output.json`
- `no-direct-fixture-mutation-output.json`
- `no-private-source-runtime-output.json`
- `no-exact-parity-claim-output.json`
- `no-private-source-screenshot-output.json`
- `test-output/source-plan-correction-gate.txt`

## Known Limitations

Plans 2-5 correction artifacts are not created yet. Promotion remains blocked until a separate explicit promotion-review issue.

## Non-PHI Confirmation

Non-PHI rules still pass. The protocol stores no PHI, no EHR data, no real patient or staff identity, no source binary, no source filename, no private path, no OCR dump, no raw source text, and no private-source screenshot.

## Next Recommended Issue

GO for Issue 292. The protocol exists, the correction manifest validates, the private-source boundary is enforced, and promotion remains blocked.
