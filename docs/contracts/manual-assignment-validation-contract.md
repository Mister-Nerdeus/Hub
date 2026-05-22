# Manual Assignment Validation Contract

Manual assignment validation is deterministic warning generation for synthetic operational assignment sets.

## Inputs

- Plan contract.
- Room load array.
- Manual assignment contract.

## Output

- `warnings`: deterministic list of warning objects.
- `assignedRoomMap`: room id to assigned nurse ids.
- `unassignedOccupiedRoomIds`: occupied room ids without valid manual coverage.
- `perNurseAssignedOccupiedCounts`: occupied room count per nurse.

## Warning Codes

| Code | Severity | Meaning |
| --- | --- | --- |
| `UNKNOWN_NURSE` | critical | Assignment references a nurse id not in the assignment set. |
| `UNKNOWN_ROOM` | critical | Assignment references a room id not in the plan. |
| `ROOM_ASSIGNED_MULTIPLE_TIMES` | critical | More than one assignment covers the same room. |
| `ROOM_WITHOUT_COVERAGE` | critical | An occupied room has assignment references but no valid manual coverage. |
| `UNASSIGNED_OCCUPIED_ROOM` | warning | An occupied room has no assignment reference. |
| `OVER_TARGET_RATIO` | warning | A nurse has more occupied rooms than the target patient count. |
| `OVER_MAX_RATIO` | critical | A nurse has more occupied rooms than the max patient count. |
| `TRAUMA_WITH_NON_QUALIFIED_NURSE` | warning | A trauma-active room is assigned to a nurse without trauma qualification. |

Unoccupied rooms do not require assignment. Unknown references and duplicate assignment coverage are surfaced as warnings by the validation engine even when strict contract validation would reject the fixture.
