import type {
  EditableDoorGeometry,
  EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import { clampNumber, wallLengthFeet } from "./doorGeometryUtils.js";

export type DoorWallSnapMarker = {
  offsetFeet: number;
  label: string;
};

export type DoorWallSnapGuide = {
  doorId: string;
  wallLengthFeet: number;
  centerOffsetFeet: number;
  currentOffsetFeet: number;
  snapIncrementFeet: number;
  markers: DoorWallSnapMarker[];
};

export function buildDoorWallSnapGuide(input: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry;
  snapIncrementFeet?: number;
}): DoorWallSnapGuide {
  const snapIncrementFeet = input.snapIncrementFeet ?? 2;
  const length = wallLengthFeet(input.room, input.door.wall);
  const maxOffset = Math.max(0, length - input.door.widthFeet);
  const markers: DoorWallSnapMarker[] = [];
  for (let offsetFeet = 0; offsetFeet <= maxOffset; offsetFeet += snapIncrementFeet) {
    markers.push({ offsetFeet, label: `${offsetFeet} ft` });
  }
  if (!markers.some((marker) => marker.offsetFeet === maxOffset)) {
    markers.push({ offsetFeet: maxOffset, label: `${maxOffset} ft` });
  }
  return {
    doorId: input.door.id,
    wallLengthFeet: length,
    centerOffsetFeet: maxOffset / 2,
    currentOffsetFeet: clampNumber(input.door.offsetFeet, 0, maxOffset),
    snapIncrementFeet,
    markers
  };
}

export function snapDoorOffsetToIncrement(input: {
  offsetFeet: number;
  incrementFeet: number;
  maxOffsetFeet: number;
}): number {
  const increment = input.incrementFeet <= 0 ? 1 : input.incrementFeet;
  return clampNumber(Math.round(input.offsetFeet / increment) * increment, 0, input.maxOffsetFeet);
}
