# Environment Contract

The local stack is configured by `.env` values with `.env.example` as the public template.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `APP_ENV` | Yes | `local` | Runtime environment label. |
| `API_HOST` | Yes | `0.0.0.0` | FastAPI bind host for containers. |
| `API_PORT` | Yes | `8000` | FastAPI bind port. |
| `API_HOST_PORT` | Yes | `8010` | Host port published to the API container port `8000`. |
| `WEB_HOST_PORT` | Yes | `5180` | Host port published to the web container port `5173`. |
| `DATABASE_URL` | Yes | `postgresql+psycopg://hub:hub@db:5432/hub` | SQLAlchemy database URL. Plan layout persistence uses `plans.layout_json`; PostgreSQL stores it as JSONB. |
| `POSTGRES_DB` | Yes | `hub` | Local Postgres database name. |
| `POSTGRES_USER` | Yes | `hub` | Local Postgres user. |
| `POSTGRES_PASSWORD` | Yes | `hub` | Local Postgres password. |
| `VITE_API_BASE_URL` | Yes | `http://localhost:8010` | Browser API base URL for the web shell. Must match `API_HOST_PORT`. |
| `CORS_ORIGINS` | Yes | `http://localhost:5180,http://localhost:5173,http://localhost:5174` | Allowed browser origins. Must include the configured `WEB_HOST_PORT` origin. |

See [local-port-contract.md](local-port-contract.md) for Docker host port rules. Postgres is not published on the host by default.
Run migrations with `docker compose --profile tools run --rm migrate`; do not publish Postgres just to apply local migrations.

Do not store secrets, PHI, or real operational data in `.env.example`.
