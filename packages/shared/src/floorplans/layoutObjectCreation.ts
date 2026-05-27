import type { EditableRoomGeometry } from "../layout-editor/editableLayoutGeometryContract.js";
import {
  authoringRoomTypeToEditableRoomType,
  validateAuthoringRoomType,
  type AuthoringRoomType
} from "./roomTypeContract.js";

export type LayoutRoomObjectCreationInput = {
  roomId: string;
  label: string;
  roomType: AuthoringRoomType;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
};

export function createEditableLayoutRoomObject(
  input: LayoutRoomObjectCreationInput
): EditableRoomGeometry {
  const roomType = validateAuthoringRoomType(input.roomType);
  return {
    objectType: "room",
    id: requireString(input.roomId, "roomId"),
    label: requireString(input.label, "label"),
    roomNumber: input.label,
    roomType: authoringRoomTypeToEditableRoomType(roomType),
    capacityType: roomType === "hallway" ? "hall" : "single",
    isHallBed: roomType === "hallway",
    isTraumaAdjacent: roomType === "trauma_room",
    xFeet: requireFinite(input.xFeet, "xFeet"),
    yFeet: requireFinite(input.yFeet, "yFeet"),
    widthFeet: requirePositive(input.widthFeet, "widthFeet"),
    heightFeet: requirePositive(input.heightFeet, "heightFeet")
  };
}

function requireString(value: string, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireFinite(value: number, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}
