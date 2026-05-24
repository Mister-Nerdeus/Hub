import type {
  EditableHallwayGeometry,
  EditableLayoutGeometryContract,
  EditableRoomGeometry,
  EditableStationGeometry,
  EditableZoneGeometry
} from "@nerdeus/shared";

import type { LayoutRectFeet } from "./layoutCoordinateSystem";
import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";
import {
  buildLayoutValidationWarning,
  compareLayoutValidationWarnings,
  type LayoutEditorValidationWarning
} from "./layoutValidationWarningContract";

export const ROOM_MOVE_COLLISION_WARNING_CODES = [
  "room_overlap_room",
  "room_overlap_station",
  "room_overlap_zone",
  "room_overlap_hallway"
] as const;

export type RoomMoveCollisionWarningCode = (typeof ROOM_MOVE_COLLISION_WARNING_CODES)[number];

export type ValidateMovedRoomCollisionsInput = {
  layout: EditableLayoutGeometryContract;
  roomId: string;
  includeHallways?: boolean;
};

type CollisionTarget =
  | EditableRoomGeometry
  | EditableStationGeometry
  | EditableZoneGeometry
  | EditableHallwayGeometry;

export function validateMovedRoomCollisions({
  layout,
  roomId,
  includeHallways = true
}: ValidateMovedRoomCollisionsInput): LayoutEditorValidationWarning[] {
  const movedRoom = layout.rooms.find((room) => room.id === roomId);
  if (movedRoom == null) {
    throw new Error(`unknown room: ${roomId}`);
  }

  const warnings: LayoutEditorValidationWarning[] = [];
  for (const target of collectCollisionTargets(layout, roomId, includeHallways)) {
    if (!rectsOverlapFeet(movedRoom, target)) {
      continue;
    }
    warnings.push(roomCollisionWarning(movedRoom.id, target));
  }

  return warnings.sort(compareLayoutValidationWarnings);
}

export function rectsOverlapFeet(left: LayoutRectFeet, right: LayoutRectFeet): boolean {
  return (
    left.xFeet < right.xFeet + right.widthFeet &&
    left.xFeet + left.widthFeet > right.xFeet &&
    left.yFeet < right.yFeet + right.heightFeet &&
    left.yFeet + left.heightFeet > right.yFeet
  );
}

function collectCollisionTargets(
  layout: EditableLayoutGeometryContract,
  movedRoomId: string,
  includeHallways: boolean
): CollisionTarget[] {
  return [
    ...layout.rooms.filter((room) => room.id !== movedRoomId),
    ...layout.stations,
    ...layout.zones,
    ...(includeHallways ? layout.hallways : [])
  ];
}

function roomCollisionWarning(
  movedRoomId: string,
  target: CollisionTarget
): LayoutEditorValidationWarning {
  const relatedObjectType = target.objectType === "station" ? "station" : target.objectType;
  return buildLayoutValidationWarning({
    code: codeForCollisionTarget(relatedObjectType),
    severity: "warning",
    source: "collision",
    message: `Room overlaps ${relatedObjectType} ${target.id}.`,
    objectType: "room",
    objectId: movedRoomId,
    relatedObjectType,
    relatedObjectId: target.id,
    isGenerated: true
  });
}

function codeForCollisionTarget(
  objectType: LayoutEditorSelectableObjectType
): RoomMoveCollisionWarningCode {
  switch (objectType) {
    case "room":
      return "room_overlap_room";
    case "station":
      return "room_overlap_station";
    case "zone":
      return "room_overlap_zone";
    case "hallway":
      return "room_overlap_hallway";
    case "door":
      throw new Error("doors are wall-relative and are not room collision targets");
  }
}
