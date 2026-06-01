export const ROUTE_EDGE_SOURCE_KINDS = [
  "door_destination",
  "entry_exit",
  "hallway_overlap",
  "manual_connection"
] as const;

export type RouteEdgeSourceKind = (typeof ROUTE_EDGE_SOURCE_KINDS)[number];

export type RouteEdgeContract = {
  routeEdgeId: string;
  fromNodeId: string;
  toNodeId: string;
  direction: "undirected";
  sourceKind: RouteEdgeSourceKind;
  traversable: boolean;
  blockedByWall: boolean;
  label: string;
};

const FORBIDDEN_ROUTE_EDGE_LABEL_TEXT = /\b(?:travel[- ]?time|burden(?: score)?|workload|score|staffing(?: compliance| recommendation)?|assignment recommendation|optimizer|simulation|clinical safety|patient outcome)\b/i;

export function validateRouteEdgeContract(value: unknown): RouteEdgeContract {
  const edge = requireRecord(value, "routeEdge");
  requireExactKeys(edge, "routeEdge", [
    "routeEdgeId",
    "fromNodeId",
    "toNodeId",
    "direction",
    "sourceKind",
    "traversable",
    "blockedByWall",
    "label"
  ]);
  const sourceKind = requireEnum(edge.sourceKind, ROUTE_EDGE_SOURCE_KINDS, "routeEdge.sourceKind");
  const fromNodeId = requireString(edge.fromNodeId, "routeEdge.fromNodeId");
  const toNodeId = requireString(edge.toNodeId, "routeEdge.toNodeId");
  const direction = requireLiteral(edge.direction, "undirected", "routeEdge.direction");
  const routeEdgeId = requireString(edge.routeEdgeId, "routeEdge.routeEdgeId");
  if (routeEdgeId !== routeEdgeIdFor(sourceKind, fromNodeId, toNodeId)) {
    throw new Error("routeEdge.routeEdgeId must be deterministic from sourceKind and node IDs");
  }
  const blockedByWall = requireBoolean(edge.blockedByWall, "routeEdge.blockedByWall");
  const traversable = requireBoolean(edge.traversable, "routeEdge.traversable");
  if (blockedByWall && traversable) {
    throw new Error("routeEdge.traversable must be false when blockedByWall is true");
  }
  const label = requireString(edge.label, "routeEdge.label");
  if (FORBIDDEN_ROUTE_EDGE_LABEL_TEXT.test(label)) {
    throw new Error("routeEdge.label must remain connectivity-only");
  }
  return {
    routeEdgeId,
    fromNodeId,
    toNodeId,
    direction,
    sourceKind,
    traversable,
    blockedByWall,
    label
  };
}

// Route edge identity is intentionally undirected: fromNodeId and toNodeId are storage endpoints.
export function routeEdgeIdFor(sourceKind: RouteEdgeSourceKind, fromNodeId: string, toNodeId: string): string {
  const [left, right] = [fromNodeId, toNodeId].sort();
  return `route-edge:${sourceKind}:${left}->${right}`;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, keys: readonly string[]): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be boolean`);
  }
  return value;
}

function requireLiteral<const TValue extends string>(value: unknown, expected: TValue, label: string): TValue {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<const TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  label: string
): TValue {
  if (typeof value !== "string" || !allowed.includes(value as TValue)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as TValue;
}
