import type {
  EditableDoorGeometry,
  EditableDoorWall,
  EditableLayoutGeometryContract,
  EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import { detectDoorAdjacency } from "./doorAdjacency.js";
import { oppositeWall, wallLengthFeet } from "./doorGeometryUtils.js";

export function clampDoorOffsetToWall(input: {
  room: EditableRoomGeometry;
  wall: EditableDoorWall;
  offsetFeet: number;
  widthFeet: number;
}): number {
  const maxOffset = Math.max(0, wallLengthFeet(input.room, input.wall) - input.widthFeet);
  return Math.min(Math.max(0, input.offsetFeet), maxOffset);
}

export function moveToWall(input: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry;
  wall: EditableDoorWall;
}): { wall: EditableDoorWall; offsetFeet: number } {
  return {
    wall: input.wall,
    offsetFeet: preserveOffsetWhenOwnerChanges({
      fromRoom: input.room,
      toRoom: input.room,
      wall: input.wall,
      offsetFeet: input.door.offsetFeet,
      widthFeet: input.door.widthFeet
    })
  };
}

export function moveToOppositeWall(input: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry;
}): { wall: EditableDoorWall; offsetFeet: number } {
  return moveToWall({
    door: input.door,
    room: input.room,
    wall: oppositeWall(input.door.wall)
  });
}

export function nudgeDoor(input: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry;
  deltaFeet: number;
}): { wall: EditableDoorWall; offsetFeet: number } {
  return {
    wall: input.door.wall,
    offsetFeet: clampDoorOffsetToWall({
      room: input.room,
      wall: input.door.wall,
      offsetFeet: input.door.offsetFeet + input.deltaFeet,
      widthFeet: input.door.widthFeet
    })
  };
}

export function centerDoorOnWall(input: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry;
}): { wall: EditableDoorWall; offsetFeet: number } {
  return {
    wall: input.door.wall,
    offsetFeet: clampDoorOffsetToWall({
      room: input.room,
      wall: input.door.wall,
      offsetFeet: (wallLengthFeet(input.room, input.door.wall) - input.door.widthFeet) / 2,
      widthFeet: input.door.widthFeet
    })
  };
}

export function assignDoorToAdjacentRoom(input: {
  layout: EditableLayoutGeometryContract;
  door: EditableDoorGeometry;
}): { roomId: string; wall: EditableDoorWall; offsetFeet: number } | null {
  const result = detectDoorAdjacency(input);
  const candidate = result.candidates[0] ?? null;
  if (candidate == null) {
    return null;
  }
  return {
    roomId: candidate.roomId,
    wall: candidate.wall,
    offsetFeet: candidate.previewOffsetFeet
  };
}

export function preserveOffsetWhenOwnerChanges(input: {
  fromRoom: EditableRoomGeometry;
  toRoom: EditableRoomGeometry;
  wall: EditableDoorWall;
  offsetFeet: number;
  widthFeet: number;
}): number {
  const fromLength = wallLengthFeet(input.fromRoom, input.wall);
  const toLength = wallLengthFeet(input.toRoom, input.wall);
  const ratio = fromLength <= 0 ? 0 : input.offsetFeet / fromLength;
  return clampDoorOffsetToWall({
    room: input.toRoom,
    wall: input.wall,
    offsetFeet: ratio * toLength,
    widthFeet: input.widthFeet
  });
}

export { oppositeWall };
