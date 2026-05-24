import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import {
  DEFAULT_LAYOUT_BOUNDS_FEET,
  normalizeBoundsFeet,
  type LayoutBoundsFeet
} from "./layoutMoveValidation";
import {
  buildLayoutValidationWarning,
  type LayoutEditorValidationWarning
} from "./layoutValidationWarningContract";

export const ROOM_RESIZE_BOUNDS_WARNING_CODES = [
  "room_resize_out_of_bounds_left",
  "room_resize_out_of_bounds_top",
  "room_resize_out_of_bounds_right",
  "room_resize_out_of_bounds_bottom"
] as const;

export type RoomResizeBoundsWarningCode = (typeof ROOM_RESIZE_BOUNDS_WARNING_CODES)[number];

export type ValidateRoomResizeBoundsInput = {
  layout: EditableLayoutGeometryContract;
  roomId: string;
  boundsFeet?: LayoutBoundsFeet;
};

export function validateRoomResizeBounds({
  layout,
  roomId,
  boundsFeet = DEFAULT_LAYOUT_BOUNDS_FEET
}: ValidateRoomResizeBoundsInput): LayoutEditorValidationWarning[] {
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
    warnings.push(roomResizeBoundsWarning("room_resize_out_of_bounds_left", room.id));
  }
  if (room.yFeet < bounds.yFeet) {
    warnings.push(roomResizeBoundsWarning("room_resize_out_of_bounds_top", room.id));
  }
  if (roomRightFeet > boundsRightFeet) {
    warnings.push(roomResizeBoundsWarning("room_resize_out_of_bounds_right", room.id));
  }
  if (roomBottomFeet > boundsBottomFeet) {
    warnings.push(roomResizeBoundsWarning("room_resize_out_of_bounds_bottom", room.id));
  }

  return warnings;
}

function roomResizeBoundsWarning(
  code: RoomResizeBoundsWarningCode,
  roomId: string
): LayoutEditorValidationWarning {
  return buildLayoutValidationWarning({
    code,
    severity: "warning",
    source: "resize",
    message: messageForRoomResizeBoundsWarning(code),
    objectType: "room",
    objectId: roomId,
    isGenerated: true
  });
}

function messageForRoomResizeBoundsWarning(code: RoomResizeBoundsWarningCode): string {
  switch (code) {
    case "room_resize_out_of_bounds_left":
      return "Resized room extends beyond the layout left boundary.";
    case "room_resize_out_of_bounds_top":
      return "Resized room extends beyond the layout top boundary.";
    case "room_resize_out_of_bounds_right":
      return "Resized room extends beyond the layout right boundary.";
    case "room_resize_out_of_bounds_bottom":
      return "Resized room extends beyond the layout bottom boundary.";
  }
}
