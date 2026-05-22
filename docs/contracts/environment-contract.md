# Environment Contract

The local stack is configured by `.env` values with `.env.example` as the public template.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `APP_ENV` | Yes | `local` | Runtime environment label. |
| `API_HOST` | Yes | `0.0.0.0` | FastAPI bind host for containers. |
| `API_PORT` | Yes | `8000` | FastAPI bind port. |
| `DATABASE_URL` | Yes | `postgresql+psycopg://hub:hub@db:5432/hub` | SQLAlchemy database URL. |
| `POSTGRES_DB` | Yes | `hub` | Local Postgres database name. |
| `POSTGRES_USER` | Yes | `hub` | Local Postgres user. |
| `POSTGRES_PASSWORD` | Yes | `hub` | Local Postgres password. |
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000` | Browser API base URL for the web shell. |

Do not store secrets, PHI, or real operational data in `.env.example`.
