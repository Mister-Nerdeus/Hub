# Issue 187 Closeout

## Summary
- Reproduced the TypeScript/Python simulation contract drift with a TypeScript-valid generated run containing `busyUntilMinute`.
- Added Python schema parity for nurse `busyUntilMinute` and event-specific strict key validation.
- Added canonical positive and negative parity fixtures and API validation/persistence tests for the same fixture.
- Wired simulation contract parity into local verification.

## Files changed
- `apps/api/app/schemas/simulation.py`
- `apps/api/app/routes/simulation.py`
- `apps/api/tests/test_simulation_contract.py`
- `apps/api/tests/test_simulation_contract_parity.py`
- `apps/api/tests/test_simulation_persistence.py`
- `packages/shared/fixtures/simulation-contract-parity/manifest.json`
- `packages/shared/fixtures/simulation-contract-parity/valid-nurse-busy-until.json`
- `packages/shared/fixtures/simulation-contract-parity/invalid-extra-event-field.json`
- `packages/shared/fixtures/simulation-contract-parity/invalid-phi-like-key.json`
- `packages/shared/fixtures/simulation-contract-parity/invalid-clinical-recommendation-text.json`
- `packages/shared/tests/simulation-contract-parity.test.mjs`
- `scripts/verify-local.mjs`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-110/parity-manifest-output.json`
- `docs/verification/issues/issue-187/*`

## Commands run
- `npm --workspace packages/shared run build; node <typescript parity probe>; python <python parity probe> > docs/verification/issues/issue-187/first-failure.txt`
- `node scripts/check-simulation-contract-parity.mjs > docs/verification/issues/issue-187/parity-output.json`
- `npm --workspace packages/shared test > docs/verification/issues/issue-187/test-output/shared.txt`
- `cd apps/api && python -m pytest > ../../docs/verification/issues/issue-187/test-output/api.txt`
- `node scripts/check-no-phi-fields.mjs > docs/verification/issues/issue-187/test-output/no-phi.txt`
- `node scripts/check-docs-contracts.mjs | Tee-Object -FilePath docs/verification/issues/issue-187/test-output/docs-gate.txt -Append`
- `node scripts/verify-local.mjs > docs/verification/issues/issue-187/test-output/verify-local.txt`

## Tests passed/failed
- Passed: `npm --workspace packages/shared test`
- Passed: `cd apps/api && python -m pytest`
- Passed: `node scripts/check-no-phi-fields.mjs`
- Passed: `node scripts/check-docs-contracts.mjs`
- Passed: `node scripts/verify-local.mjs`
- Failed after final patching: none.

## Evidence artifacts
- `docs/verification/issues/issue-187/first-failure.txt`
- `docs/verification/issues/issue-187/parity-output.json`
- `docs/verification/issues/issue-187/api-validation-output.json`
- `docs/verification/issues/issue-187/api-persistence-output.json`
- `docs/verification/issues/issue-187/negative-extra-field-output.json`
- `docs/verification/issues/issue-187/negative-no-phi-output.json`
- `docs/verification/issues/issue-187/negative-clinical-text-output.json`
- `docs/verification/issues/issue-187/test-output/shared.txt`
- `docs/verification/issues/issue-187/test-output/api.txt`
- `docs/verification/issues/issue-187/test-output/no-phi.txt`
- `docs/verification/issues/issue-187/test-output/docs-gate.txt`
- `docs/verification/issues/issue-187/test-output/verify-local.txt`

## Known limitations
- The parity fixture proves the current simulation run event contract only; it does not add simulation behavior.
- API persistence equality is proven for the canonical busy-until fixture, which avoids explicit null optional fields.
- Follow-up issue: Issue 193 will harden API error code shapes for validation failures.

## Next Recommended Issue
- Issue 188: Layout Workspace Bounds and Continuous Grid.

## Non-PHI Confirmation
- The new fixtures use synthetic operational IDs, abstract task IDs, and synthetic nurse labels only.
- Negative no-PHI fixtures contain blocked key names only and do not contain real identity values.
- No PHI support, EHR integration, clinical safety claim, optimizer behavior, or report behavior was introduced.
- The no-PHI scanner passed locally.
