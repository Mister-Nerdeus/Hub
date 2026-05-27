import { validatePlanContract, type PlanContract } from "../contracts.js";
import {
  buildPatientCareRoutingDestinations,
  isPatientCareRoutingDestinationRoomType
} from "./walkingDistanceEligibility.js";

export type PathGraphBlockingIssueCode =
  | "SOLID_WALL_ROOM_PATH_NODE"
  | "SOLID_WALL_DOOR_PATH_NODE"
  | "SOLID_WALL_ROUTE_EDGE";

export type PathGraphBlockingIssue = {
  code: PathGraphBlockingIssueCode;
  roomId: string;
  pathNodeId?: string;
  doorId?: string;
  edgeId?: string;
  message: string;
};

export type PathGraphBlockingValidationResult = {
  status: "passed" | "failed";
  patientCareRoutingDestinationRoomIds: string[];
  storageRoutingDestinationRoomIds: string[];
  solidWallRoutingDestinationRoomIds: string[];
  blockingIssues: PathGraphBlockingIssue[];
};

export function validatePathGraphBlockingRules(planInput: PlanContract): PathGraphBlockingValidationResult {
  const plan = validatePlanContract(planInput);
  const roomsById = new Map(plan.rooms.map((room) => [room.id, room]));
  const pathNodeIdsBySolidWallRoomId = new Map<string, Set<string>>();
  const blockingIssues: PathGraphBlockingIssue[] = [];

  for (const room of plan.rooms) {
    if (room.roomType !== "solid_wall") {
      continue;
    }
    const nodeIds = pathNodeIdsBySolidWallRoomId.get(room.id) ?? new Set<string>();
    pathNodeIdsBySolidWallRoomId.set(room.id, nodeIds);
    if (room.pathNodeId != null) {
      nodeIds.add(room.pathNodeId);
      blockingIssues.push({
        code: "SOLID_WALL_ROOM_PATH_NODE",
        roomId: room.id,
        pathNodeId: room.pathNodeId,
        message: "Solid wall / blocked area cannot own a room path node."
      });
    }
  }

  for (const door of plan.doors) {
    const room = roomsById.get(door.roomId);
    if (room?.roomType !== "solid_wall") {
      continue;
    }
    const linkedPathNodeIds = new Set(
      [
        door.pathNodeId,
        ...plan.pathNodes
          .filter((node) => node.nodeType === "room_door" && node.linkedObjectId === door.id)
          .map((node) => node.id)
      ].filter((pathNodeId): pathNodeId is string => pathNodeId != null)
    );
    const nodeIds = pathNodeIdsBySolidWallRoomId.get(room.id) ?? new Set<string>();
    pathNodeIdsBySolidWallRoomId.set(room.id, nodeIds);
    for (const pathNodeId of linkedPathNodeIds) {
      nodeIds.add(pathNodeId);
      blockingIssues.push({
        code: "SOLID_WALL_DOOR_PATH_NODE",
        roomId: room.id,
        doorId: door.id,
        pathNodeId,
        message: "Solid wall / blocked area cannot create or receive room-door path nodes."
      });
    }
  }

  for (const [roomId, nodeIds] of pathNodeIdsBySolidWallRoomId.entries()) {
    for (const edge of plan.pathEdges) {
      if (nodeIds.has(edge.fromNodeId) || nodeIds.has(edge.toNodeId)) {
        blockingIssues.push({
          code: "SOLID_WALL_ROUTE_EDGE",
          roomId,
          edgeId: edge.id,
          message: "Solid wall / blocked area cannot participate in route graph edges."
        });
      }
    }
  }

  return {
    status: blockingIssues.length === 0 ? "passed" : "failed",
    patientCareRoutingDestinationRoomIds: buildPatientCareRoutingDestinations(plan).map((destination) => destination.roomId),
    storageRoutingDestinationRoomIds: plan.rooms
      .filter((room) => room.roomType === "storage" && isPatientCareRoutingDestinationRoomType(room.roomType))
      .map((room) => room.id)
      .sort(),
    solidWallRoutingDestinationRoomIds: plan.rooms
      .filter((room) => room.roomType === "solid_wall" && isPatientCareRoutingDestinationRoomType(room.roomType))
      .map((room) => room.id)
      .sort(),
    blockingIssues
  };
}
