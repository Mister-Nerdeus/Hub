import { buildRoutePreview } from "../pathing/buildRoutePreview.js";
import type { PlanContract } from "../contracts.js";
import {
  makeStalePathSyncWarning,
  roundPlan1Number,
  validatePlan1Plan,
  type Plan1ManualAssignmentRecord,
  type Plan1NurseProfile
} from "./plan1AssignmentCommon.js";

export const PLAN_1_ASSIGNMENT_WALKING_LIMITATIONS = [
  "Approximate graph-only walking preview.",
  "Not measured walking truth.",
  "Not staffing safety guidance."
];

export type Plan1AssignmentWalkingPreview = {
  nurseId: string;
  homeStationId: string;
  assignedRoomIds: string[];
  reachableRoomCount: number;
  unreachableRoomCount: number;
  totalApproxDistanceFeet: number;
  totalApproxTravelSeconds: number;
  longestRoomDistanceFeet: number;
  warningCodes: string[];
  limitations: string[];
};

export function buildPlan1AssignmentWalkingPreviews(input: {
  plan: PlanContract;
  nurses: Plan1NurseProfile[];
  assignments: Plan1ManualAssignmentRecord[];
  stalePathSync: boolean;
}): Plan1AssignmentWalkingPreview[] {
  const plan = validatePlan1Plan(input.plan);
  const roomById = new Map(plan.rooms.map((room) => [room.id, room]));
  const stationById = new Map(plan.nurseStations.map((station) => [station.id, station]));
  return input.nurses.map((nurse) => {
    const assignedRoomIds = input.assignments
      .filter((assignment) => assignment.nurseId === nurse.nurseId && assignment.assignmentType === "primary")
      .map((assignment) => assignment.roomId);
    const station = stationById.get(nurse.homeStationId);
    const warningCodes: string[] = [];
    if (input.stalePathSync) {
      warningCodes.push(makeStalePathSyncWarning().code);
    }
    let reachableRoomCount = 0;
    let unreachableRoomCount = 0;
    let totalApproxDistanceFeet = 0;
    let totalApproxTravelSeconds = 0;
    let longestRoomDistanceFeet = 0;

    for (const roomId of assignedRoomIds) {
      const room = roomById.get(roomId);
      if (station == null || room?.pathNodeId == null) {
        unreachableRoomCount += 1;
        warningCodes.push("UNREACHABLE_ROUTE");
        continue;
      }
      const route = buildRoutePreview(plan, {
        schemaVersion: "1.0.0",
        planId: plan.planId,
        originPathNodeId: station.pathNodeId,
        destinationPathNodeId: room.pathNodeId
      });
      if (route.status !== "reachable") {
        unreachableRoomCount += 1;
        warningCodes.push("UNREACHABLE_ROUTE");
        continue;
      }
      reachableRoomCount += 1;
      totalApproxDistanceFeet += route.totalDistanceFeet;
      totalApproxTravelSeconds += route.totalTravelSeconds;
      longestRoomDistanceFeet = Math.max(longestRoomDistanceFeet, route.totalDistanceFeet);
      for (const routeWarning of route.warnings) {
        if (!warningCodes.includes(routeWarning.code)) {
          warningCodes.push(routeWarning.code);
        }
      }
    }

    return {
      nurseId: nurse.nurseId,
      homeStationId: nurse.homeStationId,
      assignedRoomIds,
      reachableRoomCount,
      unreachableRoomCount,
      totalApproxDistanceFeet: roundPlan1Number(totalApproxDistanceFeet),
      totalApproxTravelSeconds: roundPlan1Number(totalApproxTravelSeconds),
      longestRoomDistanceFeet: roundPlan1Number(longestRoomDistanceFeet),
      warningCodes,
      limitations: [...PLAN_1_ASSIGNMENT_WALKING_LIMITATIONS]
    };
  });
}
