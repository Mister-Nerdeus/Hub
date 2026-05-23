# Plan Builder Validation Result Contract

User-facing plan-builder flows return explicit validation results instead of silently swallowing errors.

```ts
type PlanBuilderValidationResult<T> =
  | { ok: true; value: T; error: null }
  | { ok: false; value: null; error: string };
```

## Helpers

- `validatePlanDraft(plan)`: validates unknown plan input and returns a visible error on failure.
- `tryGeneratePlanFromDefaults(defaults)`: validates defaults and generated plan output before returning success.
- `applyValidatedPlanDraft(previous, next)`: preserves reducer compatibility while exposing the validation result.

Invalid plan drafts and invalid defaults produce human-readable error strings. Valid defaults can generate a valid `PlanContract` without API calls or persistence.
