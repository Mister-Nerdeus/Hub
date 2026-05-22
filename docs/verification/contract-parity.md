# Contract Parity Verification

Contract parity means the same shared fixture JSON validates against both the TypeScript contracts in `packages/shared` and the Python Pydantic contracts in `apps/api`.

## Local Commands

```text
cd packages/shared && npm test
cd apps/api && pytest tests/contracts
node scripts/check-no-phi-fields.mjs
```

## CI Workflow

Workflow name: `Contract Parity`

The workflow runs on pull requests and pushes to `main`.

## Validated Fixtures

- `packages/shared/fixtures/plan-basic.json`
- `packages/shared/fixtures/scenario-basic.json`
