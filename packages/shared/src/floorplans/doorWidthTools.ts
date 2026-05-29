import type {
  EditableDoorGeometry,
  EditableDoorWall,
  EditableRectFeet,
  EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import {
  clampNumber,
  deriveDoorOrientationFromWall,
  type DoorWallOrientation,
  wallLengthFeet
} from "./doorGeometryUtils.js";

export const STANDARD_DOOR_WIDTH_PRESETS_FEET = [3, 4, 6] as const;

export type DoorWidthChangeResult = {
  widthFeet: number;
  offsetFeet: number;
  orientation: DoorWallOrientation;
  clamped: boolean;
};

export type NormalizeDoorForOwnerWallResult = {
  door: EditableDoorGeometry;
  wallLengthFeet: number;
  status: "valid" | "clamped" | "invalid";
  warnings: string[];
};

export function normalizeDoorForOwnerWall(input: {
  door: EditableDoorGeometry;
  ownerRect: Pick<EditableRectFeet, "widthFeet" | "heightFeet">;
  minimumDoorWidthFeet: number;
}): NormalizeDoorForOwnerWallResult {
  const wallLength = wallLengthFeet(input.ownerRect, input.door.wall);
  const minimumDoorWidthFeet = requirePositive(input.minimumDoorWidthFeet, "minimumDoorWidthFeet");
  const warnings: string[] = [];

  if (!Number.isFinite(wallLength) || wallLength < minimumDoorWidthFeet) {
    return {
      door: {
        ...input.door,
        offsetFeet: Number.isFinite(input.door.offsetFeet) ? Math.max(0, input.door.offsetFeet) : 0,
        widthFeet: Number.isFinite(wallLength) ? Math.max(0.25, wallLength) : minimumDoorWidthFeet
      },
      wallLengthFeet: wallLength,
      status: "invalid",
      warnings: ["Owner wall is too short for the minimum door width."]
    };
  }

  let widthFeet = input.door.widthFeet;
  if (!Number.isFinite(widthFeet) || widthFeet <= 0) {
    widthFeet = minimumDoorWidthFeet;
    warnings.push("Door width is invalid and was displayed at the minimum width.");
  }
  if (widthFeet > wallLength) {
    widthFeet = wallLength;
    warnings.push("Door width exceeds the owner wall and was clamped for display.");
  }

  let offsetFeet = input.door.offsetFeet;
  if (!Number.isFinite(offsetFeet) || offsetFeet < 0) {
    offsetFeet = 0;
    warnings.push("Door offset is outside the owner wall and was clamped for display.");
  }
  const maxOffset = Math.max(0, wallLength - widthFeet);
  if (offsetFeet > maxOffset) {
    offsetFeet = maxOffset;
    warnings.push("Door offset and width exceed the owner wall and were clamped for display.");
  }

  return {
    door: {
      ...input.door,
      offsetFeet,
      widthFeet
    },
    wallLengthFeet: wallLength,
    status: warnings.length === 0 ? "valid" : "clamped",
    warnings
  };
}

export function clampDoorWidthToWall(input: {
  room: EditableRoomGeometry;
  wall: EditableDoorWall;
  widthFeet: number;
  offsetFeet: number;
}): DoorWidthChangeResult {
  const wallLength = wallLengthFeet(input.room, input.wall);
  const widthFeet = clampNumber(input.widthFeet, 2, wallLength);
  return {
    widthFeet,
    offsetFeet: clampNumber(input.offsetFeet, 0, Math.max(0, wallLength - widthFeet)),
    orientation: deriveDoorOrientationFromWall(input.wall),
    clamped: widthFeet !== input.widthFeet
  };
}

export function increaseDoorWidth(input: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry;
  stepFeet?: number;
}): DoorWidthChangeResult {
  return clampDoorWidthToWall({
    room: input.room,
    wall: input.door.wall,
    widthFeet: input.door.widthFeet + (input.stepFeet ?? 1),
    offsetFeet: input.door.offsetFeet
  });
}

export function decreaseDoorWidth(input: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry;
  stepFeet?: number;
}): DoorWidthChangeResult {
  return clampDoorWidthToWall({
    room: input.room,
    wall: input.door.wall,
    widthFeet: input.door.widthFeet - (input.stepFeet ?? 1),
    offsetFeet: input.door.offsetFeet
  });
}

export function applyDoorWidthPreset(input: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry;
  widthFeet: number;
}): DoorWidthChangeResult {
  return clampDoorWidthToWall({
    room: input.room,
    wall: input.door.wall,
    widthFeet: input.widthFeet,
    offsetFeet: input.door.offsetFeet
  });
}

export { deriveDoorOrientationFromWall };

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return value;
}
