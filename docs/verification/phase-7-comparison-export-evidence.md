# Phase 7 Comparison and Export Evidence

Phase 7 proves deterministic operational comparison and JSON bundle export contracts using local synthetic operational data only.

## Evidence Scope

- Scenario comparison contract: `docs/contracts/scenario-comparison-contract.md`.
- Manual scenario comparison builder: `packages/shared/src/comparison/buildScenarioComparison.ts`.
- Report export JSON bundle contract: `docs/contracts/report-export-json-bundle-contract.md`.
- Report export JSON bundle builder: `packages/shared/src/export/buildReportExportBundle.ts`.
- API-free comparison proof: `apps/web/src/features/comparison/ScenarioComparisonProof.tsx`.
- TypeScript contract and builder proof: `packages/shared/tests/buildScenarioComparison.test.mjs` and `packages/shared/tests/buildReportExportBundle.test.mjs`.
- Python contract proof: `apps/api/tests/contracts/test_report_export_bundle_contract.py`.
- Local evidence: `docs/verification/issues/issue-063/`.

## Required Artifacts

- `docs/verification/issues/issue-063/comparison-output.json`
- `docs/verification/issues/issue-063/export-bundle-output.json`
- `docs/verification/issues/issue-063/screenshots/comparison-proof.png`
- `docs/verification/issues/issue-063/validation-output.txt`
- `docs/verification/issues/issue-063/commands.txt`
- `docs/verification/issues/issue-063/closeout.md`

## Guardrails

- No optimizer.
- No recommendation engine.
- No clinical safety claims.
- No API endpoints.
- No persistence.
- No PDF export.
- No route calculation.
- No delay calculation.
- No task-completion simulation.
- No PHI.

## Local Verification

Phase 7 closeout requires local verification from a stopped Docker state:

```text
docker compose down
node scripts/verify-local.mjs
node scripts/check-docs-contracts.mjs
```

The docs checker hard-gates this evidence file and the Issue 063 artifacts.
