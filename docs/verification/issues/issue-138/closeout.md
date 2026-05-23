# Issue 138 Closeout

## Summary
- Added builder registry helpers for known canonical metrics and registered dynamic metric prefixes.
- Updated current outcome builders to derive group, unit, directionality, source, and scope from the operational metric registry instead of duplicating those fields.
- Added registry alignment tests covering current outcome builder fixtures, neutral throughput/direct-work directionality, and unknown dynamic prefix rejection.

## Files changed
- `packages/shared/src/outcomes/outcomeMetricsBuilder.ts`
- `packages/shared/src/outcomes/nurseWalkLayoutFrictionSummary.ts`
- `packages/shared/src/outcomes/taskTimeQueueSummary.ts`
- `packages/shared/src/outcomes/patientWaitIdleProxy.ts`
- `packages/shared/src/outcomes/roomTurnoverBlockedTimeProxy.ts`
- `packages/shared/src/outcomes/nurseTaskBurdenSummary.ts`
- `packages/shared/tests/outcome-builders-registry-alignment.test.mjs`
- `packages/shared/fixtures/outcomes/nurse-walk-layout-friction-summary-basic.json`
- `packages/shared/fixtures/outcomes/task-time-queue-summary-basic.json`
- `packages/shared/fixtures/outcomes/room-turnover-blocked-time-proxy-basic.json`
- `packages/shared/fixtures/outcomes/nurse-task-burden-summary-basic.json`
- `docs/verification/issues/issue-138/commands.txt`
- `docs/verification/issues/issue-138/command-output-map.json`
- `docs/verification/issues/issue-138/builder-registry-alignment-output.json`
- `docs/verification/issues/issue-138/test-output/shared.txt`
- `docs/verification/issues/issue-138/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- Reproduction: `node --input-type=module -e "...buildNurseTaskBurdenSummary...getOperationalMetricDirectionality..."`
- `npm --workspace packages/shared test`
- `node --test packages/shared/tests/task-time-queue-summary.test.mjs`
- `node --test packages/shared/tests/nurse-task-burden-summary.test.mjs`
- `node --test packages/shared/tests/outcome-builders-registry-alignment.test.mjs`
- `node --test packages/shared/tests/nurse-walk-layout-friction-summary.test.mjs`
- `node --test packages/shared/tests/room-turnover-blocked-time-proxy.test.mjs`
- `node --test packages/shared/tests/patient-wait-idle-proxy.test.mjs`
- `node --test packages/shared/tests/operational-delta-comparison.test.mjs`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `docker compose down`
- `node scripts/verify-local.mjs`

## Tests passed/failed
- Failed before implementation: nurse task burden builder emitted `lower_is_better` for direct task minutes, completed task count, and assigned task count while the registry required neutral directionality.
- Failed during implementation: fixture assertions still expected old alias IDs and lower-is-better direct-work directionality; fixtures and targeted assertions were updated to canonical registry output.
- Passed: `npm --workspace packages/shared test`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Passed: `node scripts/verify-local.mjs` from a stopped Docker stack, including Docker compose build/start, migration, shared tests, web tests, API tests, web build, Docker plan API smoke proof, health check, and web runtime check.
- Failed after final patching: none

## Evidence artifacts
- `docs/verification/issues/issue-138/commands.txt`
- `docs/verification/issues/issue-138/command-output-map.json`
- `docs/verification/issues/issue-138/builder-registry-alignment-output.json`
- `docs/verification/issues/issue-138/test-output/shared.txt`

## Known limitations
- Dashboard proof data still uses the existing shared proof data shape; Issue 139 moves dashboard proof generation behind a shared builder.
- No Dockerfile or compose-file changes were required; Docker images were rebuilt by the local verifier.

## Next Recommended Issue
- Issue 139 - Dashboard Proof Data Generated from Shared Outcome Builders.

## Non-PHI Confirmation
- Builder alignment uses operational metric metadata only.
- No real identity, diagnosis text, clinical note fields, EHR integration, safety certification wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
