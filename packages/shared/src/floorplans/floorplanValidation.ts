import type { EditableLayoutGeometryContract } from "../layout-editor/editableLayoutGeometryContract.js";
import { isDoorEligibleRoomType } from "./roomTypeRules.js";

export type FloorplanValidationIssue = {
  code: "SOLID_WALL_DOOR_REFERENCE";
  severity: "blocking";
  message: string;
  objectId: string;
  roomId: string;
};

export function validateNoSolidWallDoorReferences(
  layout: EditableLayoutGeometryContract
): FloorplanValidationIssue[] {
  const roomsById = new Map(layout.rooms.map((room) => [room.id, room]));
  return layout.doors.flatMap((door) => {
    if (door.ownerKind !== "room") return [];
    const room = roomsById.get(door.ownerId);
    if (room == null || isDoorEligibleRoomType(room.roomType)) return [];
    return [{
      code: "SOLID_WALL_DOOR_REFERENCE",
      severity: "blocking",
      message: `Door ${door.id} references a room type that cannot accept doors.`,
      objectId: door.id,
      roomId: door.ownerId
    }];
  });
}

