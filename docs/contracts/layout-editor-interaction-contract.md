# Layout Editor Interaction Contract

## Scope
This contract defines expected interaction semantics before UI implementation. No drag/drop UI, resize UI, persistence change, path recalculation, or simulation rerun is added here.

## Source Of Truth
- Feet are source of truth.
- Pixels are display only.
- Zoom and pan affect rendered coordinates only.
- Edit proposals must be stored and validated in feet.

## Selection
- Selection references stable IDs only.
- Multi-select order must be deterministic by object kind and stable ID.
- Deleting or replacing an object must clear or remap selection deterministically.

## Snapping
- Snapping operates in feet.
- The default snap grid is a future configurable real-world grid.
- Fine snapping may use a smaller real-world increment.
- Snap results must be deterministic for positive, negative, and fractional coordinates.

## Validation
Every edit must produce valid geometry or deterministic validation warnings.

Validation warnings must identify:
- edited object stable ID
- invariant name
- field name when a specific field fails
- deterministic message

Validation warnings must not make recommendations. They describe contract failures only.

## Path Sync
Path sync checks run after geometry validation. Path graph references must not silently break. Broken room, door, station, hallway, EMS entry, trauma zone, or provider/pharmacy zone references must be reported as deterministic validation warnings.

## Simulation Delta Integration
Simulation delta integration is a named future dependency. Interaction state may expose a validated layout draft for a later simulation rerun, but this contract does not add rerun behavior.
