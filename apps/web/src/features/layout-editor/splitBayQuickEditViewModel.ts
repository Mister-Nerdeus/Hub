import type {
  EditableRoomGeometry,
  EditableSplitBayDividerStyle,
  EditableSplitBayGeometry
} from "@nerdeus/shared";

export type SplitBayQuickEditViewModel = {
  status: "missing" | "ready";
  splitBayId: string | null;
  label: string;
  pairLabel: string | null;
  bedPositionRoomIds: readonly [string, string] | null;
  childRooms: readonly [
    { roomId: string; roomNumber: string; label: string },
    { roomId: string; roomNumber: string; label: string }
  ] | null;
  dividerStyle: EditableSplitBayDividerStyle | null;
  readOnly: boolean;
};

export function buildSplitBayQuickEdit(input: {
  splitBay: EditableSplitBayGeometry | null;
  rooms?: readonly EditableRoomGeometry[];
  readOnly: boolean;
}): SplitBayQuickEditViewModel {
  if (input.splitBay == null) {
    return {
      status: "missing",
      splitBayId: null,
      label: "No split room selected",
      pairLabel: null,
      bedPositionRoomIds: null,
      childRooms: null,
      dividerStyle: null,
      readOnly: true
    };
  }
  const roomById = new Map((input.rooms ?? []).map((room) => [room.id, room]));
  const childRooms = input.splitBay.bedPositionRoomIds.map((roomId) => {
    const room = roomById.get(roomId);
    return {
      roomId,
      roomNumber: room?.roomNumber ?? roomId.replace("room-", ""),
      label: room == null ? roomId : `Room ${room.roomNumber}`
    };
  }) as [
    { roomId: string; roomNumber: string; label: string },
    { roomId: string; roomNumber: string; label: string }
  ];
  return {
    status: "ready",
    splitBayId: input.splitBay.splitBayId,
    label: input.splitBay.label,
    pairLabel: input.splitBay.label,
    bedPositionRoomIds: input.splitBay.bedPositionRoomIds,
    childRooms,
    dividerStyle: input.splitBay.dividerStyle,
    readOnly: input.readOnly
  };
}
