# Phase 3 Manual Assignment Contract

Manual assignment is a synthetic operational contract for assigning rooms to nurses. It is not a clinical record, staffing certification, EHR integration, optimizer, or simulation output.

## Types

- `NurseRole`: `primary`, `charge`, `float`, `triage`, `trauma`, `preceptor`, `orientee`.
- `BreakWindow`: `id`, `nurseId`, `startMinute`, `endMinute`, `flexible`.
- `Nurse`: id, display name, hex color, role, optional home station, operational qualifications, patient targets, walking speed, shift minutes, and break windows.
- `Assignment`: id, nurse id, room ids, assignment type, start minute, optional end minute.
- `ManualAssignmentContract`: schema version, assignment set id, plan id, name, optional description, nurses, and assignments.
- `Warning`: id, severity, code, message, optional nurse ids, room ids, task ids, and minute.

## Validation

- Nurse IDs are unique.
- Assignment IDs are unique.
- Break window IDs are unique.
- Break windows must reference their parent nurse.
- Assignment nurse IDs must reference existing nurses.
- Assignment room IDs must reference rooms in the referenced plan when a plan is supplied.
- A room may appear in only one assignment in the contract fixture validator.
- `maxPatients` must be greater than or equal to `targetPatients`.
- Walking speed must be positive.
- Shift end must be after shift start.
- Break window end must be after break window start.

The TypeScript and Python validators share the same fixture set under `packages/shared/fixtures/`.
