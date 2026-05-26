# Live Site Runtime Regression Closeout

## Finding

`https://hub.nerdeus.com/` is reachable but serves the Vite development runtime instead of the production nginx static build.

## Evidence

- `test-output/live-site-runtime.txt`
- `docs/verification/live-site-runtime-check-2026-05-26.md`

## Required Deployment Action

Redeploy the origin with `docker-compose.production.yml` or an equivalent nginx/static-assets runtime. The API is healthy, so this is a web runtime deployment issue rather than an API outage.

## Non-PHI

No PHI, EHR data, real patient data, real staff identifiers, medication names, diagnosis text, or clinical notes were introduced.
