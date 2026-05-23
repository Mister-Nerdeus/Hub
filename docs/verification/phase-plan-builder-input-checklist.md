# Phase Plan Builder Input Checklist

- Plan Builder Defaults contract exists and has TypeScript/Python parity.
- Plan generation from defaults creates a valid `PlanContract`.
- Plan setup input form maps user fields into defaults.
- Room defaults form maps room count, dimensions, spacing, type, capacity, and start coordinates.
- Hallway door nurse station defaults are editable through advanced form state.
- Generated plan preview displays summary counts from validated generation.
- Apply generated plan dispatches `replacePlan` to draft state.
- Existing save/load/import/export surfaces remain in the app.
- No optimizer.
- No recommendation.
- No PHI.
- No new API endpoints.
- No new persistence beyond existing plan save/load.
- Local verifier is required before phase close.
