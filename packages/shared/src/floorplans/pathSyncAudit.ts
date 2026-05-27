import { validatePlanContract, type PlanContract } from "../contracts.js";
import {
  validateAuthoringDraftContract,
  type AuthoringDraftContract
} from "./authoringDraftContract.js";
import type { AuthoringWarningCode } from "./authoringWarningContract.js";
import { isPatientCareRoutingDestinationRoomType } from "./walkingDistanceEligibility.js";

export type PathSyncAuditResult = {
  pathSyncStatus: AuthoringDraftContract["pathSyncStatus"];
  roomCount: number;
  roomsWithDoorCount: number;
  roomsWithPathNodeCount: number;
  roomsMissingDoor: string[];
  roomsMissingPathNode: string[];
  unreachableRoomIds: string[];
  blockingIssues: AuthoringWarningCode[];
  warningIssues: AuthoringWarningCode[];
  simulationReady: boolean;
  limitations: string[];
};

export function auditPathSyncStatus(input: {
  authoringDraft: AuthoringDraftContract;
  plan?: PlanContract;
}): PathSyncAuditResult {
  const draft = validateAuthoringDraftContract(input.authoringDraft);
  const plan = validatePlanContract(input.plan ?? draft.sourcePlan);
  const roomIds = draft.editableLayout.rooms
    .filter((room) => isPatientCareRoutingDestinationRoomType(room.roomType))
    .map((room) => room.id)
    .sort();
  const routeEligibleRoomIds = new Set(roomIds);
  const roomsWithDoor = new Set(
    draft.editableLayout.doors
      .filter((door) => door.ownerKind === "room")
      .filter((door) => routeEligibleRoomIds.has(door.ownerId))
      .map((door) => door.ownerId)
  );
  const pathNodeIds = new Set(plan.pathNodes.map((node) => node.id));
  const roomsWithPathNode = new Set(
    plan.rooms
      .filter((room) => room.pathNodeId != null && pathNodeIds.has(room.pathNodeId))
      .map((room) => room.id)
  );
  for (const node of plan.pathNodes) {
    if (node.nodeType === "room_door" && node.linkedObjectId != null) {
      const door = plan.doors.find((candidate) => candidate.id === node.linkedObjectId);
      if (door != null && routeEligibleRoomIds.has(door.roomId)) {
        roomsWithPathNode.add(door.roomId);
      }
    }
  }

  const roomsMissingDoor = roomIds.filter((roomId) => !roomsWithDoor.has(roomId));
  const roomsMissingPathNode = roomIds.filter((roomId) => !roomsWithPathNode.has(roomId));
  const unreachableRoomIds = findUnreachableRooms(plan, roomIds);
  const blockingIssues: AuthoringWarningCode[] = [];
  const warningIssues: AuthoringWarningCode[] = [];
  if (roomsMissingDoor.length > 0) {
    blockingIssues.push("ROOM_MISSING_DOOR");
  }
  if (roomsMissingPathNode.length > 0) {
    blockingIssues.push("ROOM_MISSING_PATH_NODE");
  }
  if (unreachableRoomIds.length > 0) {
    blockingIssues.push("PATH_GRAPH_UNREACHABLE_ROOM");
  }
  if (draft.pathSyncStatus !== "fresh") {
    warningIssues.push("PATH_SYNC_STALE");
    blockingIssues.push("SIMULATION_READY_EXPORT_BLOCKED");
  }

  return {
    pathSyncStatus: draft.pathSyncStatus,
    roomCount: roomIds.length,
    roomsWithDoorCount: roomIds.filter((roomId) => roomsWithDoor.has(roomId)).length,
    roomsWithPathNodeCount: roomIds.filter((roomId) => roomsWithPathNode.has(roomId)).length,
    roomsMissingDoor,
    roomsMissingPathNode,
    unreachableRoomIds,
    blockingIssues: unique(blockingIssues),
    warningIssues: unique(warningIssues),
    simulationReady: blockingIssues.length === 0,
    limitations: [
      "Route access audit verifies graph connectivity and missing links; it does not claim exact walking route truth."
    ]
  };
}

function findUnreachableRooms(plan: PlanContract, expectedRoomIds: string[]): string[] {
  if (plan.pathNodes.length === 0) {
    return expectedRoomIds;
  }
  const adjacency = new Map<string, Set<string>>();
  for (const node of plan.pathNodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of plan.pathEdges) {
    if (edge.blocked) {
      continue;
    }
    adjacency.get(edge.fromNodeId)?.add(edge.toNodeId);
    adjacency.get(edge.toNodeId)?.add(edge.fromNodeId);
  }
  const seedIds = plan.pathNodes
    .filter((node) => node.nodeType === "station" || node.nodeType === "hallway")
    .map((node) => node.id);
  if (seedIds.length === 0) {
    return expectedRoomIds;
  }
  const reachable = new Set<string>();
  const queue = [...seedIds];
  for (const seed of seedIds) {
    reachable.add(seed);
  }
  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) {
      continue;
    }
    for (const next of adjacency.get(current) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }
  return expectedRoomIds.filter((roomId) => {
    const room = plan.rooms.find((candidate) => candidate.id === roomId);
    if (room?.pathNodeId != null) {
      return !reachable.has(room.pathNodeId);
    }
    const doorIds = plan.doors.filter((door) => door.roomId === roomId).map((door) => door.id);
    const roomDoorNode = plan.pathNodes.find(
      (node) => node.nodeType === "room_door" && node.linkedObjectId != null && doorIds.includes(node.linkedObjectId)
    );
    return roomDoorNode == null || !reachable.has(roomDoorNode.id);
  });
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
