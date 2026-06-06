# Issue 891 Closeout

## Problem
Stable Scenario Identity on Rename

## Code Review
- Manual scenario identity is now an explicit stable ID; rename only changes label and updatedAtIso, while duplicate allocates a new stable scenario ID.

## Files Changed
- packages/shared/src/scenarios/manualScenarioContract.ts
- packages/shared/src/scenarios/manualScenarioValidation.ts
- apps/web/src/features/manual-scenario/manualScenarioState.ts
- apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts
- packages/shared/tests/manual-scenario-contract.test.mjs
- packages/shared/tests/manual-scenario-reference-validation.test.mjs
- scripts/check-manual-scenario-contract.mjs
- scripts/check-manual-scenario-validation.mjs
- scripts/check-manual-scenario-save-reload-proof.mjs
- scripts/check-stable-manual-scenario-identity.mjs
- package.json
- docs/verification/manual-scenario-foundation-manifest.json
- docs/verification/issues/issue-891

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-stable-manual-scenario-identity.mjs --stage final --issue 891
- node scripts/check-manual-scenario-contract.mjs --stage final --issue 891
- node scripts/check-manual-scenario-snapshot-contract.mjs --stage final --issue 891
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-891/stable-manual-scenario-identity-output.json
- docs/verification/issues/issue-891/scenario-rename-before.json
- docs/verification/issues/issue-891/scenario-rename-after.json
- docs/verification/issues/issue-891/scenario-snapshot-reference-stability-proof.json
- docs/verification/issues/issue-891/test-output/shared.txt
- docs/verification/issues/issue-891/test-output/web.txt
- docs/verification/issues/issue-891/test-output/web-build.txt
- docs/verification/issues/issue-891/test-output/docker-compose-config.txt
- docs/verification/issues/issue-891/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-891/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-891/test-output/docker-compose-production-build-web.txt

## Known Limitations
- Stable scenario IDs are generated locally and deterministically; Issue 894 handles runtime clock injection separately.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only scenario foundation task.
