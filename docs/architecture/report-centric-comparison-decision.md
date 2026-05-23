# Report-Centric Comparison Decision

Phase 7 scenario comparison is intentionally report-centric.

## Decision

The accepted comparison contract keeps these first-class fields:

- `comparisonType: "manual_scenario_comparison"`
- `baselineReportId`
- `reportIds`
- `items`
- `summary`
- `limitations`

It does not use `baselineScenarioId`, `comparedScenarioIds`, or `comparisonMode`.

## Rationale

Phase 7 compares validated operational report outputs, not raw scenario objects. Each report is already the checked artifact that combines the scenario, generated task set, nurse task assignment result, timeline summary, warning summary, unassigned task summary, and operational-only limitations. Treating report IDs as first-class preserves the actual artifact under review and avoids implying that raw scenarios are being ranked or optimized.

Scenario IDs remain visible inside each comparison item through `items[].scenarioId`. This keeps the source scenario traceable while making the report output the compared object.

Future scenario-centric views may be derived from the current report-centric contract later. They must not replace `baselineReportId`, `reportIds`, or item-level report references unless a later accepted contract explicitly changes the comparison shape.

## Boundaries

This decision does not change runtime behavior. It does not add UI, optimizer behavior, scenario recommendation, ranking, API endpoints, persistence, PDF export, file download behavior, route calculation, delay calculation, task-completion simulation, clinical safety claims, or PHI.
