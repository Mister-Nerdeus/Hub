# Issue 005 Closeout

## Summary
- Added the FastAPI shell with a deterministic `/health` endpoint.
- Added API test configuration and a health contract test.

## Files Changed
- `apps/api/app/main.py`
- `apps/api/app/settings.py`
- `apps/api/app/__init__.py`
- `apps/api/pyproject.toml`
- `apps/api/tests/test_health.py`
- `apps/api/requirements.txt`
- `apps/api/requirements-dev.txt`

## Commands Run
```text
cd apps/api && pytest
python -m pytest
curl -f http://localhost:8000/health
```

## Tests Passed
- API test suite passed: `3 passed`.
- Health endpoint returned `{"status":"ok","service":"nerdeus-api"}`.

## Tests Failed
- Bare `pytest` initially failed on this Windows host because the user-level Python scripts directory was not on `PATH`. The same command passed after adding that directory to the session `PATH`; `python -m pytest` also passed.

## Evidence Paths
- `docs/verification/issues/issue-005/closeout.md`

## Known Limitations
- The API only exposes `/health`; feature endpoints begin in later issues.

## Non-PHI Confirmation
- Non-PHI rules pass by scanner and inspection.

## Next Recommended Issue
- Issue 006.
