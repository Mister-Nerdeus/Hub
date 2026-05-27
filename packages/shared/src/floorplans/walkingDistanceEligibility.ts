import type { PlanContract, Room } from "../contracts.js";
import type { ManualWalkingRoomLocation } from "../manual-assignment/walkingBurden.js";
import { isBurdenScoreEligibleRoomType, isPathNodeEligibleRoomType, type SemanticRoomType } from "./roomTypeRules.js";

export type PatientCareRoutingDestination = {
  roomId: string;
  pathNodeId: string;
  roomType: SemanticRoomType;
};

export function isPatientCareRoutingDestinationRoomType(roomType: SemanticRoomType): boolean {
  return isPathNodeEligibleRoomType(roomType) && isBurdenScoreEligibleRoomType(roomType);
}

export function isWalkingDistanceEligibleRoomType(roomType: SemanticRoomType): boolean {
  return isPatientCareRoutingDestinationRoomType(roomType);
}

export function buildPatientCareRoutingDestinations(plan: Pick<PlanContract, "rooms">): PatientCareRoutingDestination[] {
  return plan.rooms
    .filter((room): room is Room & { pathNodeId: string } =>
      room.pathNodeId != null && isPatientCareRoutingDestinationRoomType(room.roomType)
    )
    .map((room) => ({
      roomId: room.id,
      pathNodeId: room.pathNodeId,
      roomType: room.roomType
    }))
    .sort((left, right) => left.roomId.localeCompare(right.roomId));
}

export function isWalkingDistanceEligibleRoomLocation(room: ManualWalkingRoomLocation): boolean {
  return room.roomType == null || isWalkingDistanceEligibleRoomType(room.roomType);
}
