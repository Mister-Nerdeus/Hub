# Route Graph Connectivity Model

The route graph is a connectivity-only model derived from floorplan geometry.

Route nodes identify geometry anchors such as rooms, doors, hallways, zones, entry points, support access points, and split-room bed positions.

Route edges are explicitly undirected. `fromNodeId` and `toNodeId` are storage endpoints only. `routeEdgeIdFor` sorts the endpoint IDs before creating an edge ID, so the same two endpoints produce the same ID regardless of storage order.

Directional movement semantics are out of scope for this milestone. The route graph can say that two route endpoints are connected, disconnected, blocked, or unknown; it does not infer directional flow.

Perimeter wall warnings use stable warning anchor coordinates. They are rendered from those anchors and are not mapped to room nodes.
