# Issue 091 - Optimizer Contract Boundary Only

## Summary
Added optimizer boundary contracts and documentation requiring future candidates to reference shared simulation score IDs.

## Files Changed
See repository diff for shared contracts/builders, tests, fixtures, docs, web proof surfaces, API schemas/routes/models/repositories, migration, evidence gate registration, and README updates related to this issue batch.

## Commands Run
npm --workspace packages/shared test
npm --workspace apps/web test
npm --workspace apps/web run build
cd apps/api && python -m pytest
docker compose config
docker compose down
docker compose up --build -d
docker compose ps
docker compose --profile tools run --rm migrate
$port = if ($env:API_HOST_PORT) { $env:API_HOST_PORT } else { '8010' }; curl -f "http://localhost:$port/health"
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
## Tests Passed
Shared package tests, web tests, web build, API tests, Docker config/startup/migration/health, no-PHI scanner, and docs contract gate are recorded for this batch.

## Evidence Paths
docs/verification/issues/issue-091/optimization-contract-output.json

## Known Limitations
Boundary-only for Issue 091; no ranking or selected winner is part of the boundary shell. Later Issue 092 adds baseline operational optimizer behavior through the shared path.

## Non-PHI Confirmation
Non-PHI rules still pass: synthetic operational IDs only, no real identity data, no EHR integration, no clinical safety certification language, and no patient record workflow.

## Next Recommended Issue
Issue 092 - Baseline Assignment Optimizer V1
