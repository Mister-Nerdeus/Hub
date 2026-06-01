export const ROUTE_NODE_SOURCE_KINDS = [
  "room",
  "door",
  "hallway",
  "entry_exit",
  "zone",
  "support_access",
  "bed_position"
] as const;

export type RouteNodeSourceKind = (typeof ROUTE_NODE_SOURCE_KINDS)[number];

export type RouteNodeContract = {
  routeNodeId: string;
  sourceKind: RouteNodeSourceKind;
  sourceId: string;
  label: string;
  xFeet: number;
  yFeet: number;
  traversable: boolean;
};

const FORBIDDEN_ROUTE_NODE_LABEL_TEXT = /\b(?:travel[- ]?time|burden(?: score)?|workload|score|staffing(?: compliance| recommendation)?|assignment recommendation|optimizer|simulation|clinical safety|patient outcome)\b/i;

export function validateRouteNodeContract(value: unknown): RouteNodeContract {
  const node = requireRecord(value, "routeNode");
  requireExactKeys(node, "routeNode", [
    "routeNodeId",
    "sourceKind",
    "sourceId",
    "label",
    "xFeet",
    "yFeet",
    "traversable"
  ]);
  const sourceKind = requireEnum(node.sourceKind, ROUTE_NODE_SOURCE_KINDS, "routeNode.sourceKind");
  const sourceId = requireString(node.sourceId, "routeNode.sourceId");
  const routeNodeId = requireString(node.routeNodeId, "routeNode.routeNodeId");
  if (routeNodeId !== routeNodeIdFor(sourceKind, sourceId)) {
    throw new Error("routeNode.routeNodeId must be deterministic from sourceKind and sourceId");
  }
  const label = requireString(node.label, "routeNode.label");
  if (FORBIDDEN_ROUTE_NODE_LABEL_TEXT.test(label)) {
    throw new Error("routeNode.label must remain connectivity-only");
  }
  return {
    routeNodeId,
    sourceKind,
    sourceId,
    label,
    xFeet: requireNumber(node.xFeet, "routeNode.xFeet"),
    yFeet: requireNumber(node.yFeet, "routeNode.yFeet"),
    traversable: requireBoolean(node.traversable, "routeNode.traversable")
  };
}

export function routeNodeIdFor(sourceKind: RouteNodeSourceKind, sourceId: string): string {
  return `route-node:${sourceKind}:${sourceId}`;
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

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be boolean`);
  }
  return value;
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
