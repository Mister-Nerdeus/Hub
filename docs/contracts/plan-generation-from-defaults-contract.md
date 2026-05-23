# Plan Generation From Defaults Contract

`generatePlanFromDefaults(defaults)` turns a validated `PlanBuilderDefaultsContract` into a validated `PlanContract`.

## Required Behavior

- The generator is pure and deterministic.
- The same defaults produce byte-stable JSON output.
- Generated output validates with `validatePlanContract`.
- Rooms use stable IDs: `room-001`, `room-002`, and so on.
- Doors use stable IDs: `door-room-001`, `door-room-002`, and so on.
- Room door nodes use stable IDs: `node-door-room-001`, `node-door-room-002`, and so on.
- Main hallway ID is `hallway-main`.
- Hallway nodes are `node-hall-start`, `node-hall-mid`, and `node-hall-end`.
- Stations use stable IDs: `station-001`, `station-002`, and so on.
- Station nodes use stable IDs: `node-station-001`, `node-station-002`, and so on.
- Default zone ID is `zone-default-pod`.
- Room and station path edges use IDs such as `edge-room-001-hall` and `edge-station-001-hall`.

## Geometry

- Rooms are laid out in rows from `startX`, `startY`, room dimensions, spacing, and `roomsPerRow`.
- Main hallway coordinates derive from hallway defaults.
- Door points sit on the configured wall.
- Door offset plus width is rejected when it falls outside the room wall.
- Nurse stations are placed near the hallway start, centered on the hallway, or near the hallway end.

## Generation Preconditions

- Room hallway auto-connect edges require generated door path nodes.
- Nurse stations require generated station path nodes because the current `PlanContract` requires every nurse station to reference a valid station path node.
- Unsupported combinations fail before returning a plan so user-facing preview flows can show a visible validation error instead of applying invalid draft state.

The generator does not save plans, call the API, persist data, score nurses, create reports, compare scenarios, export bundles, optimize, recommend, or add PHI.
