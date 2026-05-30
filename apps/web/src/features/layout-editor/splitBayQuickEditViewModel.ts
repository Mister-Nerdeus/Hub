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
  unsplitButtonLabel: string | null;
  unsplitConfirmationTitle: string | null;
  unsplitPreservationCopy: string | null;
  unsplitAssignmentCopy: string | null;
  unsplitStatusMessage: string | null;
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
      readOnly: true,
      unsplitButtonLabel: null,
      unsplitConfirmationTitle: null,
      unsplitPreservationCopy: null,
      unsplitAssignmentCopy: null,
      unsplitStatusMessage: null
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
  const [childA, childB] = childRooms;
  return {
    status: "ready",
    splitBayId: input.splitBay.splitBayId,
    label: input.splitBay.label,
    pairLabel: input.splitBay.label,
    bedPositionRoomIds: input.splitBay.bedPositionRoomIds,
    childRooms,
    dividerStyle: input.splitBay.dividerStyle,
    readOnly: input.readOnly,
    unsplitButtonLabel: `Unsplit ${input.splitBay.label}`,
    unsplitConfirmationTitle: `Unsplit Split Room ${input.splitBay.label}?`,
    unsplitPreservationCopy: `This removes the split-room grouping but preserves ${childA.label} and ${childB.label}.`,
    unsplitAssignmentCopy: "Child assignments may remain if assignment state exists.",
    unsplitStatusMessage: `Split Room ${input.splitBay.label} removed. Rooms ${childA.roomNumber} and ${childB.roomNumber} remain available.`
  };
}
