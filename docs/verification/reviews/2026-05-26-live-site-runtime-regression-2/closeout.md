# Live Site Runtime Regression 2 - 2026-05-26

## Summary
`https://hub.nerdeus.com/` is reachable, but the public root is serving the Vite development runtime. The API paths still work.

## Diagnosis
The live root returned HTML containing `/@vite/client`, `/@react-refresh`, and `/src/main.tsx`, with no built `/assets/index-*.js` bundle. This means the origin web runtime is still the local/Vite server or equivalent dev-runtime deployment.

The production-shaped Docker path in this repository passed local smoke verification with nginx static assets and same-origin API proxying.

## Required Origin Action
Run this on the origin host or equivalent deployment target:

```text
git pull
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up --build -d
docker compose -f docker-compose.production.yml --profile tools run --rm migrate
node scripts/check-live-site-runtime.mjs --url https://hub.nerdeus.com/
```

## Files Changed
- `docs/codex/drift-traps.md`
- `docs/verification/reviews/2026-05-26-live-site-runtime-regression-2/`

## Commands Run
- See `commands.txt`.

## Tests Passed/Failed
- Failed: public live-site runtime check, because the root serves Vite development runtime references.
- Passed: production Docker runtime smoke.
- Passed: no-PHI scanner.
- Passed: docs contracts.

## Evidence Artifacts
- `test-output/live-site-runtime.txt`
- `test-output/production-docker-runtime.txt`
- `test-output/no-phi.txt`
- `test-output/docs-gate.txt`

## Known Limitations
- No origin deployment credentials or remote Docker context are available in this workspace, so I could not restart the public host.
- This does not claim production readiness, security hardening, clinical safety, staffing compliance, PHI support, or EHR integration.

## Non-PHI Confirmation
Non-PHI rules still pass. This review touched deployment guardrails and evidence only.
