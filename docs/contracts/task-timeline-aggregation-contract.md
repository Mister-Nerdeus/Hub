# Task Timeline Aggregation Contract

Task timeline aggregation groups generated operational tasks by scheduled minute and summarizes workload volume.

## Public API

```text
aggregateTaskTimeline(scenario, generatedTaskSet): TaskTimelineSummary
```

The input generated task set is validated before aggregation.

## Output

```text
TaskTimelineBucket
minute
taskIds
taskCount
totalEstimatedDurationMinutes
interruptiveTaskCount
roomIds
burdenCategories

TaskTimelineSummary
scenarioId
generatedTaskSetId
timestepMinutes
shiftLengthMinutes
buckets
totalTaskCount
totalEstimatedDurationMinutes
```

## Invariants

- Aggregation is pure and deterministic.
- Buckets are sorted by minute.
- Task IDs within buckets are sorted.
- Room IDs within buckets are unique and sorted.
- Empty buckets are omitted.
- `totalTaskCount` equals the generated task count.
- `totalEstimatedDurationMinutes` equals the sum of task durations.
- Burden-category counts are visible for every task burden category.

## Boundaries

Timeline aggregation does not assign work to nurses, simulate completion, calculate delay, calculate walking routes, optimize assignments, persist output, build UI, add PHI, or make clinical safety claims.
