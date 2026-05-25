# Docker

## Local Proof Docker

Local verification uses Docker for repeatable proof, migrations, and runtime smoke checks. This path remains local-first and is the source of truth for this project stage.

```sh
docker compose config
docker compose up --build -d
docker compose --profile tools run --rm migrate
node scripts/verify-local.mjs
```

`docker-compose.yml` uses:

- `apps/api/Dockerfile.local`
- `apps/web/Dockerfile.local`

Local host ports stay environment-driven:

- `API_HOST_PORT`, default `8010`
- `WEB_HOST_PORT`, default `5180`

## Production-Shaped Docker

Production-shaped builds are separate from local proof Docker.

```sh
docker build -f apps/api/Dockerfile.production .
docker build -f apps/web/Dockerfile.production .
```

The production API image installs `apps/api/requirements.txt` only. It does not install `requirements-dev.txt`, pytest, or httpx.

The production web image builds static assets and serves them with nginx. It does not run the Vite development server. Its nginx config serves the web build and reverse-proxies same-origin `/health` and `/v1/` requests to the API service.

Use the production compose file for production-shaped runtime checks:

```sh
docker compose -f docker-compose.production.yml config
docker compose -f docker-compose.production.yml up --build -d
docker compose -f docker-compose.production.yml --profile tools run --rm migrate
```

`docker-compose.production.yml` uses:

- `apps/api/Dockerfile.production`
- `apps/web/Dockerfile.production`

Production-shaped web host ports stay environment-driven:

- `WEB_HOST_PORT`, default `80`

## Non-Claims

These Dockerfiles do not deploy the app, add auth, configure DNS, or certify production readiness.
