import { PLAN_1_ID, roundPlan1Number } from "../assignment/plan1AssignmentCommon.js";
import type { PlanContract } from "../contracts.js";
import { calculatePathTravelTime } from "../pathing/pathTravelTime.js";
import {
  validateWalkingBaselineContract,
  type WalkingBaselineContract
} from "../pathing/walkingBaselineContract.js";
import type { Plan1GeneratedSyntheticTask } from "../scenario/plan1ScenarioValidation.js";
import type { Plan1SimulationInput } from "./plan1SimulationInputContract.js";

export const PLAN_1_TASK_WALKING_WARNING_CODES = [
  "TASK_ROUTE_DISTANCE_FALLBACK",
  "TASK_ROUTE_DISTANCE_MISSING",
  "STALE_PATH_SYNC",
  "APPROXIMATE_GRAPH_ONLY"
] as const;

export type Plan1TaskWalkingWarningCode = (typeof PLAN_1_TASK_WALKING_WARNING_CODES)[number];

export const PLAN_1_TASK_WALKING_DISTANCE_SOURCES = [
  "plan_1_path_graph",
  "walking_baseline",
  "fallback_constant",
  "missing_route_warning"
] as const;

export type Plan1TaskWalkingDistanceSource = (typeof PLAN_1_TASK_WALKING_DISTANCE_SOURCES)[number];

export type Plan1TaskWalkingDistanceOutput = {
  taskId: string;
  requiresWalkingRoute: boolean;
  roomId: string;
  assignedNurseId: string;
  homeStationId: string | null;
  distanceSource: Plan1TaskWalkingDistanceSource;
  approxDistanceFeet: number;
  warningCodes: Plan1TaskWalkingWarningCode[];
  limitations: string[];
  nonClaims: string[];
};

export type Plan1TaskWalkingDistanceSummary = {
  taskWalkingDistances: Plan1TaskWalkingDistanceOutput[];
  pathBasedTaskCount: number;
  fallbackTaskCount: number;
  missingRouteTaskCount: number;
  totalPathBasedWalkingFeet: number;
  totalFallbackWalkingFeet: number;
  walkingWarningCodes: Plan1TaskWalkingWarningCode[];
  limitations: string[];
  nonClaims: string[];
};

const NON_WALKING_DISTANCE_FEET = 20;
const FALLBACK_WALKING_DISTANCE_FEET = 120;

const WALKING_DISTANCE_LIMITATIONS = [
  "Plan 1 walking distances are deterministic operational estimates.",
  "Path graph and walking baseline distances are approximate fixture values, not measured walking truth.",
  "Fallback distances are explicitly labeled when route lookup cannot resolve a Plan 1 path.",
  "No optimizer, staffing guidance, clinical safety claim, or care quality claim is produced."
];

const WALKING_DISTANCE_NON_CLAIMS = [
  "Synthetic operational modeling only.",
  "Not a clinical safety score.",
  "Not a staffing compliance recommendation.",
  "Not a legal compliance assessment.",
  "Not a patient outcome prediction.",
  "Not based on real patient, staff, EHR, or hospital data."
];

export function resolvePlan1TaskWalkingDistance(input: {
  simulationInput: Plan1SimulationInput;
  task: Plan1GeneratedSyntheticTask;
  plan: PlanContract;
  walkingBaseline?: WalkingBaselineContract | null;
  allowFallback?: boolean;
}): Plan1TaskWalkingDistanceOutput {
  if (input.simulationInput.planId !== PLAN_1_ID || input.plan.planId !== PLAN_1_ID) {
    throw new Error("Plan 1 task walking distance only accepts default-er-layout-plan-1 inputs");
  }

  const nurse = input.simulationInput.assignmentWorkflowState.nurses.find(
    (candidate) => candidate.nurseId === input.task.assignedNurseId
  );
  const homeStationId = nurse?.homeStationId ?? null;
  const baseWarnings = stalePathWarnings(input.simulationInput.assignmentWorkflowState.pathSyncStatus);
  const base = {
    taskId: input.task.taskId,
    requiresWalkingRoute: input.task.requiresWalkingRoute,
    roomId: input.task.roomId,
    assignedNurseId: input.task.assignedNurseId,
    homeStationId,
    limitations: [...WALKING_DISTANCE_LIMITATIONS],
    nonClaims: [...WALKING_DISTANCE_NON_CLAIMS]
  };

  if (!input.task.requiresWalkingRoute) {
    return {
      ...base,
      distanceSource: "fallback_constant",
      approxDistanceFeet: NON_WALKING_DISTANCE_FEET,
      warningCodes: baseWarnings
    };
  }

  const routeRefs = resolveRouteRefs(input.plan, input.task.roomId, homeStationId);
  if (routeRefs == null) {
    return missingRouteOutput(base, input.allowFallback ?? false, baseWarnings);
  }

  const baselineDistance = findBaselineDistance(input.walkingBaseline ?? null, routeRefs.originPathNodeId, routeRefs.destinationPathNodeId);
  if (baselineDistance != null) {
    return {
      ...base,
      distanceSource: "walking_baseline",
      approxDistanceFeet: roundPlan1Number(baselineDistance.distanceFeet),
      warningCodes: uniqueWarnings([...baseWarnings, ...baselineDistance.warningCodes])
    };
  }

  try {
    const graphDistance = calculatePathTravelTime({
      plan: input.plan,
      originNodeId: routeRefs.originPathNodeId,
      destinationNodeId: routeRefs.destinationPathNodeId,
      walkingSpeedFeetPerMinute: 220
    });
    if (graphDistance.travelDistanceFeet > 0) {
      return {
        ...base,
        distanceSource: "plan_1_path_graph",
        approxDistanceFeet: roundPlan1Number(graphDistance.travelDistanceFeet),
        warningCodes: uniqueWarnings([...baseWarnings, "APPROXIMATE_GRAPH_ONLY"])
      };
    }
  } catch {
    return missingRouteOutput(base, input.allowFallback ?? false, baseWarnings);
  }

  return missingRouteOutput(base, input.allowFallback ?? false, baseWarnings);
}

