# Issue 027 Closeout

## Summary
Updated all local verifier entrypoints so they start Docker with `docker compose up --build -d`, capture service status with `docker compose ps`, then run migrations and local checks. Verification now passes from `docker compose down`.

## Files Changed
- `scripts/verify-local.mjs`
- `scripts/verify-local.ps1`
- `scripts/verify-local.sh`
- `README.md`
- `docs/contracts/local-port-contract.md`
- `docs/contracts/local-first-verification-contract.md`
- `docs/verification/issues/issue-027/closeout.md`
- `docs/verification/issues/issue-027/commands.txt`
- `docs/verification/issues/issue-027/failure-reproduction.txt`
- `docs/verification/issues/issue-027/verify-local-output.txt`
- `docs/verification/issues/issue-027/docker-compose-ps.txt`
- `docs/verification/issues/issue-027/docker-plan-api-output.txt`

## Commands Run
See `commands.txt`.

## Tests Passed/Failed
Passed after implementation: `node scripts/verify-local.mjs` from a stopped Docker state and `./scripts/verify-local.ps1` from a stopped Docker state. Pre-fix reproduction failed with `ECONNREFUSED` at the Docker plan API smoke step, confirming the hidden runtime dependency.

## Evidence
- `docs/verification/issues/issue-027/failure-reproduction.txt`
- `docs/verification/issues/issue-027/verify-local-output.txt`
- `docs/verification/issues/issue-027/docker-compose-ps.txt`
- `docs/verification/issues/issue-027/docker-plan-api-output.txt`

## Known Limitations
The verifier leaves the Docker stack running after successful verification for local inspection. Postgres remains internal and unpublished on the host.

## Non-PHI Confirmation
`node scripts/check-no-phi-fields.mjs` passed inside local verification and direct guardrail checks.

## Next Recommended Issue
Use the local verifier as the required runtime proof for later issues.
