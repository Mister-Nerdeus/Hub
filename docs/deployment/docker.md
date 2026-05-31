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

The automated production-shaped Docker guard is:

```sh
node scripts/check-production-docker-runtime.mjs --smoke
```

`docker-compose.production.yml` uses:

- `apps/api/Dockerfile.production`
- `apps/web/Dockerfile.production`

Production-shaped web host ports stay environment-driven:

- `WEB_HOST_PORT`, default `80`

## Non-Claims

These Dockerfiles do not deploy the app, add auth, configure DNS, or certify production readiness.

## Batch 401-420 Editor Review Note

The editor usability and canvas popup changes remain within the existing Docker build paths. The web images copy `apps/web` and `packages/shared`, so shared editor helpers such as layout object duplication are included without adding dependencies or changing runtime services.

## Batch 669-693 Door And Split-Room Authoring Note

Split-room closeout hardening remains within the existing local and production-shaped Docker build paths. The web images copy `apps/web` and `packages/shared`, so the split-room resolver, atomic creation model, persistence contract, UI workflow, and final closeout validators ship without adding services or dependencies. This batch previously used the `split-room-closeout-hardening-689-693` Docker revision label for local proof traceability only.

## Batch 694-703 Active Floorplan Workflow Note

The active floorplan workflow remains within the existing local and production-shaped Docker build paths. The web images copy `apps/web` and `packages/shared`, so the active floorplan contract, selector, version history, readiness checklist, banner, confirmation guard, persistence helper, and local validators ship without adding services or dependencies. That batch used the `active-floorplan-workflow-694-703` revision label for local Docker proof traceability only.

The editor/assignment UX workflow remains within the existing Docker build paths. The web images copy `apps/web` and `packages/shared`, so the product shell, active floorplan hub, normal editor toolbar, assignment set persistence, nurse profile builder, structured room-load editor, manual assignment layout, and scenario handoff ship without adding services or dependencies. The API and web images carry the `editor-assignment-ux-704-713` revision label for local Docker proof traceability only.
