# Live Site Runtime Check - 2026-05-25

## Public Check

Checked `https://hub.nerdeus.com/` through Cloudflare.

Observed public DNS answers:

- `104.21.13.179`
- `172.67.132.233`
- Cloudflare authoritative DNS for `nerdeus.com`

Observed public root response:

- HTTP `200`
- `Server: cloudflare`
- `cf-cache-status: DYNAMIC`
- Root HTML contained Vite development runtime references:
  - `/@vite/client`
  - `/src/main.tsx`

Observed public API response:

- `https://hub.nerdeus.com/health` returned `{"status":"ok","service":"nerdeus-api"}`

## Diagnosis

Cloudflare is reaching an origin, but the origin is serving the Vite development web runtime instead of the production static web build. The current public `/health` path works because the Vite dev server proxies API requests.

## Fix Added

- Added production nginx config for the web image.
- Added same-origin nginx proxy rules for `/health` and `/v1/`.
- Added `docker-compose.production.yml` using production Dockerfiles.
- Updated the production API image to include Alembic config and migrations.
- Added a Codex drift trap forbidding public web traffic from using the Vite development server.

## Production-Shaped Verification

Ran an isolated production-shaped stack with:

```text
WEB_HOST_PORT=5190 docker compose -p hub-prod-check -f docker-compose.production.yml up --build -d
docker compose -p hub-prod-check -f docker-compose.production.yml --profile tools run --rm migrate
curl http://localhost:5190/
curl http://localhost:5190/health
curl http://localhost:5190/v1/plans
```

Results:

- Production root served nginx static HTML.
- Production root contained no `/@vite/client` or `/src/main.tsx`.
- `/health` returned API health JSON.
- `/v1/plans` returned HTTP `200` with JSON.

## Deployment Note

The live site will continue serving the Vite development runtime until the origin host is redeployed with `docker-compose.production.yml` or equivalent production web routing.

## Non-Claims

This check does not certify production readiness, security hardening, clinical safety, staffing compliance, legal compliance, PHI support, or EHR integration.
