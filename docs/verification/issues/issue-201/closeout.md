# Issue 201 Closeout

## Summary

Added strict hallway operational metadata for ER layouts while keeping hallway geometry and path travel behavior unchanged.

## First-Failure Evidence

`first-failure.txt` shows the pre-change contract rejected `hallwayOperationalMetadata.hallwayClass`, confirming the metadata gap.

## Bounded Implementation Summary

- Added TypeScript and Python hallway metadata contracts with enum and boolean fields only.
- Updated the shared and web Phase 2 ER pod fixtures with `main` and `ems` hallway classes.
- Added TypeScript and Python positive/negative validation coverage.
- Added a path travel stability test proving the same route nodes, route edges, distance, and seconds with and without hallway metadata.
- Updated the ER layout metadata contract documentation.

## Files Changed

- `packages/shared/src/contracts.ts`
- `apps/api/app/contracts.py`
- `packages/shared/fixtures/plan-er-pod-phase2.json`
- `apps/web/src/fixtures/planErPodPhase2.ts`
- `packages/shared/tests/hallway-operational-metadata.test.mjs`
- `apps/api/tests/contracts/test_hallway_operational_metadata.py`
- `packages/shared/tests/er-layout-metadata-architecture.test.mjs`
- `apps/api/tests/contracts/test_er_layout_metadata_architecture.py`
- `docs/contracts/er-layout-metadata-contract.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-201/`

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

- `docs/verification/issues/issue-201/first-failure.txt`
- `docs/verification/issues/issue-201/hallway-metadata-contract-output.json`
- `docs/verification/issues/issue-201/hallway-path-stability-output.json`
- `docs/verification/issues/issue-201/test-output/shared.txt`
- `docs/verification/issues/issue-201/test-output/api.txt`
- `docs/verification/issues/issue-201/test-output/web.txt`
- `docs/verification/issues/issue-201/test-output/no-phi.txt`
- `docs/verification/issues/issue-201/test-output/docs-gate.txt`

## TypeScript/Python Parity

Confirmed by aligned hallway metadata field names, enum values, strict unknown-field rejection, and passing shared/API tests.

## Non-PHI Confirmation

Hallway metadata is enum/boolean only, no narrative text fields were added, no clinical or identity fields were introduced, and the static no-PHI scanner passed.

## Non-Claims

- Does not calculate fire-code compliance.
- Does not certify stretcher or bed movement safety.
- Does not change pathfinding behavior.
- Does not add simulation execution, optimizer, assignment scoring, API persistence routes, Docker, deployment, PHI, diagnosis text, clinical notes, or EHR fields.

## Known Limitations

- Hallway metadata is validation-only and is not consumed by pathfinding, assignment, scoring, simulation, or optimizer behavior.
- Only representative hallway classes are present in the Phase 2 fixture; future fixtures may add the remaining classes.

## Next Recommended Issue

Issue 202 - ER Door Operational Metadata V1.
