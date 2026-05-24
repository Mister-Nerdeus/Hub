# Room Move Path Sync Contract

Issue 162 defines the contract for future path graph maintenance after a room moves. It does not implement path graph mutation.

## Scope

The contract is operational layout graph maintenance only. It records which room, door, path node, and path edge references a future sync step must inspect after a room move.

## Fields

- `movedRoomId`: moved room identifier.
- `roomDeltaFeet`: deterministic feet delta with `deltaXFeet` and `deltaYFeet`.
- `affectedDoorIds`: room-owned door IDs tied to the moved room.
- `affectedPathNodeIds`: room or door path-node IDs that may need coordinate updates later.
- `affectedPathEdgeIds`: path edge IDs connected to affected path nodes.
- `syncStatus`: one of `pending`, `not_required`, `blocked_by_missing_path_reference`, or `ready_for_sync`.
- `limitations`: operational limitations for the contract record.

## Rules

- No path geometry changes are applied in this issue.
- No simulation rerun is triggered.
- No pathfinding behavior changes.
- The output is deterministic and uses sorted affected ID lists.
- Missing door/path-node references produce `blocked_by_missing_path_reference`.
- Zero room deltas produce `not_required`.

## Deferred Work

Future implementation must update room door nodes, door nodes, station-linked references when applicable, and connected edge lengths through an explicit sync step. That future sync must remain operational-only and separately verified.
