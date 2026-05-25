# Batch 241-250 Code Review Findings

## Findings

1. Fixed: canonical assignment workflow state accepted invalid runtime status strings.
   `createPlan1AssignmentWorkflowState` was relying on TypeScript-only input types for `visualParityStatus` and `pathSyncStatus`. JavaScript callers or malformed JSON-derived values could pass unsupported status strings. The contract now rejects invalid status values at runtime and has negative tests.

2. Fixed: comparison fixture root metadata was not validated.
   `validatePlan1AssignmentComparisonFixtures` accepted root `schemaVersion` and `planId` without checking the values. The fixture contract now rejects non-`1.0.0` schema versions and non-Plan-1 fixture scopes before building canonical workflow state.

## Residual Risk

- Existing optimizer and simulation modules predate this Plan 1 assignment batch and were not expanded by this review.
- Walking preview remains approximate graph-only routing, not measured walking truth.
- Docker verifier output includes generated Docker progress lines with trailing spaces; the output is preserved as command evidence.
