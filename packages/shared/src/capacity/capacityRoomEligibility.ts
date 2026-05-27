import type { PlanContract, Room } from "../contracts.js";
import { isRatioCountEligibleRoomType } from "../floorplans/roomTypeRules.js";

export type CapacityRoomEligibilitySummary = {
  eligibleActiveRoomIds: string[];
  patientCareRoomCount: number;
  ratioCountRoomCount: number;
  excludedRoomIds: string[];
  excludedRoomCount: number;
};

export function isCapacityRatioEligibleRoom(room: Pick<Room, "roomType">): boolean {
  return isRatioCountEligibleRoomType(room.roomType);
}

export function summarizeCapacityRoomEligibility(plan: PlanContract): CapacityRoomEligibilitySummary {
  const eligible = plan.rooms.filter(isCapacityRatioEligibleRoom);
  const excluded = plan.rooms.filter((room) => !isCapacityRatioEligibleRoom(room));
  return {
    eligibleActiveRoomIds: eligible.map((room) => room.id).sort(),
    patientCareRoomCount: eligible.length,
    ratioCountRoomCount: eligible.length,
    excludedRoomIds: excluded.map((room) => room.id).sort(),
    excludedRoomCount: excluded.length
  };
}
