# Basic Nurse Task Assignment Proof Contract

The basic nurse-task assignment proof connects generated operational tasks to existing manual room coverage.

## Public API

```text
assignTasksByManualCoverage({
  plan,
  roomLoads,
  assignmentSet,
  generatedTaskSet
}): BasicNurseTaskAssignmentResult
```

## Rule

- If a generated task belongs to a room with exactly one valid manual nurse coverage assignment, assign it to that nurse.
- If the room has no valid manual coverage, leave the task unassigned and warn.
- If the room has duplicate coverage, leave the task unassigned and warn.

## Output

```text
BasicNurseTaskAssignmentResult
assignmentSet
warnings
assignedTaskCount
unassignedTaskCount
perNurseTaskCounts
perNurseEstimatedMinutes
```

## Invariants

- The function is pure and deterministic.
- It uses `validateManualAssignment` to determine valid room coverage.
- It uses the generated task set validator.
- It validates the resulting nurse-task assignment contract before returning.
- Duplicate room coverage does not count as valid task coverage.
- Unknown room tasks become unassigned warnings.
- Per-nurse task counts and estimated minutes are deterministic summaries only.

## Boundaries

This proof does not balance work, optimize workload, simulate task completion, calculate delay, calculate walking routes, build UI, persist assignments, add PHI, or make clinical safety claims.
