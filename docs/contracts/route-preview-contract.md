# Route Preview Contract

Route preview V1 defines a deterministic data shape for inspecting a path between two path nodes in a default plan.

## Input

```ts
{
  schemaVersion: "1.0.0";
  planId: string;
  originPathNodeId: string;
  destinationPathNodeId: string;
}
```

## Output

```ts
{
  schemaVersion: "1.0.0";
  planId: string;
  originPathNodeId: string;
  destinationPathNodeId: string;
  status: "reachable" | "unreachable" | "invalid";
  routeNodeIds: string[];
  routeEdgeIds: string[];
  totalDistanceFeet: number;
  totalTravelSeconds: number;
  warnings: RoutePreviewWarning[];
  limitations: string[];
}
```

Reachable outputs must include route nodes and route edges. Distances and travel seconds must be non-negative. Limitations are required for every output.

## Warnings

Supported warning codes are:

- `MISSING_ORIGIN_NODE`
- `MISSING_DESTINATION_NODE`
- `UNREACHABLE_ROUTE`
- `BLOCKED_EDGE_EXCLUDED`
- `APPROXIMATE_GRAPH_ONLY`

## Metadata Annotations

The metadata adapter may produce route-edge annotations from hallway and door metadata. These annotations do not change route node IDs, route edge IDs, total distance, total time, assignment scoring, simulation behavior, or optimizer behavior.

## Non-Claims

Route preview does not prove walking accuracy, recommend routes, certify layout adequacy, add UI persistence, call APIs, seed databases, score assignments, or change pathfinding outside the deterministic builder.
