import type { EditableRoomGeometry } from "@nerdeus/shared";

import {
  snapMoveDeltaFeet,
  snapSizeFeetForMode,
  type LayoutMoveDeltaFeet,
  type LayoutSnapEngineMode
} from "./layoutSnapEngine";
import { isRoomResizeHandle, type RoomResizeHandle } from "./roomResizeHandlesViewModel";

export const DEFAULT_MINIMUM_ROOM_RESIZE_SIZE_FEET = 4;
export const MINIMUM_EDITABLE_ROOM_SIZE_FEET = DEFAULT_MINIMUM_ROOM_RESIZE_SIZE_FEET;

export type ResizeRoomByHandleDeltaFeetInput = {
  room: EditableRoomGeometry;
  handle: RoomResizeHandle;
  deltaFeet: LayoutMoveDeltaFeet;
  snapMode: LayoutSnapEngineMode;
  minimumSizeFeet?: number;
};

export function resizeRoomByHandleDeltaFeet({
  room,
  handle,
  deltaFeet,
  snapMode,
  minimumSizeFeet = DEFAULT_MINIMUM_ROOM_RESIZE_SIZE_FEET
}: ResizeRoomByHandleDeltaFeetInput): EditableRoomGeometry {
  if (!isRoomResizeHandle(handle)) {
    throw new Error("handle must be a supported room resize handle");
  }
  const minimumSize = requirePositive(minimumSizeFeet, "minimumSizeFeet");
  const snappedDelta = snapMoveDeltaFeet(deltaFeet, snapSizeFeetForMode(snapMode));
  const resized = applyHandleDelta(room, handle, snappedDelta);

  return {
    ...room,
    ...clampRoomResizeGeometry(room, resized, handle, minimumSize)
  };
}

type RoomResizeGeometry = Pick<EditableRoomGeometry, "xFeet" | "yFeet" | "widthFeet" | "heightFeet">;

function applyHandleDelta(
  room: EditableRoomGeometry,
  handle: RoomResizeHandle,
  delta: LayoutMoveDeltaFeet
): RoomResizeGeometry {
  let xFeet = requireFinite(room.xFeet, "room.xFeet");
  let yFeet = requireFinite(room.yFeet, "room.yFeet");
  let widthFeet = requireFinite(room.widthFeet, "room.widthFeet");
  let heightFeet = requireFinite(room.heightFeet, "room.heightFeet");

  if (handle.includes("east")) {
    widthFeet += delta.deltaXFeet;
  }
  if (handle.includes("west")) {
    xFeet += delta.deltaXFeet;
    widthFeet -= delta.deltaXFeet;
  }
  if (handle.includes("south")) {
    heightFeet += delta.deltaYFeet;
  }
  if (handle.includes("north")) {
    yFeet += delta.deltaYFeet;
    heightFeet -= delta.deltaYFeet;
  }

  return normalizeGeometry({ xFeet, yFeet, widthFeet, heightFeet });
}

function clampRoomResizeGeometry(
  originalRoom: EditableRoomGeometry,
  resized: RoomResizeGeometry,
  handle: RoomResizeHandle,
  minimumSizeFeet: number
): RoomResizeGeometry {
  const originalRightFeet = originalRoom.xFeet + originalRoom.widthFeet;
  const originalBottomFeet = originalRoom.yFeet + originalRoom.heightFeet;
  let { xFeet, yFeet, widthFeet, heightFeet } = resized;

  if (widthFeet < minimumSizeFeet) {
    widthFeet = minimumSizeFeet;
    if (handle.includes("west")) {
      xFeet = originalRightFeet - minimumSizeFeet;
    }
  }

  if (heightFeet < minimumSizeFeet) {
    heightFeet = minimumSizeFeet;
    if (handle.includes("north")) {
      yFeet = originalBottomFeet - minimumSizeFeet;
    }
  }

  return normalizeGeometry({ xFeet, yFeet, widthFeet, heightFeet });
}

function normalizeGeometry(geometry: RoomResizeGeometry): RoomResizeGeometry {
  return {
    xFeet: normalizeSignedZero(roundFeet(requireFinite(geometry.xFeet, "xFeet"))),
    yFeet: normalizeSignedZero(roundFeet(requireFinite(geometry.yFeet, "yFeet"))),
    widthFeet: normalizeSignedZero(roundFeet(requireFinite(geometry.widthFeet, "widthFeet"))),
    heightFeet: normalizeSignedZero(roundFeet(requireFinite(geometry.heightFeet, "heightFeet")))
  };
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}
