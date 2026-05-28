import { canonicalRoomBedBayEntry, type LayoutOccupancyType } from "./roomBedBayTypes.js";
import {
  getRoomBedBayEligibilityRule,
  isAssignmentEligibleOccupancy,
  isRatioEligibleOccupancy
} from "./roomBedBayRules.js";
import { splitBayForRoomId } from "./splitBayContract.js";

export type SplitBayFixtureOccupancyBridge = {
  objectId: string;
  occupancyType: LayoutOccupancyType;
  splitBayId: string | null;
  physicalRoomCountContribution: number;
  bedCountContribution: number;
  assignmentEligible: boolean;
  ratioEligible: boolean;
};

export function getSplitBayFixtureOccupancyBridge(objectId: string): SplitBayFixtureOccupancyBridge {
  const entry = canonicalRoomBedBayEntry(objectId);
  if (entry == null) {
    throw new Error(`unsupported canonical occupancy object: ${objectId}`);
  }

  const splitBay = splitBayForRoomId(objectId);
  const rule = getRoomBedBayEligibilityRule(entry.occupancyType);
  const splitBayBedPositionCount = splitBay?.bedPositionCount ?? 1;
  const physicalRoomCountContribution =
    entry.occupancyType === "bed_position" && splitBay != null
      ? splitBay.physicalBayCount / splitBayBedPositionCount
      : Number(rule.roomCountEligible);
  return {
    objectId,
    occupancyType: entry.occupancyType,
    splitBayId: splitBay?.splitBayId ?? entry.physicalBayId,
    physicalRoomCountContribution,
    bedCountContribution: entry.bedPositionCount,
    assignmentEligible: isAssignmentEligibleOccupancy(entry.occupancyType),
    ratioEligible: isRatioEligibleOccupancy(entry.occupancyType)
  };
}

export function getOccupancyTypeForRoomId(roomId: string): LayoutOccupancyType {
  return getSplitBayFixtureOccupancyBridge(roomId).occupancyType;
}

export function getSplitBayIdForRoomId(roomId: string): string | null {
  return getSplitBayFixtureOccupancyBridge(roomId).splitBayId;
}

export function getBedCountContributionForRoomId(roomId: string): number {
  return getSplitBayFixtureOccupancyBridge(roomId).bedCountContribution;
}

export function getPhysicalRoomCountContributionForRoomId(roomId: string): number {
  return getSplitBayFixtureOccupancyBridge(roomId).physicalRoomCountContribution;
}

export function isAssignmentEligibleByFixtureBridge(roomId: string): boolean {
  return getSplitBayFixtureOccupancyBridge(roomId).assignmentEligible;
}

export function isRatioEligibleByFixtureBridge(roomId: string): boolean {
  return getSplitBayFixtureOccupancyBridge(roomId).ratioEligible;
}
