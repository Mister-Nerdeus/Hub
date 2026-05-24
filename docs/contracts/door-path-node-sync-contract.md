# Door Path Node Sync Contract

Issue 163 defines the contract for future door path-node maintenance. It does not mutate the path graph.

## Scope

Door path node sync is operational layout graph maintenance only. It maps a wall-attached door to a derived door-center point and an explicit linked path node reference for future sync.

## Fields

- `doorId`: door identifier.
- `ownerKind`: `room` or `hallway`.
- `ownerId`: owner geometry identifier.
- `wall`: owner wall where the door is attached.
- `offsetFeet`: door offset along the owner wall.
- `derivedDoorCenterFeet`: derived center point in feet from current owner geometry.
- `linkedPathNodeId`: explicit path node reference or `null` when missing.
- `syncStatus`: one of `pending`, `ready_for_sync`, `missing_linked_path_node`, or `owner_geometry_missing`.
- `limitations`: operational limitations for the contract record.

## Rules

- Door center is derived from owner geometry at contract-build time.
- Linked path node references must be explicit.
- No path node or edge geometry changes are applied in this issue.
- No simulation rerun is triggered.
- No door movement or visual behavior change is introduced.

## Deferred Work

Future implementation must update linked door path-node coordinates through an explicit path sync step after owner geometry changes. That future work must be separately verified and remain operational-only.
