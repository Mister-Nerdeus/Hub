import type { PlanContract } from "../contracts.js";
import { isRoomLoadEligibleRoomType } from "../floorplans/roomTypeRules.js";

export type RoomLoadLike = {
  roomId: string;
};

export type RoomLoadEligibilitySummary = {
  eligibleRoomIds: string[];
  excludedRoomIds: string[];
};

export function summarizeRoomLoadEligibility(plan: PlanContract): RoomLoadEligibilitySummary {
  const eligibleRoomIds: string[] = [];
  const excludedRoomIds: string[] = [];
  for (const room of plan.rooms) {
    if (isRoomLoadEligibleRoomType(room.roomType)) {
      eligibleRoomIds.push(room.id);
    } else {
      excludedRoomIds.push(room.id);
    }
  }
  return { eligibleRoomIds, excludedRoomIds };
}

export function filterEligibleRoomLoads<T extends RoomLoadLike>(
  roomLoads: T[],
  plan: PlanContract
): T[] {
  const eligibleRoomIds = new Set(summarizeRoomLoadEligibility(plan).eligibleRoomIds);
  return roomLoads.filter((roomLoad) => eligibleRoomIds.has(roomLoad.roomId));
}

export function assertRoomLoadsEligibleForPlan<T extends RoomLoadLike>(
  roomLoads: T[],
  plan: PlanContract
): void {
  const roomById = new Map(plan.rooms.map((room) => [room.id, room]));
  for (const roomLoad of roomLoads) {
    const room = roomById.get(roomLoad.roomId);
    if (room != null && !isRoomLoadEligibleRoomType(room.roomType)) {
      throw new Error(`roomLoad ${roomLoad.roomId} references a room excluded from room-load inputs`);
    }
  }
}
