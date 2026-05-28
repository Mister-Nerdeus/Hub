import type { LayoutOccupancyType } from "./roomBedBayTypes.js";

export type RoomBedBayEligibilityRule = {
  occupancyType: LayoutOccupancyType;
  patientCareEligible: boolean;
  bedCountEligible: boolean;
  roomCountEligible: boolean;
  assignmentEligible: boolean;
  ratioEligible: boolean;
};

const patientCare = {
  patientCareEligible: true,
  bedCountEligible: true,
  assignmentEligible: true,
  ratioEligible: true
} as const;

export const ROOM_BED_BAY_ELIGIBILITY_RULES = {
  room: {
    occupancyType: "room",
    ...patientCare,
    roomCountEligible: true
  },
  bed_position: {
    occupancyType: "bed_position",
    ...patientCare,
    roomCountEligible: false
  },
  split_bay: {
    occupancyType: "split_bay",
    patientCareEligible: true,
    bedCountEligible: false,
    roomCountEligible: true,
    assignmentEligible: false,
    ratioEligible: false
  },
  storage: {
    occupancyType: "storage",
    patientCareEligible: false,
    bedCountEligible: false,
    roomCountEligible: false,
    assignmentEligible: false,
    ratioEligible: false
  },
  support_area: {
    occupancyType: "support_area",
    patientCareEligible: false,
    bedCountEligible: false,
    roomCountEligible: false,
    assignmentEligible: false,
    ratioEligible: false
  },
  hallway: {
    occupancyType: "hallway",
    patientCareEligible: false,
    bedCountEligible: false,
    roomCountEligible: false,
    assignmentEligible: false,
    ratioEligible: false
  },
  solid_wall: {
    occupancyType: "solid_wall",
    patientCareEligible: false,
    bedCountEligible: false,
    roomCountEligible: false,
    assignmentEligible: false,
    ratioEligible: false
  }
} as const satisfies Record<LayoutOccupancyType, RoomBedBayEligibilityRule>;

export function getRoomBedBayEligibilityRule(occupancyType: LayoutOccupancyType): RoomBedBayEligibilityRule {
  return ROOM_BED_BAY_ELIGIBILITY_RULES[occupancyType];
}

export function isPatientCareEligibleOccupancy(occupancyType: LayoutOccupancyType): boolean {
  return getRoomBedBayEligibilityRule(occupancyType).patientCareEligible;
}

export function isBedCountEligibleOccupancy(occupancyType: LayoutOccupancyType): boolean {
  return getRoomBedBayEligibilityRule(occupancyType).bedCountEligible;
}

export function isRoomCountEligibleOccupancy(occupancyType: LayoutOccupancyType): boolean {
  return getRoomBedBayEligibilityRule(occupancyType).roomCountEligible;
}

export function isAssignmentEligibleOccupancy(occupancyType: LayoutOccupancyType): boolean {
  return getRoomBedBayEligibilityRule(occupancyType).assignmentEligible;
}

export function isRatioEligibleOccupancy(occupancyType: LayoutOccupancyType): boolean {
  return getRoomBedBayEligibilityRule(occupancyType).ratioEligible;
}
