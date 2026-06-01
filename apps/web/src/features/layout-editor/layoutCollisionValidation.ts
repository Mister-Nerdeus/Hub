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

export type LayoutCollisionTarget = CollisionTarget;

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
  const relatedObjectType = collisionTargetObjectType(target);
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

export function collisionTargetObjectType(
  target: LayoutCollisionTarget
): LayoutEditorSelectableObjectType {
  return target.objectType === "station" ? "station" : target.objectType;
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
    case "perimeter_wall":
      throw new Error("perimeter walls are boundary geometry and are not room collision targets");
    case "entry_exit":
      throw new Error("entry and exit geometry is not a room collision target");
    case "door":
      throw new Error("doors are wall-relative and are not room collision targets");
    case "support_access":
      throw new Error("support access points are wall-relative and are not room collision targets");
    case "split_room_parent":
      throw new Error("split room parent overlays use parent room collision targets");
    case "bed_position":
      throw new Error("bed positions are relative overlays and are not room collision targets");
    case "outer_wall":
      throw new Error("outer walls are boundary geometry and are not room collision targets");
    case "split_bay":
      throw new Error("split bay overlays are not room collision targets");
  }
}
