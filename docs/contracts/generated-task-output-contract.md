# Generated Task Output Contract

Generated operational task output is public reusable contract data for timeline aggregation, nurse-task assignment proofs, future reports, and future APIs.

## Shapes

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

GeneratedOperationalTaskSetContract
schemaVersion: "1.0.0"
generatedTaskSetId
scenarioId
seed
taskCount
generatedTasks
```

## Validation

- Task IDs are unique within a task set.
- `generatedTaskSetId` is non-empty.
- `scenarioId` and `seed` match a referenced scenario when one is supplied.
- `taskCount` equals `generatedTasks.length`.
- `scheduledMinute` is non-negative, within shift bounds when a scenario is supplied, and aligned to `timestepMinutes`.
- `estimatedDurationMinutes` is positive.
- `roomId` references scenario room loads and plan rooms when those references are supplied.
- `sourceTemplateId` references a known task template when task templates are supplied.
- Task type and burden category are enum-only and match the referenced template when supplied.
- Unknown fields are rejected.
- TypeScript and Python validators must agree.

## Boundaries

Generated task sets are abstract operational data. They do not contain patient identity, diagnosis text, clinical notes, clinical orders, EHR imports, task completion state, walking routes, delay calculations, nurse assignment algorithms, optimizer fields, or clinical safety certification claims.
