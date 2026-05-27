import type { PlanContract } from "../contracts.js";
import type { ManualAssignmentRoomLoad, ManualRoomAssignment } from "../manual-assignment/manualAssignmentContracts.js";
import { isNurseAssignableRoomType, isRatioCountEligibleRoomType, isRoomLoadEligibleRoomType } from "./roomTypeRules.js";
import { validatePathGraphBlockingRules } from "./pathGraphValidation.js";

export type LegacyLayoutRoomTypeFindingCode =
  | "SOLID_WALL_WITH_DOOR"
  | "SOLID_WALL_WITH_PATH_NODE"
  | "SOLID_WALL_WITH_ROOM_LOAD"
  | "SOLID_WALL_WITH_NURSE_ASSIGNMENT"
  | "STORAGE_WITH_ROOM_LOAD"
  | "STORAGE_WITH_NURSE_ASSIGNMENT"
  | "NON_PATIENT_ROOM_COUNTED_IN_RATIO";

export type LegacyLayoutRoomTypeFinding = {
  code: LegacyLayoutRoomTypeFindingCode;
  roomId: string;
  message: string;
};

export type LegacyLayoutRoomTypeValidationInput = {
  plan: PlanContract;
  roomLoads?: Pick<ManualAssignmentRoomLoad, "roomId">[];
  assignments?: Pick<ManualRoomAssignment, "roomId">[];
  ratioCountRoomIds?: string[];
};

export type LegacyLayoutRoomTypeValidationResult = {
  status: "passed" | "quarantined";
  findings: LegacyLayoutRoomTypeFinding[];
  quarantineMessages: string[];
};

export function validateLegacyLayoutRoomTypeSemantics(
  input: LegacyLayoutRoomTypeValidationInput
): LegacyLayoutRoomTypeValidationResult {
  const roomsById = new Map(input.plan.rooms.map((room) => [room.id, room]));
  const findings: LegacyLayoutRoomTypeFinding[] = [];

  for (const door of input.plan.doors) {
    const room = roomsById.get(door.roomId);
    if (room?.roomType === "solid_wall") {
      findings.push(finding("SOLID_WALL_WITH_DOOR", room.id, "Solid wall / blocked area cannot have doors."));
    }
  }

  for (const issue of validatePathGraphBlockingRules(input.plan).blockingIssues) {
    if (issue.code === "SOLID_WALL_ROOM_PATH_NODE" || issue.code === "SOLID_WALL_DOOR_PATH_NODE") {
      findings.push(finding("SOLID_WALL_WITH_PATH_NODE", issue.roomId, "Solid wall / blocked area cannot have path nodes."));
    }
  }

  for (const roomLoad of input.roomLoads ?? []) {
    const room = roomsById.get(roomLoad.roomId);
    if (room?.roomType === "storage") {
      findings.push(finding("STORAGE_WITH_ROOM_LOAD", room.id, "Storage is excluded from room-load inputs."));
    } else if (room?.roomType === "solid_wall" || (room != null && !isRoomLoadEligibleRoomType(room.roomType))) {
      findings.push(finding("SOLID_WALL_WITH_ROOM_LOAD", room.id, "Solid wall / blocked area is excluded from room-load inputs."));
    }
  }

  for (const assignment of input.assignments ?? []) {
    const room = roomsById.get(assignment.roomId);
    if (room?.roomType === "storage") {
      findings.push(finding("STORAGE_WITH_NURSE_ASSIGNMENT", room.id, "Storage is excluded from nurse assignment."));
    } else if (room?.roomType === "solid_wall" || (room != null && !isNurseAssignableRoomType(room.roomType))) {
      findings.push(finding("SOLID_WALL_WITH_NURSE_ASSIGNMENT", room.id, "Solid wall / blocked area is excluded from nurse assignment."));
    }
  }

  for (const roomId of input.ratioCountRoomIds ?? []) {
    const room = roomsById.get(roomId);
    if (room != null && !isRatioCountEligibleRoomType(room.roomType)) {
      findings.push(finding("NON_PATIENT_ROOM_COUNTED_IN_RATIO", room.id, `${room.roomType} is excluded from capacity and ratio math.`));
    }
  }

  return {
    status: findings.length === 0 ? "passed" : "quarantined",
    findings,
    quarantineMessages: findings.map((entry) => entry.message)
  };
}

function finding(
  code: LegacyLayoutRoomTypeFindingCode,
  roomId: string,
  message: string
): LegacyLayoutRoomTypeFinding {
  return { code, roomId, message };
}
