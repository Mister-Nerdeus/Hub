# Issue 892 Closeout

## Problem
Stable Staff Roster Identity

## Code Review
- Staff roster identity now uses explicit stable IDs; roster rename only changes label/timestamp, while duplicate rosters get new IDs and scenario/snapshot references remain linked.

## Summary
- Implemented as scoped for issue 892.

## Files Changed
- packages/shared/src/scenarios/manualScenarioStaffRosterContract.ts
- packages/shared/src/scenarios/manualScenarioStaffRosterFixture.ts
- packages/shared/tests/manual-scenario-staff-roster-contract.test.mjs
- scripts/check-manual-scenario-staff-roster-contract.mjs
- scripts/check-stable-staff-roster-identity.mjs
- package.json
- docs/verification/manual-scenario-foundation-manifest.json
- docs/verification/issues/issue-892

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-stable-staff-roster-identity.mjs --stage final --issue 892
- node scripts/check-manual-scenario-staff-roster-contract.mjs --stage final --issue 892
- node scripts/check-manual-scenario-snapshot-contract.mjs --stage final --issue 892
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-892/stable-staff-roster-identity-output.json
- docs/verification/issues/issue-892/staff-roster-rename-proof.json
- docs/verification/issues/issue-892/staff-roster-duplicate-proof.json
- docs/verification/issues/issue-892/scenario-roster-reference-stability-proof.json
- docs/verification/issues/issue-892/test-output/shared.txt
- docs/verification/issues/issue-892/test-output/web.txt
- docs/verification/issues/issue-892/test-output/web-build.txt
- docs/verification/issues/issue-892/test-output/docker-compose-config.txt
- docs/verification/issues/issue-892/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-892/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-892/test-output/docker-compose-production-build-web.txt

## Known Limitations
- Roster identity proof covers reference stability only; it does not evaluate assignment quality or staff capability.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only scenario foundation task.

## Next Recommended Issue
- Issue 893
