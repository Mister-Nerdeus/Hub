import type {
  EditableDoorGeometry,
  EditableDoorWall,
  EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { isPatientCareRoomType } from "./roomTypeRules.js";
import { wallLengthFeet } from "./doorGeometryUtils.js";

export type DoorCandidateEligibility =
  | { status: "eligible" }
  | { status: "blocked"; reason: string };

export type DoorCandidateEligibilityInput = {
  layout: EditableLayoutGeometryContract;
  door: EditableDoorGeometry;
  candidate: {
    roomId: string;
    wall: EditableDoorWall;
    previewOffsetFeet: number;
  };
};

export function evaluateDoorCandidateEligibility(
  input: DoorCandidateEligibilityInput
): DoorCandidateEligibility {
  if (input.door.ownerKind !== "room") {
    return blocked("Only room-owned doors can be assigned to adjacent patient-room targets.");
  }
  const ownerRoom = input.layout.rooms.find((room) => room.id === input.door.ownerId) ?? null;
  if (ownerRoom == null) {
    return blocked("Door owner is missing; assign a valid owner before adjacent candidate selection.");
  }
  if (!isPatientCareRoomType(ownerRoom.roomType)) {
    return blocked("Door owner is not a patient-room target for adjacent assignment.");
  }
  if (input.candidate.roomId === input.door.ownerId) {
    return blocked("Adjacent candidate must be different from the current owner.");
  }

  const target = input.layout.rooms.find((room) => room.id === input.candidate.roomId) ?? null;
  if (target == null) {
    return blocked("Adjacent target is missing from the editable layout.");
  }
  if (target.roomType === "solid_wall") {
    return blocked("Solid wall targets cannot receive patient-room door assignments.");
  }
  if (target.roomType === "storage") {
    return blocked("Storage/support-only targets do not receive patient-room door assignments.");
  }
  if (target.roomType === "provider_pharmacy") {
    return blocked("Provider/pharmacy targets use support access points, not patient-room doors.");
  }
  if (!isPatientCareRoomType(target.roomType)) {
    return blocked("Adjacent target is not a patient-room door target.");
  }

  if (!Number.isFinite(input.candidate.previewOffsetFeet)) {
    return blocked("Adjacent candidate offset must be finite.");
  }
  if (!Number.isFinite(input.door.widthFeet) || input.door.widthFeet <= 0) {
    return blocked("Door width must be finite and greater than zero.");
  }
  const targetWallLength = wallLengthFeet(target, input.candidate.wall);
  if (targetWallLength <= 0) {
    return blocked("Adjacent target wall has no usable span.");
  }
  if (
    input.candidate.previewOffsetFeet < 0 ||
    input.candidate.previewOffsetFeet + input.door.widthFeet > targetWallLength
  ) {
    return blocked("Door span does not fit on the adjacent target wall.");
  }

  return { status: "eligible" };
}

function blocked(reason: string): DoorCandidateEligibility {
  return { status: "blocked", reason };
}
