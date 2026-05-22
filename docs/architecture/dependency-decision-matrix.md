# Dependency Decision Matrix

No major dependency may be added without updating this file.

| Dependency | Area | Decision | Reason | Added By |
| --- | --- | --- | --- | --- |
| FastAPI | API | Approved | Minimal Python HTTP API shell with OpenAPI support. | Issue 005 |
| Uvicorn | API | Approved | ASGI server for local and containerized FastAPI runtime. | Issue 005 |
| Pydantic | API contracts | Approved | Explicit Python contract validation for shared fixtures. | Issue 013 |
| pytest | API tests | Approved | Standard Python test runner for API and contract tests. | Issue 005 |
| httpx | API tests | Approved | Required by FastAPI test client stack. | Issue 005 |
| SQLAlchemy | Persistence | Approved | Database model base for Postgres-backed persistence. | Issue 007 |
| Alembic | Persistence | Approved | Reproducible database migration base. | Issue 007 |
| psycopg | Persistence | Approved | Postgres driver for SQLAlchemy. | Issue 007 |
| React | Web | Approved | Interactive web shell foundation. | Issue 006 |
| Vite | Web | Approved | Fast local web build and dev server. | Issue 006 |
| TypeScript | Web/shared | Approved | Shared contract typing and safer UI implementation. | Issues 006, 012 |

## Review Rules

- Prefer standard library, framework-native, or existing workspace tools.
- Add a dependency only when it removes meaningful implementation risk or complexity.
- Record licensing, runtime impact, maintenance risk, and the issue that introduced it.
