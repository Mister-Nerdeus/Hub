# Issue 192 Closeout

## Summary

Split local proof Docker from production-shaped Docker. Local compose now points at explicit `.local` Dockerfiles while production-shaped API and web Dockerfiles build separately.

## Working Discipline

1. Reproduced the pre-fix failure: the API Dockerfile installed dev requirements and the web Dockerfile ran the Vite dev server.
2. Implemented the smallest bounded fix: explicit local Dockerfiles plus separate production-shaped Dockerfiles.
3. Added positive verification through local compose build/status and production Docker builds.
4. Ran required gates and captured outputs.
5. Added command-output evidence under this issue directory.
6. Updated `docs/verification/ISSUE_EVIDENCE_INDEX.json`.
7. Listed non-claims below.
8. No deferred follow-up issues for this issue.

## Files Changed

- `apps/api/Dockerfile`
- `apps/api/Dockerfile.local`
- `apps/api/Dockerfile.production`
- `apps/web/Dockerfile`
- `apps/web/Dockerfile.local`
- `apps/web/Dockerfile.production`
- `docker-compose.yml`
- `docs/deployment/docker.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-192/*`

## Commands Run

- `docker compose config`
- `docker compose up --build -d`
- `docker compose ps`
- `docker build -f apps/api/Dockerfile.production .`
- `docker build -f apps/web/Dockerfile.production .`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/verify-local.mjs`

## Tests Passed

- Local compose config passed.
- Local compose build and service status passed.
- Production-shaped API Docker build passed.
- Production-shaped web Docker build passed.
- Docs contract gate passed.
- Full local verification passed.

## Evidence Artifacts

- `first-failure.txt`
- `docker-local-output.txt`
- `docker-production-build-output.txt`
- `test-output/docs-gate.txt`
- `test-output/verify-local.txt`

## Known Limitations

- Production-shaped Docker builds are build proofs only; they do not deploy the app.
- No auth, DNS, Cloudflare, or Railway configuration is added.
- Production web API URL still needs deployment-time configuration.

## Next Recommended Issue

Proceed to Issue 193, API error code contract V1.

## Non-Claims

- No production readiness certification.
- No deployment to Railway.
- No Cloudflare configuration.
- No auth.
- No product behavior change.

## Non-PHI Confirmation

No PHI fields or support were added. This issue only changes Docker build boundaries and deployment documentation.
