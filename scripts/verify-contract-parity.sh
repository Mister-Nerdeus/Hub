#!/usr/bin/env sh
set -eu

npm --workspace packages/shared test
(cd apps/api && python -m pytest tests/contracts)
node scripts/check-no-phi-fields.mjs
