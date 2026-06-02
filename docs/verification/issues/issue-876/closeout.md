# Issue 876 Closeout

## Problem
Assignment Label No-Overclaim Hardening

## Code Review
- Assignment contracts now reject overclaim language in target labels, staff labels, set labels, and assignment notes; scoped manual foundation UI copy and proof artifacts are scanned.

## Files Changed
- apps/web/src/App.tsx
- packages/shared/src/assignments/assignmentLabelNoOverclaim.ts
- packages/shared/src/assignments/assignmentTargetContract.ts
- packages/shared/src/assignments/manualAssignmentSetContract.ts
- packages/shared/src/assignments/manualStaffMemberContract.ts
- packages/shared/src/index.ts
- packages/shared/tests/assignment-label-no-overclaim.test.mjs
- scripts/check-assignment-label-no-overclaim.mjs
- scripts/check-manual-assignment-browser-proof.mjs
- scripts/lib/assignment-foundation-utils.mjs
- docs/project/assignment-foundation-status.md
- docs/verification/assignment-foundation-manifest.json
- package.json
- docs/verification/issues/issue-876

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-assignment-label-no-overclaim.mjs --stage final --issue 876
- node scripts/check-assignment-no-recommendation-guard.mjs --stage final --issue 876
- node scripts/check-manual-assignment-browser-proof.mjs --stage final --issue 876
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-876/assignment-label-no-overclaim-output.json
- docs/verification/issues/issue-876/assignment-target-label-scan-output.json
- docs/verification/issues/issue-876/assignment-ui-copy-scan-output.json
- docs/verification/issues/issue-876/assignment-proof-artifact-scan-output.json
- docs/verification/issues/issue-876/forbidden-label-fixture-output.json
- docs/verification/issues/issue-876/test-output/docker-compose-config.txt
- docs/verification/issues/issue-876/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-876/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-876/test-output/docker-compose-production-build-web.txt

## Known Limitations
- UI copy scan is scoped to the current manual assignment foundation surface, not historical Phase 3 burden/proof components.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only assignment foundation task.
