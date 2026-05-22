$ErrorActionPreference = "Stop"

npm --workspace packages/shared test
Push-Location apps/api
python -m pytest tests/contracts
Pop-Location
node scripts/check-no-phi-fields.mjs
