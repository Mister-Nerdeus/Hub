import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import {
  collisionTargetObjectType,
  rectsOverlapFeet,
  type LayoutCollisionTarget
} from "./layoutCollisionValidation";
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

export const ROOM_RESIZE_COLLISION_WARNING_CODES = [
  "room_resize_overlap_room",
  "room_resize_overlap_station",
  "room_resize_overlap_zone",
  "room_resize_overlap_hallway"
] as const;

export type RoomResizeCollisionWarningCode =
  (typeof ROOM_RESIZE_COLLISION_WARNING_CODES)[number];

export type ValidateRoomResizeBoundsInput = {
  layout: EditableLayoutGeometryContract;
  roomId: string;
  boundsFeet?: LayoutBoundsFeet;
};

export type ValidateRoomResizeWarningsInput = ValidateRoomResizeBoundsInput & {
  includeHallways?: boolean;
};

export function validateRoomResizeWarnings({
  layout,
  roomId,
  boundsFeet = DEFAULT_LAYOUT_BOUNDS_FEET,
  includeHallways = true
}: ValidateRoomResizeWarningsInput): LayoutEditorValidationWarning[] {
  return [
    ...validateRoomResizeBounds({ layout, roomId, boundsFeet }),
    ...validateRoomResizeCollisions({ layout, roomId, includeHallways })
  ].sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.relatedObjectId ?? "").localeCompare(right.relatedObjectId ?? "")
  );
}

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

export function validateRoomResizeCollisions({
  layout,
  roomId,
  includeHallways = true
}: {
  layout: EditableLayoutGeometryContract;
  roomId: string;
  includeHallways?: boolean;
}): LayoutEditorValidationWarning[] {
  const resizedRoom = layout.rooms.find((room) => room.id === roomId);
  if (resizedRoom == null) {
    throw new Error(`unknown room: ${roomId}`);
  }

  const targets: LayoutCollisionTarget[] = [
    ...layout.rooms.filter((room) => room.id !== roomId),
    ...layout.stations,
    ...layout.zones,
    ...(includeHallways ? layout.hallways : [])
  ];
  return targets
    .filter((target) => rectsOverlapFeet(resizedRoom, target))
    .map((target) => roomResizeCollisionWarning(roomId, target))
    .sort((left, right) =>
      left.code.localeCompare(right.code) ||
      (left.relatedObjectId ?? "").localeCompare(right.relatedObjectId ?? "")
    );
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

function roomResizeCollisionWarning(
  roomId: string,
  target: LayoutCollisionTarget
): LayoutEditorValidationWarning {
  const relatedObjectType = collisionTargetObjectType(target);
  return buildLayoutValidationWarning({
    code: codeForResizeCollisionTarget(relatedObjectType),
    severity: "warning",
    source: "resize",
    message: `Resized room overlaps ${relatedObjectType} ${target.id}.`,
    objectType: "room",
    objectId: roomId,
    relatedObjectType,
    relatedObjectId: target.id,
    isGenerated: true
  });
}

function codeForResizeCollisionTarget(
  objectType: NonNullable<LayoutEditorValidationWarning["relatedObjectType"]>
): RoomResizeCollisionWarningCode {
  switch (objectType) {
    case "room":
      return "room_resize_overlap_room";
    case "station":
      return "room_resize_overlap_station";
    case "zone":
      return "room_resize_overlap_zone";
    case "hallway":
      return "room_resize_overlap_hallway";
    case "door":
      throw new Error("doors are wall-relative and are not room resize collision targets");
  }
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
