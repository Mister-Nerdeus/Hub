$ErrorActionPreference = "Stop"

docker compose config
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
npm --workspace packages/shared test
python -m pytest apps/api/tests
npm --workspace apps/web run build
