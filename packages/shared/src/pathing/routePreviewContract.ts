import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";

export const ROUTE_PREVIEW_STATUSES = ["reachable", "unreachable", "invalid"] as const;
export const ROUTE_PREVIEW_WARNING_CODES = [
  "MISSING_ORIGIN_NODE",
  "MISSING_DESTINATION_NODE",
  "SAME_ORIGIN_DESTINATION_NODE",
  "UNREACHABLE_ROUTE",
  "BLOCKED_EDGE_EXCLUDED",
  "APPROXIMATE_GRAPH_ONLY"
] as const;

export type RoutePreviewStatus = (typeof ROUTE_PREVIEW_STATUSES)[number];
export type RoutePreviewWarningCode = (typeof ROUTE_PREVIEW_WARNING_CODES)[number];

export type RoutePreviewInput = {
  schemaVersion: "1.0.0";
  planId: string;
  originPathNodeId: string;
  destinationPathNodeId: string;
};

export type RoutePreviewWarning = {
  code: RoutePreviewWarningCode;
  message: string;
};

export type RoutePreviewOutput = {
  schemaVersion: "1.0.0";
  planId: string;
  originPathNodeId: string;
  destinationPathNodeId: string;
  status: RoutePreviewStatus;
  routeNodeIds: string[];
  routeEdgeIds: string[];
  totalDistanceFeet: number;
  totalTravelSeconds: number;
  warnings: RoutePreviewWarning[];
  limitations: string[];
};

export const ROUTE_PREVIEW_LIMITATIONS = [
  "Approximate operational graph preview only.",
  "Path edges are fixture placeholders and are not measured walking truth.",
  "No staffing, assignment, optimizer, or care guidance is implied."
];

export function validateRoutePreviewInput(value: unknown): RoutePreviewInput {
  const input = requireRecord(value, "routePreviewInput");
  requireExactKeys(input, "routePreviewInput", [
    "schemaVersion",
    "planId",
    "originPathNodeId",
    "destinationPathNodeId"
  ]);
  requireLiteral(input.schemaVersion, "1.0.0", "schemaVersion");
  return {
    schemaVersion: "1.0.0",
    planId: requireString(input.planId, "planId"),
    originPathNodeId: requireString(input.originPathNodeId, "originPathNodeId"),
    destinationPathNodeId: requireString(input.destinationPathNodeId, "destinationPathNodeId")
  };
}

export function validateRoutePreviewOutput(value: unknown): RoutePreviewOutput {
  const output = requireRecord(value, "routePreviewOutput");
  requireExactKeys(output, "routePreviewOutput", [
    "schemaVersion",
    "planId",
    "originPathNodeId",
    "destinationPathNodeId",
    "status",
    "routeNodeIds",
    "routeEdgeIds",
    "totalDistanceFeet",
    "totalTravelSeconds",
    "warnings",
    "limitations"
  ]);
  requireLiteral(output.schemaVersion, "1.0.0", "schemaVersion");
  const status = requireEnum(output.status, ROUTE_PREVIEW_STATUSES, "status");
  const routeNodeIds = validateStringArray(output.routeNodeIds, "routeNodeIds");
  const routeEdgeIds = validateStringArray(output.routeEdgeIds, "routeEdgeIds");
  const totalDistanceFeet = requireNumber(output.totalDistanceFeet, "totalDistanceFeet", 0);
  const totalTravelSeconds = requireNumber(output.totalTravelSeconds, "totalTravelSeconds", 0);
  const warnings = requireArray(output.warnings, "warnings").map((warning, index) =>
    validateRoutePreviewWarning(warning, index)
  );
  const limitations = validateTextArray(output.limitations, "limitations");

  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  if (status === "reachable" && (routeNodeIds.length === 0 || routeEdgeIds.length === 0)) {
    throw new Error("reachable route preview requires routeNodeIds and routeEdgeIds");
  }

  return {
    schemaVersion: "1.0.0",
    planId: requireString(output.planId, "planId"),
    originPathNodeId: requireString(output.originPathNodeId, "originPathNodeId"),
    destinationPathNodeId: requireString(output.destinationPathNodeId, "destinationPathNodeId"),
    status,
    routeNodeIds,
    routeEdgeIds,
    totalDistanceFeet,
    totalTravelSeconds,
    warnings,
    limitations
  };
}

function validateRoutePreviewWarning(value: unknown, index: number): RoutePreviewWarning {
  const label = `warnings[${index}]`;
  const warning = requireRecord(value, label);
  requireExactKeys(warning, label, ["code", "message"]);
  return {
    code: requireEnum(warning.code, ROUTE_PREVIEW_WARNING_CODES, `${label}.code`),
    message: validateOperationalRuntimeText(requireString(warning.message, `${label}.message`), `${label}.message`)
  };
}

function validateTextArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((item, index) =>
    validateOperationalRuntimeText(requireString(item, `${label}[${index}]`), `${label}[${index}]`)
  );
}

function validateStringArray(value: unknown, label: string): string[] {
  const values = requireArray(value, label).map((item, index) =>
    requireString(item, `${label}[${index}]`)
  );
  if (new Set(values).size !== values.length) {
    throw new Error(`duplicate ${label} values are not allowed`);
  }
  return values;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
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
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNumber(value: unknown, label: string, min: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as T;
}
