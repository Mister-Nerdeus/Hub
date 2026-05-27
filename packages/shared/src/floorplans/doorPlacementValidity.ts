import type {
  EditableDoorGeometry,
  EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { detectDoorAdjacency } from "./doorAdjacency.js";
import { wallLengthFeet } from "./doorGeometryUtils.js";
import { isDoorEligibleRoomType } from "./roomTypeRules.js";

export type DoorPlacementValidityReason =
  | "owner_room_found"
  | "owner_room_missing"
  | "owner_room_door_ineligible"
  | "offset_within_wall_bounds"
  | "offset_outside_wall_bounds"
  | "width_fits_wall"
  | "width_exceeds_wall"
  | "candidate_connection_plausible"
  | "candidate_connection_missing";

export type DoorPlacementValidityResult = {
  status: "valid" | "invalid";
  doorId: string;
  reasonCodes: DoorPlacementValidityReason[];
  warnings: string[];
};

export function validateDoorPlacement(input: {
  layout: EditableLayoutGeometryContract;
  door: EditableDoorGeometry;
}): DoorPlacementValidityResult {
  const ownerRoom = input.layout.rooms.find((room) => room.id === input.door.ownerId) ?? null;
  const reasonCodes: DoorPlacementValidityReason[] = [];
  const warnings: string[] = [];

  if (ownerRoom == null || input.door.ownerKind !== "room") {
    reasonCodes.push("owner_room_missing");
    warnings.push("Door owner room is missing.");
    return { status: "invalid", doorId: input.door.id, reasonCodes, warnings };
  }
  reasonCodes.push("owner_room_found");
  if (!isDoorEligibleRoomType(ownerRoom.roomType)) {
    reasonCodes.push("owner_room_door_ineligible");
    warnings.push(`${ownerRoom.roomType} cannot accept doors.`);
    return { status: "invalid", doorId: input.door.id, reasonCodes, warnings };
  }

  const wallLength = wallLengthFeet(ownerRoom, input.door.wall);
  if (input.door.widthFeet <= wallLength) {
    reasonCodes.push("width_fits_wall");
  } else {
    reasonCodes.push("width_exceeds_wall");
    warnings.push("Door width exceeds the selected wall.");
  }

  if (input.door.offsetFeet >= 0 && input.door.offsetFeet + input.door.widthFeet <= wallLength) {
    reasonCodes.push("offset_within_wall_bounds");
  } else {
    reasonCodes.push("offset_outside_wall_bounds");
    warnings.push("Door offset must keep the full door on the owner wall.");
  }

  const adjacency = detectDoorAdjacency(input);
  if (adjacency.candidates.length > 0) {
    reasonCodes.push("candidate_connection_plausible");
  } else {
    reasonCodes.push("candidate_connection_missing");
    warnings.push("No geometry-valid adjacent room candidate is available.");
  }

  return {
    status: warnings.length === 0 ? "valid" : "invalid",
    doorId: input.door.id,
    reasonCodes,
    warnings
  };
}
