# Issue 009 Closeout

## Summary
- Added baseline CI for Node workspace checks, API tests, web build, non-PHI scanning, docs contracts, and Docker Compose config.

## Files Changed
- `.github/workflows/ci.yml`

## Commands Run
```text
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
cd packages/shared && npm test
cd apps/web && npm run build
cd apps/api && pytest
docker compose config
```

## Tests Passed
- Node checks passed locally.
- API tests passed locally.
- Web build passed locally.
- Compose config passed locally.

## Tests Failed
- Bare `pytest` required a PATH adjustment on this Windows host. CI uses `python -m pytest`.

## Evidence Paths
- `docs/verification/issues/issue-009/closeout.md`

## Known Limitations
- CI has not run on GitHub yet because this commit is not pushed until the end of the batch.

## Non-PHI Confirmation
- Non-PHI rules pass by scanner and inspection.

## Next Recommended Issue
- Issue 010.
