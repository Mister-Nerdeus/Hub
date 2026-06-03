# Issue 873 Closeout

## Problem
Assignment Care Position Terminology Alignment

## Code Review
- The resolver already preserves split-room parents as physical rooms and emits bed-position targets; this issue documents that bed_position is the current care-position model and adds a guard against contradictory terminology.

## Files Changed
- docs/project/assignment-care-position-model.md
- docs/project/assignment-foundation-status.md
- docs/verification/assignment-foundation-manifest.json
- scripts/check-assignment-care-position-terminology.mjs
- packages/shared/src/assignments/assignmentTargetContract.ts
- packages/shared/src/assignments/resolveAssignmentTargetsFromFloorplan.ts
- docs/verification/issues/issue-873

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-assignment-care-position-terminology.mjs --stage final --issue 873
- node scripts/check-assignment-target-contract.mjs --stage final --issue 873
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-873/assignment-care-position-terminology-output.json
- docs/verification/issues/issue-873/bed-position-care-position-proof.json
- docs/verification/issues/issue-873/split-parent-not-assignment-target-proof.json
- docs/verification/issues/issue-873/split-bed-target-proof.json
- docs/verification/issues/issue-873/manifest-update-output.json
- docs/verification/issues/issue-873/test-output/docker-compose-config.txt
- docs/verification/issues/issue-873/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-873/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-873/test-output/docker-compose-production-build-web.txt

## Known Limitations
- Terminology is aligned for the manual assignment foundation; no schema rename from bed_position to care_position was introduced.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only assignment foundation task.
