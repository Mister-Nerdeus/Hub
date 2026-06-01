import {
  validateRouteEdgeContract,
  type RouteEdgeContract
} from "./routeEdgeContract.js";
import {
  validateRouteNodeContract,
  type RouteNodeContract
} from "./routeNodeContract.js";

export type RouteGraphWarningSeverity = "warning" | "error";

export type RouteGraphWarningContract = {
  code:
    | "route_unknown_destination"
    | "route_missing_destination"
    | "route_deleted_destination"
    | "route_disconnected_room"
    | "route_entry_exit_missing_destination"
    | "route_blocked_by_wall";
  severity: RouteGraphWarningSeverity;
  sourceObjectType: "room" | "door" | "support_access" | "entry_exit" | "perimeter_wall";
  sourceObjectId: string;
  message: string;
};

export type RouteGraphContract = {
  schemaVersion: "1.0.0";
  routeGraphId: string;
  routeGraphScope: "connectivity_only";
  derivedFromLayoutId: string;
  nodes: RouteNodeContract[];
  edges: RouteEdgeContract[];
  warnings: RouteGraphWarningContract[];
};

const FORBIDDEN_ROUTE_GRAPH_TEXT = /\b(?:travel[- ]?time|burden|score|staffing|assignment recommendation|optimizer|simulation|clinical safety|patient outcome)\b/i;

export function validateRouteGraphContract(value: unknown): RouteGraphContract {
  const graph = requireRecord(value, "routeGraph");
  requireExactKeys(graph, "routeGraph", [
    "schemaVersion",
    "routeGraphId",
    "routeGraphScope",
    "derivedFromLayoutId",
    "nodes",
    "edges",
    "warnings"
  ]);
  const nodes = requireArray(graph.nodes, "routeGraph.nodes").map(validateRouteNodeContract);
  const edges = requireArray(graph.edges, "routeGraph.edges").map(validateRouteEdgeContract);
  const warnings = requireArray(graph.warnings, "routeGraph.warnings").map(validateRouteGraphWarning);
  requireUnique("route node IDs", nodes.map((node) => node.routeNodeId));
  requireUnique("route edge IDs", edges.map((edge) => edge.routeEdgeId));
  const nodeIds = new Set(nodes.map((node) => node.routeNodeId));
  for (const edge of edges) {
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) {
      throw new Error("routeGraph.edges must reference existing route nodes");
    }
  }
  return {
    schemaVersion: requireLiteral(graph.schemaVersion, "1.0.0", "routeGraph.schemaVersion"),
    routeGraphId: requireString(graph.routeGraphId, "routeGraph.routeGraphId"),
    routeGraphScope: requireLiteral(graph.routeGraphScope, "connectivity_only", "routeGraph.routeGraphScope"),
    derivedFromLayoutId: requireString(graph.derivedFromLayoutId, "routeGraph.derivedFromLayoutId"),
    nodes,
    edges,
    warnings
  };
}

export function validateRouteGraphWarning(value: unknown): RouteGraphWarningContract {
  const warning = requireRecord(value, "routeGraph.warning");
  requireExactKeys(warning, "routeGraph.warning", [
    "code",
    "severity",
    "sourceObjectType",
    "sourceObjectId",
    "message"
  ]);
  const message = requireString(warning.message, "routeGraph.warning.message");
  if (FORBIDDEN_ROUTE_GRAPH_TEXT.test(message)) {
    throw new Error("route graph warning message must remain connectivity-only");
  }
  return {
    code: requireEnum(warning.code, [
      "route_unknown_destination",
      "route_missing_destination",
      "route_deleted_destination",
      "route_disconnected_room",
      "route_entry_exit_missing_destination",
      "route_blocked_by_wall"
    ] as const, "routeGraph.warning.code"),
    severity: requireEnum(warning.severity, ["warning", "error"] as const, "routeGraph.warning.severity"),
    sourceObjectType: requireEnum(warning.sourceObjectType, [
      "room",
      "door",
      "support_access",
      "entry_exit",
      "perimeter_wall"
    ] as const, "routeGraph.warning.sourceObjectType"),
    sourceObjectId: requireString(warning.sourceObjectId, "routeGraph.warning.sourceObjectId"),
    message
  };
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

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
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

function requireUnique(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}
