# Local Verification

Run these checks before closing foundation issues:

```text
docker compose config
docker compose up --build -d
docker compose ps
curl -f http://localhost:8000/health
cd apps/api && pytest
cd apps/web && npm run build
cd packages/shared && npm test
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
```

PowerShell users can also run:

```text
./scripts/verify-local.ps1
```
