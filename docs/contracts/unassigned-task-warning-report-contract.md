# Unassigned Task And Warning Report Contract

Phase 6 includes dedicated operational inspection builders for coverage gaps and warning patterns.

## Builders

- `buildUnassignedTaskReport(input)` returns report type `unassigned_tasks`.
- `buildWarningReport(input)` returns report type `warnings`.

Both builders use the same input shape as the operational summary builder and return validated `OperationalReportContract` objects.

## Required Behavior

- Builders are pure and deterministic.
- Task IDs are sorted deterministically.
- Room IDs are sorted deterministically.
- Warning codes are sorted deterministically.
- Warning severity counts are exact.
- Warning code counts are exact.
- Unassigned task reports include task IDs and room IDs.
- Warning reports expose warning counts without fixing, rebalancing, or suggesting reassignment.

## Boundaries

- No optimizer recommendations.
- No reassignment suggestions.
- No auto-fix behavior.
- No task-completion simulation.
- No walking route calculation.
- No delay calculation.
- No UI or API behavior in the shared builders.
- No clinical safety language or PHI.
