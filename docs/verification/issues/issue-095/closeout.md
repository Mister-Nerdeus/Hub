# Issue 095 - Simulation API Validation Endpoint

## Summary
Added validation-only API route for operational simulation payloads with deterministic response shape and PHI-like key rejection.

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
docs/verification/issues/issue-095/api-responses/simulation-validate-response.json

## Known Limitations
Validation route does not persist, start jobs, call optimizer logic, accept file uploads, or export data.

## Non-PHI Confirmation
Non-PHI rules still pass: synthetic operational IDs only, no real identity data, no EHR integration, no clinical safety certification language, and no patient record workflow.

## Next Recommended Issue
Issue 096 - Simulation Run Persistence
