import type { PlanContract } from "../contracts.js";

export type PathTravelRequestContract = {
  schemaVersion: "1.0.0";
  planId: string;
  originNodeId: string;
  destinationNodeId: string;
  walkingSpeedFeetPerMinute: number;
};

export type PathTravelResponseContract = {
  schemaVersion: "1.0.0";
  planId: string;
  originNodeId: string;
  destinationNodeId: string;
  routeNodeIds: string[];
  routeEdgeIds: string[];
  travelDistanceFeet: number;
  travelSeconds: number;
  travelMinutes: number;
  warnings: string[];
  limitations: string[];
};

export type PathTravelCalculationInput = {
  plan: PlanContract;
  originNodeId: string;
  destinationNodeId: string;
  walkingSpeedFeetPerMinute: number;
};

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i]
];

export function validatePathTravelRequestContract(
  value: unknown,
  plan?: PlanContract
): PathTravelRequestContract {
  const request = requireRecord(value, "pathTravelRequest");
  requireExactKeys(request, "pathTravelRequest", [
    "schemaVersion",
    "planId",
    "originNodeId",
    "destinationNodeId",
    "walkingSpeedFeetPerMinute"
  ]);
  requireLiteral(request.schemaVersion, "1.0.0", "schemaVersion");
  const planId = requireString(request.planId, "planId");
  if (plan != null && planId !== plan.planId) {
    throw new Error("planId must match the referenced plan");
  }
  const walkingSpeedFeetPerMinute = requireNumber(
    request.walkingSpeedFeetPerMinute,
    "walkingSpeedFeetPerMinute",
    0
  );
  if (walkingSpeedFeetPerMinute <= 0) {
    throw new Error("walkingSpeedFeetPerMinute must be positive");
  }
  return {
    schemaVersion: "1.0.0",
    planId,
    originNodeId: requireString(request.originNodeId, "originNodeId"),
    destinationNodeId: requireString(request.destinationNodeId, "destinationNodeId"),
    walkingSpeedFeetPerMinute
  };
}

export function validatePathTravelResponseContract(
  value: unknown,
  plan?: PlanContract
): PathTravelResponseContract {
  const response = requireRecord(value, "pathTravelResponse");
  requireExactKeys(response, "pathTravelResponse", [
    "schemaVersion",
    "planId",
    "originNodeId",
    "destinationNodeId",
    "routeNodeIds",
    "routeEdgeIds",
    "travelDistanceFeet",
    "travelSeconds",
    "travelMinutes",
    "warnings",
    "limitations"
  ]);
  requireLiteral(response.schemaVersion, "1.0.0", "schemaVersion");
  const planId = requireString(response.planId, "planId");
  if (plan != null && planId !== plan.planId) {
    throw new Error("pathTravelResponse.planId must match the referenced plan");
  }
  const routeNodeIds = validateStringArray(response.routeNodeIds, "routeNodeIds");
  const routeEdgeIds = validateStringArray(response.routeEdgeIds, "routeEdgeIds");
  const travelDistanceFeet = requireNumber(response.travelDistanceFeet, "travelDistanceFeet", 0);
  const travelSeconds = requireNumber(response.travelSeconds, "travelSeconds", 0);
  const travelMinutes = requireInteger(response.travelMinutes, "travelMinutes", 0);
  const warnings = validateTextArray(response.warnings, "warnings");
  const limitations = validateTextArray(response.limitations, "limitations");
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  if (travelMinutes !== Math.ceil(travelSeconds / 60)) {
    throw new Error("travelMinutes must equal deterministic ceiling of travelSeconds / 60");
  }
  if (plan != null) {
    const edgeDistanceFeet = sumPathEdgeDistanceFeet(routeEdgeIds, plan);
    if (Math.abs(edgeDistanceFeet - travelDistanceFeet) > 0.001) {
      throw new Error("travelDistanceFeet must equal the route path-edge lengthFeet total");
    }
  }
  return {
    schemaVersion: "1.0.0",
    planId,
    originNodeId: requireString(response.originNodeId, "originNodeId"),
    destinationNodeId: requireString(response.destinationNodeId, "destinationNodeId"),
    routeNodeIds,
    routeEdgeIds,
    travelDistanceFeet,
    travelSeconds,
    travelMinutes,
    warnings,
    limitations
  };
}

function sumPathEdgeDistanceFeet(routeEdgeIds: string[], plan: PlanContract): number {
  const edgeById = new Map(plan.pathEdges.map((edge) => [edge.id, edge]));
  return routeEdgeIds.reduce((sum, edgeId) => {
    const edge = edgeById.get(edgeId);
    if (edge == null) {
      throw new Error("routeEdgeIds must reference plan path edges");
    }
    return sum + edge.lengthFeet;
  }, 0);
}

function validateTextArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((item, index) =>
    validateOperationalText(item, `${label}[${index}]`)
  );
}

function validateOperationalText(value: unknown, label: string): string {
  const text = requireString(value, label);
  for (const [name, pattern] of FORBIDDEN_TEXT_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`${label} must not include ${name} language`);
    }
  }
  return text;
}

function validateStringArray(value: unknown, label: string): string[] {
  const values = requireArray(value, label).map((item, index) =>
    requireString(item, `${label}[${index}]`)
  );
  requireUnique(label, values);
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

function requireNumber(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  return value;
}

function requireInteger(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (min !== undefined && value < min) {
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

function requireUnique(label: string, values: string[]): Set<string> {
  const valueSet = new Set(values);
  if (valueSet.size !== values.length) {
    throw new Error(`duplicate ${label} are not allowed`);
  }
  return valueSet;
}
