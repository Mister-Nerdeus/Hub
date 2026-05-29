import type { RoomType } from "../contracts.js";
import type { EditableRoomType } from "../layout-editor/editableLayoutGeometryContract.js";

export type SemanticRoomType = RoomType | EditableRoomType;

export type RoomTypeRule = {
  roomType: SemanticRoomType;
  patientCareEligible: boolean;
  nurseAssignable: boolean;
  roomLoadEligible: boolean;
  ratioCountEligible: boolean;
  burdenScoreEligible: boolean;
  pathNodeEligible: boolean;
  doorEligible: boolean;
  travelBlocking: boolean;
  presentationMuted: boolean;
};

const patientCareRules = {
  patientCareEligible: true,
  nurseAssignable: true,
  roomLoadEligible: true,
  ratioCountEligible: true,
  burdenScoreEligible: true,
  pathNodeEligible: true,
  doorEligible: true,
  travelBlocking: false,
  presentationMuted: false
} as const;

export const ROOM_TYPE_RULES = {
  standard: { roomType: "standard", ...patientCareRules },
  trauma: { roomType: "trauma", ...patientCareRules },
  isolation: { roomType: "isolation", ...patientCareRules },
  psych: { roomType: "psych", ...patientCareRules },
  behavioral: { roomType: "behavioral", ...patientCareRules },
  hall_bed: { roomType: "hall_bed", ...patientCareRules },
  procedure: { roomType: "procedure", ...patientCareRules },
  overflow: { roomType: "overflow", ...patientCareRules },
  provider_pharmacy: {
    roomType: "provider_pharmacy",
    patientCareEligible: false,
    nurseAssignable: false,
    roomLoadEligible: false,
    ratioCountEligible: false,
    burdenScoreEligible: false,
    pathNodeEligible: false,
    doorEligible: true,
    travelBlocking: false,
    presentationMuted: true
  },
  storage: {
    roomType: "storage",
    patientCareEligible: false,
    nurseAssignable: false,
    roomLoadEligible: false,
    ratioCountEligible: false,
    burdenScoreEligible: false,
    pathNodeEligible: false,
    doorEligible: true,
    travelBlocking: false,
    presentationMuted: true
  },
  solid_wall: {
    roomType: "solid_wall",
    patientCareEligible: false,
    nurseAssignable: false,
    roomLoadEligible: false,
    ratioCountEligible: false,
    burdenScoreEligible: false,
    pathNodeEligible: false,
    doorEligible: false,
    travelBlocking: true,
    presentationMuted: true
  }
} as const satisfies Record<string, RoomTypeRule>;

export function getRoomTypeRule(roomType: SemanticRoomType): RoomTypeRule {
  const rule = ROOM_TYPE_RULES[roomType as keyof typeof ROOM_TYPE_RULES];
  if (rule == null) {
    throw new Error(`unsupported room type rule: ${roomType}`);
  }
  return rule;
}

export function isPatientCareRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).patientCareEligible;
}

export function isNurseAssignableRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).nurseAssignable;
}

export function isRoomLoadEligibleRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).roomLoadEligible;
}

export function isRatioCountEligibleRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).ratioCountEligible;
}

export function isBurdenScoreEligibleRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).burdenScoreEligible;
}

export function isPathNodeEligibleRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).pathNodeEligible;
}

export function isDoorEligibleRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).doorEligible;
}

export function isTravelBlockingRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).travelBlocking;
}

export function isPresentationMutedRoomType(roomType: SemanticRoomType): boolean {
  return getRoomTypeRule(roomType).presentationMuted;
}
