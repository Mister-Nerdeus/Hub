# Care Task Template Contract

Care task templates are abstract operational workload templates. They are not clinical orders, care instructions, patient records, or EHR-derived content.

## Shape

```text
TaskTemplateContract
schemaVersion: "1.0.0"
templateSetId
name
description
taskTemplates: CareTaskTemplate[]

CareTaskTemplate
id
taskType
label
description
defaultDurationMinutes
frequencySource
trigger
burdenCategory
interruptive
requiresRoomPresence
```

## Enums

`TaskType`: medication round, monitoring check, procedure support, room turnover, isolation prep, behavioral observation, sitter observation.

`TaskFrequencySource`: room-load frequency, room-load burden, room-load turnover, or boolean trigger.

`TaskTrigger`: medication frequency, monitoring frequency, procedure burden, expected turnover, isolation active, behavioral risk, or sitter required.

`TaskBurdenCategory`: medication, monitoring, procedure, turnover, isolation, behavioral, or sitter.

## Validation

- Template IDs must be unique.
- Durations must be positive.
- Enum fields must match the contract.
- Boolean triggers must use `boolean_trigger`.
- Frequency, burden, and turnover triggers must use their matching frequency source.
- Template text must remain operational-only.
- TypeScript and Python validators must agree.

## Boundaries

Templates do not generate tasks by themselves. They do not assign work to nurses, simulate completion, calculate routes, persist data, or introduce diagnosis text, clinical notes, EHR integration, or clinical safety certification language.
