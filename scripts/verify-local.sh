#!/usr/bin/env sh
set -eu

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

API_HOST_PORT="${API_HOST_PORT:-8010}"
WEB_HOST_PORT="${WEB_HOST_PORT:-5180}"
API_URL="http://localhost:${API_HOST_PORT}"
WEB_URL="http://localhost:${WEB_HOST_PORT}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-$API_URL}"
CORS_ORIGINS="${CORS_ORIGINS:-$WEB_URL,http://localhost:5173,http://localhost:5174}"

if [ "$VITE_API_BASE_URL" != "$API_URL" ]; then
  echo "VITE_API_BASE_URL must be $API_URL, got $VITE_API_BASE_URL" >&2
  exit 1
fi

case ",$CORS_ORIGINS," in
  *",$WEB_URL,"*) ;;
  *)
    echo "CORS_ORIGINS must include $WEB_URL" >&2
    exit 1
    ;;
esac

if grep -Eq '^[[:space:]]*-[[:space:]]*["'\'']?[0-9]+:8000["'\'']?[[:space:]]*$|^[[:space:]]*-[[:space:]]*["'\'']?[0-9]+:5173["'\'']?[[:space:]]*$' docker-compose.yml; then
  echo "docker-compose.yml must use API_HOST_PORT and WEB_HOST_PORT for host ports" >&2
  exit 1
fi

docker compose config
docker compose --profile tools run --rm migrate
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
npm --workspace packages/shared test
npm --workspace apps/web test
(cd apps/api && python -m pytest)
npm --workspace apps/web run build
node scripts/verify-docker-plan-api.mjs
curl -f "$API_URL/health"
curl -f "$WEB_URL"
