import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import type { LayoutEditorSnapMode } from "./layoutEditorState";
import {
  DEFAULT_SNAP_SIZE_FEET,
  FINE_SNAP_SIZE_FEET,
  snapMoveDeltaFeet,
  type LayoutMoveDeltaFeet
} from "./layoutSnapEngine";
import {
  createRoomDragSnapAccumulator,
  type RoomDragSnapAccumulator
} from "./roomDragSnapAccumulator";

export type RoomMoveDeltaFeet = LayoutMoveDeltaFeet;

export type MoveRoomByDeltaFeetInput = {
  layout: EditableLayoutGeometryContract;
  roomId: string;
  delta: RoomMoveDeltaFeet;
  snapMode?: LayoutEditorSnapMode;
};

export function snapSizeForRoomMove(snapMode: LayoutEditorSnapMode = "default"): number {
  return snapMode === "fine" ? FINE_SNAP_SIZE_FEET : DEFAULT_SNAP_SIZE_FEET;
}

export function createRoomMoveSnapAccumulator(
  snapMode: LayoutEditorSnapMode = "default"
): RoomDragSnapAccumulator {
  return createRoomDragSnapAccumulator({ snapSizeFeet: snapSizeForRoomMove(snapMode) });
}

export function moveRoomByDeltaFeet({
  layout,
  roomId,
  delta,
  snapMode = "default"
}: MoveRoomByDeltaFeetInput): EditableLayoutGeometryContract {
  if (typeof roomId !== "string" || roomId.length === 0) {
    throw new Error("roomId must be a non-empty string");
  }

  const roomIndex = layout.rooms.findIndex((room) => room.id === roomId);
  if (roomIndex < 0) {
    throw new Error(`unknown room: ${roomId}`);
  }

  const snappedDelta = snapMoveDeltaFeet(delta, snapSizeForRoomMove(snapMode));
  return {
    ...layout,
    rooms: layout.rooms.map((room) =>
      room.id === roomId
        ? {
            ...room,
            xFeet: roundFeet(room.xFeet + snappedDelta.deltaXFeet),
            yFeet: roundFeet(room.yFeet + snappedDelta.deltaYFeet)
          }
        : room
    )
  };
}

function roundFeet(value: number): number {
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}
