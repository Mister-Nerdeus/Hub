# Issue XXX — Title

## Problem
What failure or missing capability this issue fixes.

## Depends On
- Issue IDs that must be completed first.

## Source Contract
- Exact source-plan rule this issue implements.

## Non-Goals
What Codex must not build in this issue.

## Files to Create
Exact paths.

## Files to Modify
Exact paths, if known.

## Invariants
Rules that must remain true after the issue.

## Failure Reproduction First
Before implementing, add a test that fails because:
- Specific failure this issue must expose first.

## Implementation Plan
Step-by-step implementation.

## Required Tests
Specific unit, integration, UI, or proof tests.

## Commands Codex Must Run
```text
docker compose config
docker compose up --build -d
docker compose ps
curl -f http://localhost:8000/health
cd apps/api && pytest
cd apps/web && npm run build
cd packages/shared && npm test
```

For UI issues:

```text
cd apps/web && npx playwright test
```

For schema/contract issues:

```text
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
```

## Acceptance Gates
Binary pass/fail gates.

## Required Evidence
Every issue must produce:

```text
docs/verification/issues/issue-XXX/closeout.md
```

Add screenshots, JSON samples, API responses, test output, generated reports, or verification artifacts under the same issue folder when relevant:

```text
docs/verification/issues/issue-XXX/
  closeout.md
  commands.txt
  screenshots/
  api-responses/
  test-output.txt
  sample-json/
```

## Do Not Close Unless
The issue may not be marked complete unless:
1. Required files exist.
2. Required tests pass.
3. Required evidence artifact exists.
4. Non-PHI scanner passes.
5. Dependency matrix is unchanged or intentionally updated.
6. Closeout evidence is written to `docs/verification/issues/issue-XXX/closeout.md`.

## Closeout Response Format
Codex must answer with:
- Summary
- Files changed
- Commands run
- Tests passed
- Evidence paths
- Known limitations
- Next recommended issue
