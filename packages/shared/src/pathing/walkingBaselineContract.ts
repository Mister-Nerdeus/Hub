import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";
import { ROUTE_PREVIEW_STATUSES, type RoutePreviewOutput } from "./routePreviewContract.js";

export type WalkingBaselineRouteSummary = {
  routeId: string;
  originPathNodeId: string;
  destinationPathNodeId: string;
  status: RoutePreviewOutput["status"];
  distanceFeet: number;
  travelSeconds: number;
  warningCodes: string[];
};

export type WalkingBaselineRouteGroupSummary = {
  groupId: string;
  label: string;
  routeCount: number;
  reachableRouteCount: number;
  unreachableRouteCount: number;
  invalidRouteCount: number;
  totalDistanceFeet: number;
  totalTravelSeconds: number;
  routes: WalkingBaselineRouteSummary[];
};

export type WalkingBaselineWarning = {
  code: string;
  message: string;
};

export type WalkingBaselineContract = {
  schemaVersion: "1.0.0";
  baselineId: string;
  planId: string;
  routeGroupSummaries: WalkingBaselineRouteGroupSummary[];
  totalRouteCount: number;
  reachableRouteCount: number;
  unreachableRouteCount: number;
  invalidRouteCount: number;
  totalDistanceFeet: number;
  totalTravelSeconds: number;
  warnings: WalkingBaselineWarning[];
  limitations: string[];
};

export const WALKING_BASELINE_LIMITATIONS = [
  "Walking baseline is derived from approximate route preview outputs.",
  "Distances and times are fixture graph summaries, not measured walking truth.",
  "No staffing, assignment, optimizer, or care guidance is implied."
];

export function validateWalkingBaselineContract(value: unknown): WalkingBaselineContract {
  const baseline = requireRecord(value, "walkingBaseline");
  requireExactKeys(baseline, "walkingBaseline", [
    "schemaVersion",
    "baselineId",
    "planId",
    "routeGroupSummaries",
    "totalRouteCount",
    "reachableRouteCount",
    "unreachableRouteCount",
    "invalidRouteCount",
    "totalDistanceFeet",
    "totalTravelSeconds",
    "warnings",
    "limitations"
  ]);
  requireLiteral(baseline.schemaVersion, "1.0.0", "schemaVersion");
  const routeGroupSummaries = requireArray(
    baseline.routeGroupSummaries,
    "routeGroupSummaries"
  ).map((group, index) => validateRouteGroupSummary(group, index));
  const totalRouteCount = requireInteger(baseline.totalRouteCount, "totalRouteCount", 0);
  const reachableRouteCount = requireInteger(baseline.reachableRouteCount, "reachableRouteCount", 0);
  const unreachableRouteCount = requireInteger(
    baseline.unreachableRouteCount,
    "unreachableRouteCount",
    0
  );
  const invalidRouteCount = requireInteger(baseline.invalidRouteCount, "invalidRouteCount", 0);
  const totalDistanceFeet = requireNumber(baseline.totalDistanceFeet, "totalDistanceFeet", 0);
  const totalTravelSeconds = requireNumber(baseline.totalTravelSeconds, "totalTravelSeconds", 0);
  const warnings = requireArray(baseline.warnings, "warnings").map((warning, index) =>
    validateWalkingBaselineWarning(warning, index)
  );
  const limitations = validateTextArray(baseline.limitations, "limitations");
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }

  const derived = summarizeGroups(routeGroupSummaries);
  if (derived.totalRouteCount !== totalRouteCount) {
    throw new Error("totalRouteCount must equal route group route counts");
  }
  if (derived.reachableRouteCount !== reachableRouteCount) {
    throw new Error("reachableRouteCount must equal route group reachable counts");
  }
  if (derived.unreachableRouteCount !== unreachableRouteCount) {
    throw new Error("unreachableRouteCount must equal route group unreachable counts");
  }
  if (derived.invalidRouteCount !== invalidRouteCount) {
    throw new Error("invalidRouteCount must equal route group invalid counts");
  }
  if (Math.abs(derived.totalDistanceFeet - totalDistanceFeet) > 0.001) {
    throw new Error("totalDistanceFeet must equal route group distance totals");
  }
  if (Math.abs(derived.totalTravelSeconds - totalTravelSeconds) > 0.001) {
    throw new Error("totalTravelSeconds must equal route group time totals");
  }

  return {
    schemaVersion: "1.0.0",
    baselineId: requireString(baseline.baselineId, "baselineId"),
    planId: requireString(baseline.planId, "planId"),
    routeGroupSummaries,
    totalRouteCount,
    reachableRouteCount,
    unreachableRouteCount,
    invalidRouteCount,
    totalDistanceFeet,
    totalTravelSeconds,
    warnings,
    limitations
  };
}

