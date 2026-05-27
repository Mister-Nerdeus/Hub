import type {
  EditableDoorGeometry,
  EditableDoorWall,
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
