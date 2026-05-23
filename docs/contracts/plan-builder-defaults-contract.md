# Plan Builder Defaults Contract

`PlanBuilderDefaultsContract` captures synthetic operational layout inputs that can later generate a valid `PlanContract`.

## Fields

- `defaultsId`, `name`, `planSetup.planName`: non-empty operational identifiers.
- `createdAt`, `updatedAt`: ISO-compatible timestamps.
- `planSetup`: plan name, description, scale, grid, snap, and origin settings.
- `roomDefaults`: room count, rows, dimensions, spacing, label prefix, room type, capacity, capability flags, and starting coordinates.
- `hallwayDefaults`: main hallway width, length, start point, congestion factor, and blocked flag.
- `doorDefaults`: door creation toggle, width, wall, offset, penalty, and door path-node toggle.
- `nurseStationDefaults`: station count, dimensions, type, placement mode, and station path-node toggle.
- `pathGraphDefaults`: path-edge creation toggles, edge length strategy, hallway edge width, congestion factor, turn penalty, and blocked flag.
- `zoneDefaults`: default zone toggle, label, type, travel blocked flag, and optional travel penalty.

## Validation

- Numeric dimensions and congestion factors are positive where generated objects require them.
- Counts are integer-bounded: `roomCount > 0`, `roomsPerRow > 0`, `roomsPerRow <= roomCount`, and `nurseStationCount >= 0`.
- Door width is positive when `autoCreateDoors` is true, and door offset plus width must fit on the configured wall.
- Path edge width is positive when `autoCreatePathEdges` is true.
- Zone label is non-empty when `createDefaultZone` is true.
- TypeScript and Python validators use the same shared fixtures for valid and invalid cases.

The contract stores no PHI, no identity, no diagnosis text, no clinical notes, no EHR fields, no optimizer fields, and no recommendation behavior.
