import {
  validateWalkingBaselineContract,
  WALKING_BASELINE_LIMITATIONS,
  type WalkingBaselineContract,
  type WalkingBaselineRouteGroupSummary,
  type WalkingBaselineRouteSummary
} from "./walkingBaselineContract.js";
import { type RoutePreviewOutput } from "./routePreviewContract.js";

export type WalkingBaselineRoutePreviewGroupInput = {
  groupId: string;
  label: string;
  routePreviews: RoutePreviewOutput[];
};

export type BuildWalkingBaselineInput = {
  baselineId: string;
  planId: string;
  groups: WalkingBaselineRoutePreviewGroupInput[];
};

export function buildWalkingBaseline(input: BuildWalkingBaselineInput): WalkingBaselineContract {
  const routeGroupSummaries = input.groups
    .map((group) => buildRouteGroupSummary(group))
    .sort((left, right) => left.groupId.localeCompare(right.groupId));
  const totals = summarizeGroups(routeGroupSummaries);
  const warnings =
    totals.unreachableRouteCount + totals.invalidRouteCount > 0
      ? [
          {
            code: "INCOMPLETE_ROUTE_GROUPS",
            message: "One or more route previews were unreachable or invalid."
          }
        ]
      : [];

  return validateWalkingBaselineContract({
    schemaVersion: "1.0.0",
    baselineId: input.baselineId,
    planId: input.planId,
    routeGroupSummaries,
    totalRouteCount: totals.totalRouteCount,
    reachableRouteCount: totals.reachableRouteCount,
    unreachableRouteCount: totals.unreachableRouteCount,
    invalidRouteCount: totals.invalidRouteCount,
    totalDistanceFeet: totals.totalDistanceFeet,
    totalTravelSeconds: totals.totalTravelSeconds,
    warnings,
    limitations: [...WALKING_BASELINE_LIMITATIONS]
  });
}

function buildRouteGroupSummary(
  group: WalkingBaselineRoutePreviewGroupInput
): WalkingBaselineRouteGroupSummary {
  const routes = group.routePreviews
    .map((routePreview, index) => buildRouteSummary(group.groupId, routePreview, index))
    .sort((left, right) => left.routeId.localeCompare(right.routeId));
  const totals = summarizeRoutes(routes);
  return {
    groupId: group.groupId,
    label: group.label,
    routeCount: totals.routeCount,
    reachableRouteCount: totals.reachableRouteCount,
    unreachableRouteCount: totals.unreachableRouteCount,
    invalidRouteCount: totals.invalidRouteCount,
    totalDistanceFeet: totals.totalDistanceFeet,
    totalTravelSeconds: totals.totalTravelSeconds,
    routes
  };
}

function buildRouteSummary(
  groupId: string,
  routePreview: RoutePreviewOutput,
  index: number
): WalkingBaselineRouteSummary {
  return {
    routeId: `${groupId}-route-${String(index + 1).padStart(2, "0")}`,
    originPathNodeId: routePreview.originPathNodeId,
    destinationPathNodeId: routePreview.destinationPathNodeId,
    status: routePreview.status,
    distanceFeet: routePreview.totalDistanceFeet,
    travelSeconds: routePreview.totalTravelSeconds,
    warningCodes: routePreview.warnings.map((warning) => warning.code).sort()
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
