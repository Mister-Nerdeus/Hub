# Nurse Task Assignment Contract

The nurse-task assignment contract describes which generated operational tasks are assigned to which nurses and why. It is a contract only; it does not define an assignment algorithm.

## Shape

```text
NurseTaskAssignmentContract
schemaVersion: "1.0.0"
nurseTaskAssignmentSetId
scenarioId
assignmentSetId
generatedTaskSetId
name
description
taskAssignments

NurseTaskAssignment
id
taskId
nurseId
assignmentReason
minute
```

Allowed `assignmentReason` values are:

- `manual_room_coverage`
- `charge_coverage`
- `float_coverage`
- `unassigned`

## Validation

- Assignment IDs are unique.
- A generated task can appear at most once.
- `nurseId` is required unless `assignmentReason` is `unassigned`.
- `nurseId` must be null or absent when `assignmentReason` is `unassigned`.
- Present nurse IDs must reference a known nurse when an assignment set is supplied.
- Task IDs must reference generated tasks when a generated task set is supplied.
- Assignment minute must match the generated task scheduled minute.
- Scenario, manual assignment set, and generated task set IDs must match references when supplied.
- Unknown fields are rejected.
- TypeScript and Python validators must agree.

## Boundaries

The contract does not add assignment logic, optimization, balancing, completion status, delay calculation, walking route calculation, clinical notes, PHI, EHR integration, or clinical safety certification language.
