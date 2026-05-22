# Local Verification

Run local verification from a stopped Docker state before closing current-stage issues:

```text
docker compose down
node scripts/verify-local.mjs
```

PowerShell users should prefer:

```text
docker compose down
./scripts/verify-local.ps1
```

The verifier checks Docker Compose config, starts the Docker stack, captures service status, runs migrations, executes no-PHI and docs contract checks, runs shared/web/API tests, builds the web app, performs Docker-backed plan API smoke proof, and checks the configured API and web host ports.

Default local endpoints are:

```text
http://localhost:${API_HOST_PORT:-8010}/health
http://localhost:${WEB_HOST_PORT:-5180}
```
