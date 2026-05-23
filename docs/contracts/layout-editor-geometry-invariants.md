# Layout Editor Geometry Invariants

## Source Of Truth
- Feet are source of truth.
- Pixels are display only.
- Persisted geometry must not store pixel x, pixel y, pixel width, or pixel height fields.

## Stable IDs
All editable objects require stable IDs. Stable IDs are used by selection, deterministic validation warnings, path graph references, and future simulation delta integration.

## Editable Object Geometry
- Rooms include x, y, width, and height in feet.
- Doors are wall-attached and reference a room or hallway wall.
- Nurse stations/desks include x, y, width, and height in feet.
- Hallways include x, y, width, and height in feet.
- EMS entry includes x, y, width, and height in feet.
- Trauma zone includes x, y, width, and height in feet.
- Provider/pharmacy zone includes x, y, width, and height in feet.

## Valid Geometry
Valid geometry requires:
- no negative x or y values unless a future bounded-coordinate contract explicitly allows them
- no negative width or height
- minimum sizes by editable object kind
- finite numeric feet values
- no duplicate stable IDs
- no overlapping object constraints beyond what the shared contract explicitly allows

## Door Constraints
- Doors must be wall-attached.
- Doors cannot exceed wall length.
- Door offset must remain within the referenced wall span.
- Door width must meet the minimum size contract.

## Path Graph References
Path graph references must remain resolvable after edits. Geometry validation must report deterministic validation warnings when a path node or path edge references a missing or incompatible room, door, nurse station/desk, hallway, EMS entry, trauma zone, or provider/pharmacy zone.

## Operational Boundary
Geometry invariants support operational layout-friction analysis only. They do not encode clinical claims, patient sentiment, staff sentiment, recommendations, or staffing certification.
