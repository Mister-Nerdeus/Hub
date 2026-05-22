# Issue 017 Closeout

## Summary
Aligned plan persistence to the JSON-first model with `layout_json`, optional `description`, and PostgreSQL JSONB support.

## Files Changed
- `apps/api/app/models.py`
- `apps/api/app/db.py`
- `apps/api/alembic/env.py`
- `apps/api/alembic/versions/0002_align_plan_layout_json.py`
- `apps/api/tests/test_plan_model_schema.py`
- `README.md`
- `docs/contracts/environment-contract.md`

## Commands Run
See `docs/verification/issues/issue-017/commands.txt`.

## Tests Passed
- `cd apps/api && python -m pytest`
- `docker compose exec -T api sh -lc "cd /app && alembic upgrade head"`
- `node scripts/verify-local.mjs`

## Evidence Artifacts
- `docs/verification/issues/issue-017/migration-output.txt`
- `docs/verification/issues/issue-017/commands.txt`

## Known Limitations
- Alembic was run inside the API container because the Docker port contract keeps Postgres internal by default.

## Non-PHI Confirmation
Non-PHI scanner passes; the schema stores synthetic operational plan JSON only.
