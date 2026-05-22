# Shift Scenario Contract

The shift scenario ties deterministic Phase 4 inputs together. It references a plan, manual assignment set, room loads, assumptions register, task template set, day profile, seed, timestep, and shift length.

## Shape

```text
ShiftScenarioContract
schemaVersion: "1.0.0"
scenarioId
planId
assignmentSetId
assumptionsId
taskTemplateSetId
dayProfileId
name
description
shiftLengthMinutes
timestepMinutes
seed
roomLoads
```

`ScenarioContract` is treated as the current shift scenario contract for compatibility with earlier fixture parity tests.

## Validation

- IDs must be non-empty.
- Shift length and timestep must be positive.
- Shift length must divide evenly by timestep.
- Seed must be a non-negative safe integer.
- Room loads must be valid and unique by room ID.
- When references are supplied, IDs must match the referenced plan, assignment set, assumptions register, task templates, and day profile.
- When a plan is supplied, scenario room loads must reference plan rooms.
- TypeScript and Python validators must agree.

## Boundaries

The contract does not generate tasks, simulate a shift, assign generated work to nurses, calculate walking routes, persist data, build reports, or optimize assignments.
