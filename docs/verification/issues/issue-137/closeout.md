# Issue 137 Closeout

## Summary
- Added a canonical operational metric registry with canonical IDs, aliases, labels, groups, units, directionality, source, scope, metric kind, and purpose fields.
- Updated operational delta comparison to resolve known metric aliases and derive known metric directionality from the registry.
- Added regression coverage for the false-improvement case where lower completed task throughput was previously labeled improved.

## Files changed
- `packages/shared/src/outcomes/operationalMetricRegistry.ts`
- `packages/shared/src/outcomes/operationalMetricContract.ts`
- `packages/shared/src/outcomes/operationalDeltaComparison.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/operational-metric-registry.test.mjs`
- `packages/shared/tests/operational-delta-comparison.test.mjs`
- `packages/shared/fixtures/outcomes/operational-metric-registry.json`
- `packages/shared/fixtures/outcomes/operational-delta-comparison-basic.json`
- `docs/verification/issues/issue-137/commands.txt`
- `docs/verification/issues/issue-137/command-output-map.json`
- `docs/verification/issues/issue-137/operational-metric-registry-output.json`
- `docs/verification/issues/issue-137/test-output/shared.txt`
- `docs/verification/issues/issue-137/closeout.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `scripts/phase-evidence-gates.mjs`
- `README.md`

## Commands run
- `npm --workspace packages/shared run build`
- Reproduction: `node --input-type=module -e "...completed_task_count_by_nurse_alpha..."`
- `npm --workspace packages/shared test`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `docker compose down`
- `node scripts/verify-local.mjs`

## Tests passed/failed
- Failed before implementation: completed task count 10 to 5 with incoming `lower_is_better` returned `improved`.
- Failed during implementation: first Docker verifier run exposed the dashboard proof still consuming hyphen metric aliases; delta output now preserves matched aliases while using registry directionality.
- Passed: `npm --workspace packages/shared test`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Passed: `node scripts/verify-local.mjs` from a stopped Docker stack, including Docker compose build/start, migration, shared tests, web tests, API tests, web build, and Docker plan API smoke proof.
- Failed after final patching: none

## Evidence artifacts
- `docs/verification/issues/issue-137/commands.txt`
- `docs/verification/issues/issue-137/command-output-map.json`
- `docs/verification/issues/issue-137/operational-metric-registry-output.json`
- `docs/verification/issues/issue-137/test-output/shared.txt`
- `packages/shared/fixtures/outcomes/operational-metric-registry.json`

## Known limitations
- Outcome builders still emit their current metric IDs and directionality directly; Issue 138 applies the registry to builders.
- The dashboard proof data still uses the existing shared proof data shape; Issue 139 moves generation behind a shared builder.
- No Dockerfile or compose-file changes were required; Docker images were rebuilt by the local verifier.

## Next Recommended Issue
- Issue 138 - Apply Metric Registry to Outcome Builders.

## Non-PHI Confirmation
- The registry contains operational metric metadata only.
- No real identity, diagnosis text, clinical note fields, EHR integration, safety certification wording, or recommendation wording was introduced.
- The no-PHI scanner passed locally.