function validateRouteGroupSummary(
  value: unknown,
  index: number
): WalkingBaselineRouteGroupSummary {
  const label = `routeGroupSummaries[${index}]`;
  const group = requireRecord(value, label);
  requireExactKeys(group, label, [
    "groupId",
    "label",
    "routeCount",
    "reachableRouteCount",
    "unreachableRouteCount",
    "invalidRouteCount",
    "totalDistanceFeet",
    "totalTravelSeconds",
    "routes"
  ]);
  const routes = requireArray(group.routes, `${label}.routes`).map((route, routeIndex) =>
    validateRouteSummary(route, `${label}.routes[${routeIndex}]`)
  );
  const routeCount = requireInteger(group.routeCount, `${label}.routeCount`, 0);
  const reachableRouteCount = requireInteger(
    group.reachableRouteCount,
    `${label}.reachableRouteCount`,
    0
  );
  const unreachableRouteCount = requireInteger(
    group.unreachableRouteCount,
    `${label}.unreachableRouteCount`,
    0
  );
  const invalidRouteCount = requireInteger(group.invalidRouteCount, `${label}.invalidRouteCount`, 0);
  const totalDistanceFeet = requireNumber(group.totalDistanceFeet, `${label}.totalDistanceFeet`, 0);
  const totalTravelSeconds = requireNumber(group.totalTravelSeconds, `${label}.totalTravelSeconds`, 0);
  const derived = summarizeRoutes(routes);
  if (
    derived.routeCount !== routeCount ||
    derived.reachableRouteCount !== reachableRouteCount ||
    derived.unreachableRouteCount !== unreachableRouteCount ||
    derived.invalidRouteCount !== invalidRouteCount
  ) {
    throw new Error(`${label} route counts must match routes`);
  }
  if (Math.abs(derived.totalDistanceFeet - totalDistanceFeet) > 0.001) {
    throw new Error(`${label}.totalDistanceFeet must match route distances`);
  }
  if (Math.abs(derived.totalTravelSeconds - totalTravelSeconds) > 0.001) {
    throw new Error(`${label}.totalTravelSeconds must match route times`);
  }

  return {
    groupId: requireString(group.groupId, `${label}.groupId`),
    label: validateOperationalRuntimeText(requireString(group.label, `${label}.label`), `${label}.label`),
    routeCount,
    reachableRouteCount,
    unreachableRouteCount,
    invalidRouteCount,
    totalDistanceFeet,
    totalTravelSeconds,
    routes
  };
}

function validateRouteSummary(value: unknown, label: string): WalkingBaselineRouteSummary {
  const route = requireRecord(value, label);
  requireExactKeys(route, label, [
    "routeId",
    "originPathNodeId",
    "destinationPathNodeId",
    "status",
    "distanceFeet",
    "travelSeconds",
    "warningCodes"
  ]);
  return {
    routeId: requireString(route.routeId, `${label}.routeId`),
    originPathNodeId: requireString(route.originPathNodeId, `${label}.originPathNodeId`),
    destinationPathNodeId: requireString(route.destinationPathNodeId, `${label}.destinationPathNodeId`),
    status: requireEnum(route.status, ROUTE_PREVIEW_STATUSES, `${label}.status`),
    distanceFeet: requireNumber(route.distanceFeet, `${label}.distanceFeet`, 0),
    travelSeconds: requireNumber(route.travelSeconds, `${label}.travelSeconds`, 0),
    warningCodes: validateStringArray(route.warningCodes, `${label}.warningCodes`)
  };
}

function validateWalkingBaselineWarning(value: unknown, index: number): WalkingBaselineWarning {
  const label = `warnings[${index}]`;
  const warning = requireRecord(value, label);
  requireExactKeys(warning, label, ["code", "message"]);
  return {
    code: requireString(warning.code, `${label}.code`),
    message: validateOperationalRuntimeText(requireString(warning.message, `${label}.message`), `${label}.message`)
  };
}

function summarizeGroups(groups: WalkingBaselineRouteGroupSummary[]) {
  return groups.reduce(
    (sum, group) => ({
      totalRouteCount: sum.totalRouteCount + group.routeCount,
      reachableRouteCount: sum.reachableRouteCount + group.reachableRouteCount,
      unreachableRouteCount: sum.unreachableRouteCount + group.unreachableRouteCount,
      invalidRouteCount: sum.invalidRouteCount + group.invalidRouteCount,
      totalDistanceFeet: round(sum.totalDistanceFeet + group.totalDistanceFeet),
      totalTravelSeconds: round(sum.totalTravelSeconds + group.totalTravelSeconds)
    }),
    {
      totalRouteCount: 0,
      reachableRouteCount: 0,
      unreachableRouteCount: 0,
      invalidRouteCount: 0,
      totalDistanceFeet: 0,
      totalTravelSeconds: 0
    }
  );
}

function summarizeRoutes(routes: WalkingBaselineRouteSummary[]) {
  return routes.reduce(
    (sum, route) => ({
      routeCount: sum.routeCount + 1,
      reachableRouteCount: sum.reachableRouteCount + (route.status === "reachable" ? 1 : 0),
      unreachableRouteCount: sum.unreachableRouteCount + (route.status === "unreachable" ? 1 : 0),
      invalidRouteCount: sum.invalidRouteCount + (route.status === "invalid" ? 1 : 0),
      totalDistanceFeet: round(sum.totalDistanceFeet + route.distanceFeet),
      totalTravelSeconds: round(sum.totalTravelSeconds + route.travelSeconds)
    }),
    {
      routeCount: 0,
      reachableRouteCount: 0,
      unreachableRouteCount: 0,
      invalidRouteCount: 0,
      totalDistanceFeet: 0,
      totalTravelSeconds: 0
    }
  );
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

function requireInteger(value: unknown, label: string, min: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
