# Operational Task Generation Contract

Basic deterministic task generation proves that the same synthetic ER pod inputs and seed reproduce the same abstract operational task set.

## Inputs

- Shift scenario.
- Room loads.
- Assumptions register.
- Care task templates.
- Day profile.
- Seeded random utility.

## Generated Task Shape

```text
GeneratedOperationalTask
id
taskType
roomId
sourceTemplateId
scheduledMinute
estimatedDurationMinutes
burdenCategory
interruptive
requiresRoomPresence
```

Phase 5 wraps generated task arrays in `GeneratedOperationalTaskSetContract` for downstream references:

```text
GeneratedOperationalTaskSetContract
schemaVersion: "1.0.0"
generatedTaskSetId
scenarioId
seed
taskCount
generatedTasks
```

## Current Generation Rules

- Only occupied rooms generate tasks.
- Template triggers read from room-load fields.
- Frequency mappings come from the assumptions register.
- `very_high` procedure burden maps to the `continuous` frequency mapping for this proof.
- Turnover maps to frequency keys as low-to-none, normal-to-low, high-to-medium, and surge-to-high for this proof.
- Task durations come from assumptions duration defaults by task type.
- Day profile task-volume, turnover, and interruption multipliers affect generated volume and weighted timing.
- Walking congestion is retained as a visible day-profile input but is not used because route timing is not implemented.
- IDs are deterministic from scenario ID, room ID, template ID, and occurrence number.

## Validation

- Same input and seed produce identical task lists.
- Different seed can alter timing while preserving the same visible inputs.
- Scheduled minutes must remain inside shift bounds.
- Duration minutes must be positive.
- Generated task IDs must be unique and deterministic.
- Generated task set IDs must be non-empty.
- Task-set `scenarioId`, `seed`, and `taskCount` are validated when referenced.
- Public validators are exported for single generated tasks, generated task arrays, and generated task sets.

## Boundaries

Generated tasks are abstract operational tasks only. There is no patient identity, diagnosis text, clinical note text, clinical order workflow, nurse assignment, task completion simulation, walking route calculation, full-shift simulation, optimizer, API persistence, or UI.
