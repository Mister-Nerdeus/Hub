import type {
  EditableDoorGeometry,
  EditableLayoutGeometryContract,
  EditableRoomGeometry
} from "@nerdeus/shared";

import {
  buildLayoutValidationWarning,
  compareLayoutValidationWarnings,
  type LayoutEditorValidationWarning
} from "./layoutValidationWarningContract";

export const DOOR_VALIDITY_AFTER_ROOM_RESIZE_WARNING_CODES = [
  "door_exceeds_resized_room_wall",
  "door_owner_geometry_missing_after_resize"
] as const;

export type DoorValidityAfterRoomResizeWarningCode =
  (typeof DOOR_VALIDITY_AFTER_ROOM_RESIZE_WARNING_CODES)[number];

export type ValidateDoorValidityAfterRoomResizeInput = {
  layout: EditableLayoutGeometryContract;
  roomId: string;
};

export function validateDoorValidityAfterRoomResize({
  layout,
  roomId
}: ValidateDoorValidityAfterRoomResizeInput): LayoutEditorValidationWarning[] {
  const resizedRoom = layout.rooms.find((room) => room.id === roomId) ?? null;
  const attachedDoors = layout.doors.filter(
    (door) => door.ownerKind === "room" && door.ownerId === roomId
  );

  return attachedDoors
    .flatMap((door) => validateAttachedDoor({ door, room: resizedRoom, roomId }))
    .sort(compareLayoutValidationWarnings);
}

function validateAttachedDoor({
  door,
  room,
  roomId
}: {
  door: EditableDoorGeometry;
  room: EditableRoomGeometry | null;
  roomId: string;
}): LayoutEditorValidationWarning[] {
  if (room == null) {
    return [doorValidityWarning("door_owner_geometry_missing_after_resize", roomId, door.id)];
  }

  const wallLengthFeet = roomWallLengthFeet(room, door.wall);
  if (door.offsetFeet + door.widthFeet > wallLengthFeet) {
    return [doorValidityWarning("door_exceeds_resized_room_wall", roomId, door.id)];
  }

  return [];
}

function roomWallLengthFeet(room: EditableRoomGeometry, wall: EditableDoorGeometry["wall"]): number {
  switch (wall) {
    case "north":
    case "south":
      return room.widthFeet;
    case "east":
    case "west":
      return room.heightFeet;
  }
}

function doorValidityWarning(
  code: DoorValidityAfterRoomResizeWarningCode,
  roomId: string,
  doorId: string
): LayoutEditorValidationWarning {
  return buildLayoutValidationWarning({
    code,
    severity: "warning",
    source: "door_sync",
    message: messageForDoorValidityWarning(code),
    objectType: "room",
    objectId: roomId,
    relatedObjectType: "door",
    relatedObjectId: doorId,
    isGenerated: true
  });
}

function messageForDoorValidityWarning(code: DoorValidityAfterRoomResizeWarningCode): string {
  switch (code) {
    case "door_exceeds_resized_room_wall":
      return "Door span exceeds resized room wall length.";
    case "door_owner_geometry_missing_after_resize":
      return "Door owner geometry is missing after resize.";
  }
}
