# Issue 004 Closeout

## Summary
- Added Docker Compose for Postgres, FastAPI, and Vite web shell services.
- Adjusted host port mappings to avoid local conflicts while keeping container networking stable.

## Files Changed
- `docker-compose.yml`
- `.dockerignore`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `.env.example`

## Commands Run
```text
docker compose config
docker compose up --build -d
docker compose ps
curl -f http://localhost:8000/health
```

## Tests Passed
- `docker compose config` passed.
- `docker compose up --build -d` passed after removing unnecessary DB host publishing and moving host web port to `5174`.
- `docker compose ps` showed `db`, `api`, and `web` running.
- `curl -f http://localhost:8000/health` returned `{"status":"ok","service":"nerdeus-api"}`.

## Tests Failed
- Initial Compose startup failed because host ports `5432` and `5173` were already allocated. Compose was corrected and rerun successfully.

## Evidence Paths
- `docs/verification/issues/issue-004/closeout.md`

## Known Limitations
- The web service is published at `http://localhost:5174` on this host to avoid a `5173` conflict.

## Non-PHI Confirmation
- Non-PHI rules pass by scanner and inspection.

## Next Recommended Issue
- Issue 005.
