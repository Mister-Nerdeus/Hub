# Issue 207 Closeout

## First Failure / Current Gap

Captured in `first-failure.txt` and `metadata-semantic-consistency-output.json` before repair. The canonical fixture had three special room/door semantic mismatches and one entry self-reference.

## Implementation Summary

- Repaired canonical fixture door metadata for trauma, isolation, and behavioral rooms.
- Changed EMS entry `linkedPathNodeId` from self-reference to `node-hall-west`.
- Added TypeScript and Python semantic validation for special room/door metadata and entry self-reference rejection.
- Updated web fixture parity, metadata docs, project status, and issue evidence index.

## Files Changed

- `packages/shared/fixtures/plan-er-pod-phase2.json`
- `apps/web/src/fixtures/planErPodPhase2.ts`
- `packages/shared/src/contracts.ts`
- `apps/api/app/contracts.py`
- `packages/shared/tests/door-operational-metadata.test.mjs`
- `packages/shared/tests/entry-operational-metadata.test.mjs`
- `packages/shared/tests/er-layout-metadata-architecture.test.mjs`
- `packages/shared/tests/er-layout-metadata-semantic-consistency.test.mjs`
- `apps/api/tests/contracts/test_door_operational_metadata.py`
- `apps/api/tests/contracts/test_entry_operational_metadata.py`
- `apps/api/tests/contracts/test_er_layout_metadata_semantic_consistency.py`
- `docs/contracts/er-layout-metadata-contract.md`
- `docs/project/er-layout-metadata-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-207/*`

## Commands Run

See `commands.txt` and `command-output-map.json`.

## Tests Passed / Failed

- Initial shared test run failed once due to an older expected entry self-link in `er-layout-metadata-architecture.test.mjs`; that was fixed.
- Final acceptance command results are captured under `test-output/`.

## Evidence Artifacts

- `first-failure.txt`
- `metadata-semantic-consistency-output.json`
- `entry-link-semantics-output.json`
- `canonical-fixture-repair-output.json`
- `default-import-readiness-go-no-go.md`
- `known-gaps.md`
- `follow-up-issues.md`
- `test-output/`

## TypeScript / Python Parity

Confirmed. Both validators now reject special room/door semantic mismatches and entry `linkedPathNodeId` self-reference.

## Non-PHI Confirmation

No PHI fields, real patient identity, EHR support, diagnosis text, or clinical notes were introduced. The no-PHI scan output is captured in `test-output/no-phi.txt`.

## Non-Claims

This issue does not import uploaded ER layout documents, add default saved plan UI, change pathfinding, change simulation, change scoring, seed a database, or certify any layout as clinically safe, buildable, or compliant.

## Known Limitations

See `known-gaps.md`.

## Next Recommended Issue

Issue 208 - Source Layout Archive Manifest.
