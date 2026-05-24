# Issue 202 Closeout

## Summary

Added strict ER door operational metadata while preserving door geometry, room geometry, and door path-node linkage.

## First-Failure Evidence

`first-failure.txt` shows the pre-change contract rejected `doorOperationalMetadata.doorClass`, confirming the current metadata gap.

## Bounded Implementation Summary

- Added TypeScript and Python `doorOperationalMetadata` contracts with enum and boolean fields only.
- Updated the shared and web Phase 2 ER pod fixtures with representative standard, isolation, behavioral, trauma, and staff-restricted door metadata.
- Added TypeScript and Python positive/negative validation coverage.
- Added stability evidence proving door path-node links are unchanged and metadata does not mutate room geometry.
- Ran web tests to verify layout editor and renderer surfaces remain stable.
- Updated the ER layout metadata contract documentation.

## Files Changed

- `packages/shared/src/contracts.ts`
- `apps/api/app/contracts.py`
- `packages/shared/fixtures/plan-er-pod-phase2.json`
- `apps/web/src/fixtures/planErPodPhase2.ts`
- `packages/shared/tests/door-operational-metadata.test.mjs`
- `apps/api/tests/contracts/test_door_operational_metadata.py`
- `packages/shared/tests/er-layout-metadata-architecture.test.mjs`
- `apps/api/tests/contracts/test_er_layout_metadata_architecture.py`
- `docs/contracts/er-layout-metadata-contract.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-202/`

## Commands Run

See `commands.txt`.

## Tests Passed

- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `cd apps/api && python -m pytest`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`

## Tests Failed

None in final verification.

## Evidence Artifacts

- `docs/verification/issues/issue-202/first-failure.txt`
- `docs/verification/issues/issue-202/door-metadata-contract-output.json`
- `docs/verification/issues/issue-202/door-sync-stability-output.json`
- `docs/verification/issues/issue-202/test-output/shared.txt`
- `docs/verification/issues/issue-202/test-output/api.txt`
- `docs/verification/issues/issue-202/test-output/web.txt`
- `docs/verification/issues/issue-202/test-output/no-phi.txt`
- `docs/verification/issues/issue-202/test-output/docs-gate.txt`

## TypeScript/Python Parity

Confirmed by aligned door metadata field names, enum values, strict unknown-field rejection, and passing shared/API tests.

## Non-PHI Confirmation

Door metadata is enum/boolean only, door labels remain covered by runtime no-PHI validation, no narrative text fields were added, and the static no-PHI scanner passed.

## Non-Claims

- Does not simulate door state over time.
- Does not certify isolation safety.
- Does not change pathfinding behavior.
- Does not add simulation execution, optimizer, assignment scoring, API persistence routes, Docker, deployment, PHI, diagnosis text, clinical notes, or EHR fields.

## Known Limitations

- Door metadata is validation-only and is not consumed by pathfinding, assignment, scoring, simulation, optimizer behavior, or UI editing behavior.
- Swing direction remains declarative metadata only and is not used to compute clearance or access timing.

## Next Recommended Issue

Issue 203 - Nurse Station Operational Metadata V1.
