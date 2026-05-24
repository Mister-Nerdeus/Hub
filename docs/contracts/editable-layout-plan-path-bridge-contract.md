# Editable Layout Plan Path Bridge Contract

Issue 170 defines a deterministic bridge between editable layout objects and operational plan/path references.

The contract records:

- `editableLayoutId`
- `planId`
- `roomMappings`
- `doorMappings`
- `stationMappings`
- `hallwayMappings`
- `zoneMappings`
- `limitations`

Each mapping records:

- `editableObjectId`
- `planObjectId`
- `pathNodeIds`
- `pathEdgeIds`
- `mappingStatus`

Supported `mappingStatus` values are:

- `mapped`
- `missing_plan_object`
- `missing_path_reference`
- `not_required`

## Boundaries

- The bridge is a reference contract only.
- Missing plan objects and missing path references must be explicit.
- The contract does not mutate path nodes, path edges, editable geometry, plan geometry, or simulation outputs.
- The contract does not run pathfinding, save/load behavior, path sync, or simulation rerun behavior.
- The contract adds no inferred clinical meaning and no recommendation behavior.
