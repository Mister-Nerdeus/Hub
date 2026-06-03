# Assignment Care Position Model

The current manual assignment foundation uses `bed_position` as the care-position model for split rooms.

This is a terminology decision for this milestone, not a schema rename. The persisted assignment target kind remains `bed_position` so existing target IDs, route-node references, fixtures, and saved manual assignments stay deterministic.

## Physical Model

One physical split room remains one room in the floorplan. The split room contains two bed positions, and each bed position is the assignable care-position target.

```text
one physical room -> two bed positions / care positions -> assignable targets
```

The split-room parent is not a manual assignment target. The resolver skips the parent room and emits one `bed_position` target for each split-room bed position.

## Manual Assignment Rules

- `bed_position` is the current care-position target kind for split rooms.
- Split-room parents remain physical room objects.
- Split-room bed positions are not fake child rooms.
- Legacy split-room bay terminology is not used for the manual assignment foundation.
- Same staff may be manually assigned to both split bed positions.
- Different staff may be manually assigned to separate split bed positions.
- Manual assignment remains manual-only; no recommendations, scoring, optimization, or simulation behavior is introduced by this model.

## Non-PHI Boundary

Care-position labels must remain synthetic operational labels such as `Room 2A`. They must not store real patient identity, PHI, diagnosis text, clinical notes, EHR identifiers, or clinical safety language.
