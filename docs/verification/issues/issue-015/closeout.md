# Issue 015 Closeout

## Summary
Docker Compose now uses configurable host ports while preserving stable container ports. API defaults to host `8010`, web defaults to host `5180`, and Postgres remains internal with no published host port.

## Final Selected Host Ports
- API: `8010`
- Web: `5180`
- DB: internal only, container `5432`

## Files Changed
- `docker-compose.yml`
- `.env.example`
- `README.md`
- `apps/api/app/settings.py`
- `docs/contracts/environment-contract.md`
- `docs/contracts/local-port-contract.md`
- `scripts/verify-local.mjs`
- `scripts/verify-local.ps1`
- `scripts/verify-local.sh`

## Commands Run
See `docs/verification/issues/issue-015/commands.txt`.

## Tests Passed
- `node scripts/verify-local.mjs`
- API health through `http://localhost:8010/health`
- Web reachability through `http://localhost:5180`

## Evidence Artifacts
- `docs/verification/issues/issue-015/failure-reproduction.txt`
- `docs/verification/issues/issue-015/port-inventory.txt`
- `docs/verification/issues/issue-015/docker-compose-config.txt`
- `docs/verification/issues/issue-015/docker-compose-ps.txt`
- `docs/verification/issues/issue-015/api-health.json`

## Known Limitations
- Postgres is intentionally not reachable from the host unless a later issue adds an explicit debug exposure path.

## Non-PHI Confirmation
Non-PHI scanner passes; no PHI, real patient identity, EHR integration, or clinical safety certification language was added.
