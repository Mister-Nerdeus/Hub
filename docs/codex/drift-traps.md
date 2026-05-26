# Drift Traps

Use this document when a task starts to drift beyond the project boundaries.

## Clinical Language Drift

- Use `occupied room`, not named patients.
- Use `room load` or `abstract patient load`, not diagnoses, chief complaints, or clinical notes.
- Use `simulated operational burden`, not patient outcome prediction.
- Use disclaimers for scoring and reports. Do not imply clinical safety certification.

## Scope Drift

- Do not build simulation before saved plans, scenarios, assignments, and scoring are ready.
- Do not build optimization before the scoring API is complete.
- Do not add EHR import, PHI fields, real patient identity, or clinical documentation workflows.
- Do not persist UI-only selection state in saved plan JSON.

## Contract Drift

- Keep TypeScript schemas, Python contracts, fixtures, and API examples in parity.
- Keep plan exports deterministic with stable ordering.
- Keep coordinate origin, units, grid snapping, and `pixelsPerUnit` conversion rules explicit.
- Keep Phase 7 comparison report-centric. Do not rename `baselineReportId` and `reportIds` back to raw scenario fields such as `baselineScenarioId` or `comparedScenarioIds`; scenario IDs remain in comparison items.

## Docker Runtime Drift

- Do not point public or production-shaped web traffic at `apps/web/Dockerfile.local` or the Vite development server.
- Keep local proof Docker and production-shaped Docker separate: `docker-compose.yml` remains local-first, while `docker-compose.production.yml` must use production Dockerfiles.
- Production-shaped web runtime must serve built static assets through nginx and proxy same-origin `/health` and `/v1/` requests to the API service.
- If `https://hub.nerdeus.com/` contains `/@vite/client`, `/@react-refresh`, `/src/main.tsx`, or `/node_modules/.vite`, treat the live site as misdeployed even when `/health` works. Run `node scripts/check-live-site-runtime.mjs` and redeploy the origin with `docker-compose.production.yml` or an equivalent nginx/static-assets runtime before closing.

## Evidence Drift

- Do not close an issue with only a summary.
- Include commands, test results, evidence paths, known limitations, and non-PHI confirmation.
- If the user corrects recurring behavior, update the relevant guardrail doc before closing.
