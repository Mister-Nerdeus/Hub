# Issue 198 Closeout

## Summary

Created the ER layout metadata architecture contract and added strict optional placeholder metadata containers across TypeScript and Python plan contracts. The placeholders establish nested metadata locations without allowing fields until future issues define enum, boolean, numeric, or validated-reference shapes.

## First-Failure Evidence

`first-failure.txt` shows the pre-change TypeScript plan contract rejected `roomOperationalMetadata` as an unknown room field, demonstrating the current schema gap.

## Bounded Implementation Summary

- Added optional nested metadata containers for room, zone, hallway, door, station, entry, overflow, and adjacency metadata.
- Kept placeholder metadata objects strict and empty for Issue 198.
- Added TypeScript tests for nested metadata acceptance, top-level field sprawl rejection, narrative metadata rejection, and existing fixture compatibility.
- Added Python parity tests for the same validation strategy.
- Documented naming, field-shape, no-PHI, and future reference-validation rules.

## Files Changed

- `packages/shared/src/contracts.ts`
- `packages/shared/tests/er-layout-metadata-architecture.test.mjs`
- `apps/api/app/contracts.py`
- `apps/api/tests/contracts/test_er_layout_metadata_architecture.py`
- `docs/contracts/er-layout-metadata-contract.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-198/`

## Commands Run

See `commands.txt`.

## Tests Passed

- `npm --workspace packages/shared test`
- `cd apps/api && python -m pytest`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Failed

- Initial `node scripts/check-docs-contracts.mjs` failed because the self-referential `docs-gate.txt` artifact did not exist before the docs gate ran. The placeholder artifact was added, then the docs gate passed on rerun.
- None in final verification.

## Evidence Artifacts

- `docs/verification/issues/issue-198/first-failure.txt`
- `docs/verification/issues/issue-198/er-layout-metadata-architecture-output.json`
- `docs/verification/issues/issue-198/no-phi-metadata-boundary-output.json`
- `docs/verification/issues/issue-198/test-output/shared.txt`
- `docs/verification/issues/issue-198/test-output/api.txt`
- `docs/verification/issues/issue-198/test-output/no-phi.txt`
- `docs/verification/issues/issue-198/test-output/docs-gate.txt`

## TypeScript/Python Parity

Confirmed by aligned optional placeholder metadata fields and passing TypeScript/Python contract tests.

## Non-PHI Confirmation

Metadata containers permit no fields in Issue 198, narrative metadata fields are rejected without echoing rejected values, and `node scripts/check-no-phi-fields.mjs` passed.

## Non-Claims

- Does not add full ER metadata fields yet.
- Does not change simulation execution.
- Does not change pathfinding.
- Does not change optimizer behavior.
- Does not change API persistence routes.
- Does not change UI behavior.
- Does not add clinical safety, staffing-compliance, legal-compliance, EHR, or PHI support.

## Known Limitations

- Metadata objects are strict placeholders only; concrete fields are intentionally deferred to Issues 199-205.
- Reference-validation hooks will be added as each reference field is introduced.

## Next Recommended Issue

Issue 199 - ER Room Operational Metadata V1.
