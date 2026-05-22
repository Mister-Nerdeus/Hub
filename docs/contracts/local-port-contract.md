# Local Port Contract

Local development runs the web app, API, and database together with Docker Compose.

Container ports stay stable:

- API container port: `8000`
- Web container port: `5173`
- Postgres container port: `5432`

Host ports are configurable:

- `API_HOST_PORT` defaults to `8010`
- `WEB_HOST_PORT` defaults to `5180`

`VITE_API_BASE_URL` must match the configured API host port. With defaults, it is `http://localhost:8010`.

`CORS_ORIGINS` must include the configured web host origin. With defaults, it includes `http://localhost:5180`.

Postgres is internal to Docker Compose by default. Do not publish host port `5432` unless a later issue explicitly documents an intentional local debugging exception.

Run database migrations inside the Docker network:

```text
docker compose up --build -d
docker compose ps
docker compose --profile tools run --rm migrate
```

Docker-backed plan API proof uses the configured API host port and does not require publishing Postgres to the host.
The local verifier must start the Docker stack itself before migrations and API smoke checks so verification passes from a stopped Docker state.