export function summarizePlan1TaskWalkingDistances(input: {
  simulationInput: Plan1SimulationInput;
  tasks: Plan1GeneratedSyntheticTask[];
  plan: PlanContract;
  walkingBaseline?: WalkingBaselineContract | null;
  allowFallback?: boolean;
}): Plan1TaskWalkingDistanceSummary {
  const taskWalkingDistances = input.tasks.map((task) =>
    resolvePlan1TaskWalkingDistance({
      simulationInput: input.simulationInput,
      task,
      plan: input.plan,
      walkingBaseline: input.walkingBaseline,
      allowFallback: input.allowFallback
    })
  );
  const pathSources = new Set<Plan1TaskWalkingDistanceSource>(["plan_1_path_graph", "walking_baseline"]);
  const pathBased = taskWalkingDistances.filter((distance) => pathSources.has(distance.distanceSource));
  const fallback = taskWalkingDistances.filter(
    (distance) => distance.requiresWalkingRoute && distance.distanceSource === "fallback_constant"
  );
  const missing = taskWalkingDistances.filter((distance) => distance.warningCodes.includes("TASK_ROUTE_DISTANCE_MISSING"));
  return {
    taskWalkingDistances,
    pathBasedTaskCount: pathBased.length,
    fallbackTaskCount: fallback.length,
    missingRouteTaskCount: missing.length,
    totalPathBasedWalkingFeet: roundPlan1Number(sum(pathBased.map((distance) => distance.approxDistanceFeet))),
    totalFallbackWalkingFeet: roundPlan1Number(sum(fallback.map((distance) => distance.approxDistanceFeet))),
    walkingWarningCodes: uniqueWarnings(taskWalkingDistances.flatMap((distance) => distance.warningCodes)),
    limitations: [...WALKING_DISTANCE_LIMITATIONS],
    nonClaims: [...WALKING_DISTANCE_NON_CLAIMS]
  };
}

function resolveRouteRefs(
  plan: PlanContract,
  roomId: string,
  homeStationId: string | null
): { originPathNodeId: string; destinationPathNodeId: string } | null {
  if (homeStationId == null) {
    return null;
  }
  const station = plan.nurseStations.find((candidate) => candidate.id === homeStationId);
  const room = plan.rooms.find((candidate) => candidate.id === roomId);
  if (station == null || room == null || room.pathNodeId == null) {
    return null;
  }
  return {
    originPathNodeId: station.pathNodeId,
    destinationPathNodeId: room.pathNodeId
  };
}

function findBaselineDistance(
  walkingBaseline: WalkingBaselineContract | null,
  originPathNodeId: string,
  destinationPathNodeId: string
): { distanceFeet: number; warningCodes: Plan1TaskWalkingWarningCode[] } | null {
  if (walkingBaseline == null) {
    return null;
  }
  const baseline = validateWalkingBaselineContract(walkingBaseline);
  for (const group of baseline.routeGroupSummaries) {
    const route = group.routes.find(
      (candidate) =>
        candidate.status === "reachable" &&
        candidate.originPathNodeId === originPathNodeId &&
        candidate.destinationPathNodeId === destinationPathNodeId
    );
    if (route != null) {
      return {
        distanceFeet: route.distanceFeet,
        warningCodes: route.warningCodes.includes("APPROXIMATE_GRAPH_ONLY") ? ["APPROXIMATE_GRAPH_ONLY"] : []
      };
    }
  }
  return null;
}

function missingRouteOutput(
  base: Omit<Plan1TaskWalkingDistanceOutput, "distanceSource" | "approxDistanceFeet" | "warningCodes">,
  allowFallback: boolean,
  warningCodes: Plan1TaskWalkingWarningCode[]
): Plan1TaskWalkingDistanceOutput {
  if (allowFallback) {
    return {
      ...base,
      distanceSource: "fallback_constant",
      approxDistanceFeet: FALLBACK_WALKING_DISTANCE_FEET,
      warningCodes: uniqueWarnings([...warningCodes, "TASK_ROUTE_DISTANCE_MISSING", "TASK_ROUTE_DISTANCE_FALLBACK"])
    };
  }
  return {
    ...base,
    distanceSource: "missing_route_warning",
    approxDistanceFeet: 0,
    warningCodes: uniqueWarnings([...warningCodes, "TASK_ROUTE_DISTANCE_MISSING"])
  };
}

function stalePathWarnings(pathSyncStatus: string): Plan1TaskWalkingWarningCode[] {
  return pathSyncStatus === "fresh" ? [] : ["STALE_PATH_SYNC"];
}

function uniqueWarnings(values: string[]): Plan1TaskWalkingWarningCode[] {
  return [...new Set(values)]
    .filter((value): value is Plan1TaskWalkingWarningCode =>
      PLAN_1_TASK_WALKING_WARNING_CODES.includes(value as Plan1TaskWalkingWarningCode)
    )
    .sort();
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
