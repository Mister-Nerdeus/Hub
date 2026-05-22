# Walking Graph Contract

The walking graph is the source of truth for future operational travel distance. Later scoring may prefer graph distance over straight-line distance only when graph data is semantically consistent.

## Semantic Links

- `Door.pathNodeId`, when present, must reference a `pathNodes` item with `nodeType: "room_door"`.
- That room-door path node must have `linkedObjectId` equal to the same door ID.
- `Room.pathNodeId`, when present, must reference a `room_door` path node whose linked door belongs to that room.
- `NurseStation.pathNodeId` must reference a `pathNodes` item with `nodeType: "station"`.
- That station path node must have `linkedObjectId` equal to the same nurse station ID.
- Non-entry path nodes must have `linkedObjectId`.
- Entry path nodes must not have `linkedObjectId`.

## Boundaries

- This contract validates graph semantics only.
- It does not implement pathfinding, walking-distance scoring, nurse assignment, simulation, or optimization.
- Walking graph fields are operational layout references and must not contain PHI.
