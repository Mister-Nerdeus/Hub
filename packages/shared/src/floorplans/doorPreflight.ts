import {
  EDITABLE_DOOR_WALLS,
  type EditableDoorWall,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { wallLengthFeet } from "./doorGeometryUtils.js";
import { isPatientCareRoomType } from "./roomTypeRules.js";

export type AddDoorPreflightResult =
  | {
      status: "allowed";
      wall: EditableDoorWall;
      offsetFeet: number;
      widthFeet: number;
    }
  | {
      status: "blocked";
      reason: string;
    };

export type AddDoorPreflightInput = {
  layout: EditableLayoutGeometryContract | null;
  roomId: string | null;
  wall?: EditableDoorWall;
  offsetFeet?: number;
  widthFeet?: number;
  minimumWidthFeet?: number;
};

const DEFAULT_DOOR_WALL: EditableDoorWall = "south";
const DEFAULT_DOOR_OFFSET_FEET = 1;
const DEFAULT_DOOR_WIDTH_FEET = 4;
const MINIMUM_DOOR_WIDTH_FEET = 2;

export function preflightAddDoor(input: AddDoorPreflightInput): AddDoorPreflightResult {
  if (input.layout == null) {
    return blocked("Editable layout is not loaded.");
  }
  if (input.roomId == null || input.roomId.length === 0) {
    return blocked("Select a patient room before adding a door.");
  }
  const room = input.layout.rooms.find((candidate) => candidate.id === input.roomId) ?? null;
  if (room == null) {
    return blocked("Selected room is missing from the editable layout.");
  }
  if (room.roomType === "solid_wall") {
    return blocked("Solid wall / blocked areas cannot receive patient-room doors.");
  }
  if (room.roomType === "storage") {
    return blocked("Storage/support-only rooms do not receive patient-room doors.");
  }
  if (room.roomType === "provider_pharmacy") {
    return blocked("Provider/pharmacy areas use support access point tooling.");
  }
  if (!isPatientCareRoomType(room.roomType)) {
    return blocked("Selected room is not a patient-room door target.");
  }

  const wall = normalizeWall(input.wall);
  if (wall == null) {
    return blocked("Door wall is not a supported wall.");
  }
  const wallLength = wallLengthFeet(room, wall);
  const minimumWidth = normalizeMinimumWidth(input.minimumWidthFeet);
  if (wallLength < minimumWidth) {
    return blocked("Selected wall is too short for the minimum door width.");
  }

  const requestedWidth = input.widthFeet ?? DEFAULT_DOOR_WIDTH_FEET;
  const finiteWidth = finiteNumber(requestedWidth);
  if (finiteWidth == null || finiteWidth <= 0) {
    return blocked("Door width must be finite and greater than zero.");
  }
  const widthFeet = clamp(finiteWidth, minimumWidth, wallLength);

  const requestedOffset = input.offsetFeet ?? DEFAULT_DOOR_OFFSET_FEET;
  const finiteOffset = finiteNumber(requestedOffset);
  if (finiteOffset == null) {
    return blocked("Door offset must be finite.");
  }
  const offsetFeet = clamp(finiteOffset, 0, Math.max(0, wallLength - widthFeet));

  return {
    status: "allowed",
    wall,
    offsetFeet,
    widthFeet
  };
}

function normalizeWall(value: EditableDoorWall | undefined): EditableDoorWall | null {
  if (value == null) {
    return DEFAULT_DOOR_WALL;
  }
  return EDITABLE_DOOR_WALLS.includes(value) ? value : null;
}

function normalizeMinimumWidth(value: number | undefined): number {
  const finite = finiteNumber(value ?? MINIMUM_DOOR_WIDTH_FEET);
  if (finite == null || finite <= 0) {
    return MINIMUM_DOOR_WIDTH_FEET;
  }
  return finite;
}

function finiteNumber(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

function blocked(reason: string): AddDoorPreflightResult {
  return { status: "blocked", reason };
}
