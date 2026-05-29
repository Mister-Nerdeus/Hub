import type { EditableRoomType } from "../layout-editor/editableLayoutGeometryContract.js";
import type { RoomType } from "../contracts.js";

export const AUTHORING_ROOM_TYPES = [
  "patient_room",
  "trauma_room",
  "nurse_station",
  "provider_pharmacy",
  "support",
  "ems_entry",
  "hallway",
  "public_space",
  "storage",
  "solid_wall",
  "unknown"
] as const;

export type AuthoringRoomType = (typeof AUTHORING_ROOM_TYPES)[number];

export function validateAuthoringRoomType(value: unknown): AuthoringRoomType {
  if (typeof value !== "string" || !AUTHORING_ROOM_TYPES.includes(value as AuthoringRoomType)) {
    throw new Error(`roomType must be one of ${AUTHORING_ROOM_TYPES.join(", ")}`);
  }
  return value as AuthoringRoomType;
}

export function authoringRoomTypeToEditableRoomType(value: AuthoringRoomType): EditableRoomType {
  switch (value) {
    case "trauma_room":
      return "trauma";
    case "hallway":
      return "hall_bed";
    case "storage":
      return "storage";
    case "provider_pharmacy":
      return "provider_pharmacy";
    case "solid_wall":
      return "solid_wall";
    case "unknown":
      return "overflow";
    default:
      return "standard";
  }
}

export function editableRoomTypeToAuthoringRoomType(value: EditableRoomType): AuthoringRoomType {
  switch (value) {
    case "trauma":
      return "trauma_room";
    case "hall_bed":
      return "hallway";
    case "storage":
      return "storage";
    case "provider_pharmacy":
      return "provider_pharmacy";
    case "solid_wall":
      return "solid_wall";
    default:
      return "patient_room";
  }
}

export function authoringRoomTypeToPlanRoomType(value: AuthoringRoomType): RoomType {
  switch (value) {
    case "trauma_room":
      return "trauma";
    case "hallway":
      return "hall_bed";
    case "storage":
      return "storage";
    case "provider_pharmacy":
      return "provider_pharmacy";
    case "solid_wall":
      return "solid_wall";
    case "unknown":
      return "overflow";
    default:
      return "standard";
  }
}
