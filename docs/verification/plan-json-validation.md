# Plan JSON Validation

Use the shared TypeScript contract validator to check exported plan JSON.

```text
npm run validate:plan -- packages/shared/fixtures/plan-er-pod-phase2.json
```

Valid output includes the plan ID, plan name, room count, hallway count, path node count, and path edge count.

Invalid plan JSON returns a non-zero exit code and prints the validation error. The command validates contract fields only and must not be used for scoring, simulation, optimization, or clinical safety claims.

The root `validate:plan` script builds `@nerdeus/shared` before validation so it is safe after a clean checkout and `npm ci`.
