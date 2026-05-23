# Scenario Comparison Contract

The scenario comparison contract packages deterministic operational report summaries for side-by-side local proof.

## Contract

`ScenarioComparisonContract`

- `schemaVersion`: `"1.0.0"`.
- `comparisonId`: non-empty local proof identifier.
- `comparisonType`: `"manual_scenario_comparison"`.
- `createdAt`: ISO-compatible timestamp.
- `label`: operational-only label.
- `baselineReportId`: report ID used as the baseline row.
- `reportIds`: deterministic report IDs with the baseline report first.
- `items`: one comparison item per report ID.
- `summary`: max values derived from the comparison items.
- `limitations`: operational-only limitations.

`ScenarioComparisonItem`

- `reportId`
- `scenarioId`
- `label`
- `isBaseline`
- `totalGeneratedTasks`
- `assignedTaskCount`
- `unassignedTaskCount`
- `totalEstimatedTaskMinutes`
- `warningCount`
- `busiestMinute`
- `busiestMinuteTaskCount`

## Invariants

- Reports validate before comparison.
- Report IDs are unique.
- The baseline report is first in `reportIds` and `items`.
- Items must reference included reports when report context is supplied.
- Summary max values are derived from items.
- Limitations include operational-only, no optimizer, no recommendation, and no clinical safety claim language.
- Text rejects positive safety-certification and recommendation language.

## Boundaries

The comparison is a manual deterministic proof artifact only. It does not optimize, recommend a scenario, rank scenarios as better or worse, certify clinical safety, add API endpoints, persist data, export PDF, calculate routes, calculate delay, or simulate task completion.
