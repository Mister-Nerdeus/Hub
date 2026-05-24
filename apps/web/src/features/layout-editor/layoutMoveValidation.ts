import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import { validateMovedRoomCollisions } from "./layoutCollisionValidation";
import {
  buildLayoutValidationWarning,
  type LayoutEditorValidationWarning
} from "./layoutValidationWarningContract";

export const ROOM_MOVE_BOUNDS_WARNING_CODES = [
  "room_out_of_bounds_left",
  "room_out_of_bounds_top",
  "room_out_of_bounds_right",
  "room_out_of_bounds_bottom"
] as const;

export type RoomMoveBoundsWarningCode = (typeof ROOM_MOVE_BOUNDS_WARNING_CODES)[number];

export type LayoutBoundsFeet = {
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
};

export const DEFAULT_LAYOUT_BOUNDS_FEET: LayoutBoundsFeet = {
  xFeet: 0,
  yFeet: 0,
  widthFeet: 64,
  heightFeet: 40
};

export type ValidateRoomMoveBoundsInput = {
  layout: EditableLayoutGeometryContract;
  roomId: string;
  boundsFeet?: LayoutBoundsFeet;
};

export type ValidateRoomMoveWarningsInput = ValidateRoomMoveBoundsInput & {
  includeHallways?: boolean;
};

export function validateRoomMoveWarnings({
  layout,
  roomId,
  boundsFeet = DEFAULT_LAYOUT_BOUNDS_FEET,
  includeHallways = true
}: ValidateRoomMoveWarningsInput): LayoutEditorValidationWarning[] {
  return [
    ...validateRoomMoveBounds({ layout, roomId, boundsFeet }),
    ...validateMovedRoomCollisions({ layout, roomId, includeHallways })
  ];
}

export function validateRoomMoveBounds({
  layout,
  roomId,
  boundsFeet = DEFAULT_LAYOUT_BOUNDS_FEET
}: ValidateRoomMoveBoundsInput): LayoutEditorValidationWarning[] {
  const room = layout.rooms.find((candidate) => candidate.id === roomId);
  if (room == null) {
    throw new Error(`unknown room: ${roomId}`);
  }

  const bounds = normalizeBoundsFeet(boundsFeet);
  const warnings: LayoutEditorValidationWarning[] = [];
  const roomRightFeet = room.xFeet + room.widthFeet;
  const roomBottomFeet = room.yFeet + room.heightFeet;
  const boundsRightFeet = bounds.xFeet + bounds.widthFeet;
  const boundsBottomFeet = bounds.yFeet + bounds.heightFeet;

  if (room.xFeet < bounds.xFeet) {
    warnings.push(roomBoundsWarning("room_out_of_bounds_left", room.id));
  }
  if (room.yFeet < bounds.yFeet) {
    warnings.push(roomBoundsWarning("room_out_of_bounds_top", room.id));
  }
  if (roomRightFeet > boundsRightFeet) {
    warnings.push(roomBoundsWarning("room_out_of_bounds_right", room.id));
  }
  if (roomBottomFeet > boundsBottomFeet) {
    warnings.push(roomBoundsWarning("room_out_of_bounds_bottom", room.id));
  }

  return warnings;
}

export function normalizeBoundsFeet(boundsFeet: LayoutBoundsFeet): LayoutBoundsFeet {
  return {
    xFeet: requireFinite(boundsFeet.xFeet, "boundsFeet.xFeet"),
    yFeet: requireFinite(boundsFeet.yFeet, "boundsFeet.yFeet"),
    widthFeet: requirePositive(boundsFeet.widthFeet, "boundsFeet.widthFeet"),
    heightFeet: requirePositive(boundsFeet.heightFeet, "boundsFeet.heightFeet")
  };
}

function roomBoundsWarning(
  code: RoomMoveBoundsWarningCode,
  roomId: string
): LayoutEditorValidationWarning {
  return buildLayoutValidationWarning({
    code,
    severity: "warning",
    source: "bounds",
    message: messageForRoomBoundsWarning(code),
    objectType: "room",
    objectId: roomId,
    isGenerated: true
  });
}

function messageForRoomBoundsWarning(code: RoomMoveBoundsWarningCode): string {
  switch (code) {
    case "room_out_of_bounds_left":
      return "Room extends beyond the layout left boundary.";
    case "room_out_of_bounds_top":
      return "Room extends beyond the layout top boundary.";
    case "room_out_of_bounds_right":
      return "Room extends beyond the layout right boundary.";
    case "room_out_of_bounds_bottom":
      return "Room extends beyond the layout bottom boundary.";
  }
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
