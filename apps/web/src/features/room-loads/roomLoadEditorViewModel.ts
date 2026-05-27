import {
  getRoomTypeRule,
  validateManualAssignmentRoomLoad,
  type ManualAssignmentRoomLoad,
  type SemanticRoomType
} from "@nerdeus/shared";

export type RoomLoadEditorRoom = {
  roomId: string;
  label: string;
  roomType: SemanticRoomType;
};

export type RoomLoadEditorCard = {
  roomId: string;
  label: string;
  roomType: SemanticRoomType;
  controlsDisabled: boolean;
  disabledReason: string | null;
  roomLoad: ManualAssignmentRoomLoad | null;
};

export function getRoomLoadDisabledReason(roomType: SemanticRoomType): string | null {
  if (roomType === "storage") return "Storage is excluded from room-load inputs.";
  if (roomType === "solid_wall") return "Solid wall / blocked area is excluded from room-load inputs.";
  return getRoomTypeRule(roomType).roomLoadEligible ? null : "Room type is excluded from room-load inputs.";
}

export function createRoomLoadEditorViewModel(
  rooms: RoomLoadEditorRoom[],
  roomLoads: ManualAssignmentRoomLoad[]
): RoomLoadEditorCard[] {
  const loadByRoomId = new Map(
    roomLoads
      .map((roomLoad, index) => validateManualAssignmentRoomLoad(roomLoad, index))
      .map((roomLoad) => [roomLoad.roomId, roomLoad])
  );
  return rooms.map((room) => {
    const disabledReason = getRoomLoadDisabledReason(room.roomType);
    return {
      roomId: room.roomId,
      label: room.label,
      roomType: room.roomType,
      controlsDisabled: disabledReason != null,
      disabledReason,
      roomLoad: disabledReason == null ? loadByRoomId.get(room.roomId) ?? null : null
    };
  });
}
