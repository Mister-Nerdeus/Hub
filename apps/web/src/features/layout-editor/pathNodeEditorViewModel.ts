import {
  buildPatientCareRoutingDestinations,
  validatePathGraphBlockingRules,
  type PlanContract
} from "@nerdeus/shared";

export type PathNodeRoomOption = {
  roomId: string;
  pathNodeId: string;
  eligibleForPatientCareRouting: true;
};

export type PathNodeEditorValidationViewModel = {
  patientCareDestinationRoomIds: string[];
  blockingIssueCount: number;
  solidWallPathNodeBlocked: boolean;
  storageExcludedFromPatientCareRouting: boolean;
};

export function buildPathNodeRoomOptions(plan: PlanContract): PathNodeRoomOption[] {
  return buildPatientCareRoutingDestinations(plan).map((destination) => ({
    roomId: destination.roomId,
    pathNodeId: destination.pathNodeId,
    eligibleForPatientCareRouting: true
  }));
}

export function buildPathNodeEditorValidationViewModel(plan: PlanContract): PathNodeEditorValidationViewModel {
  const validation = validatePathGraphBlockingRules(plan);
  const patientCareDestinationRoomIds = validation.patientCareRoutingDestinationRoomIds;
  return {
    patientCareDestinationRoomIds,
    blockingIssueCount: validation.blockingIssues.length,
    solidWallPathNodeBlocked: validation.blockingIssues.some((issue) => issue.code === "SOLID_WALL_ROOM_PATH_NODE" || issue.code === "SOLID_WALL_DOOR_PATH_NODE"),
    storageExcludedFromPatientCareRouting: !patientCareDestinationRoomIds.some((roomId) => {
      const room = plan.rooms.find((candidate) => candidate.id === roomId);
      return room?.roomType === "storage";
    })
  };
}
