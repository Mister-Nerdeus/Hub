# Live Site Runtime Check - 2026-05-26

## Public Check

Checked `https://hub.nerdeus.com/` after the user reported that the site was not working again.

Observed public root response:

- HTTP `200`
- Root HTML contained Vite development runtime references:
  - `/@vite/client`
  - `/@react-refresh`
  - `/src/main.tsx`
- Root HTML did not reference a built `/assets/index-*.js` production bundle.

Observed public API responses:

- `https://hub.nerdeus.com/health` returned API health JSON.
- `https://hub.nerdeus.com/v1/plans` returned plans JSON.

## Diagnosis

The public domain is reachable and the API is healthy, but the web root is serving the Vite development runtime instead of the nginx static production build. This matches the prior Docker runtime drift pattern.

## Guardrail Added

- Added `scripts/check-live-site-runtime.mjs`.
- Updated `docs/codex/drift-traps.md` to require treating Vite dev runtime references on the public site as a live misdeployment even when API health works.

## Required Origin Fix

Redeploy the origin host with the production-shaped Docker stack or equivalent static web runtime:

```text
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up --build -d
docker compose -f docker-compose.production.yml --profile tools run --rm migrate
node scripts/check-live-site-runtime.mjs
```

## Non-Claims

This check does not certify production readiness, security hardening, clinical safety, staffing compliance, legal compliance, PHI support, or EHR integration.
