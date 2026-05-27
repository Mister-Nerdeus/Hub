import type { EditableRoomGeometry, EditableRoomType } from "@nerdeus/shared";

export type RoomQuickEditViewModel = {
  status: "missing" | "ready";
  roomId: string | null;
  label: string;
  roomNumber: string;
  roomType: EditableRoomType | null;
  widthFeet: number | null;
  heightFeet: number | null;
  readOnly: boolean;
  deleteDisabled: boolean;
  duplicateDisabled: boolean;
};

export function buildRoomQuickEdit({
  room,
  readOnly
}: {
  room: EditableRoomGeometry | null;
  readOnly: boolean;
}): RoomQuickEditViewModel {
  if (room == null) {
    return {
      status: "missing",
      roomId: null,
      label: "No room selected",
      roomNumber: "",
      roomType: null,
      widthFeet: null,
      heightFeet: null,
      readOnly: true,
      deleteDisabled: true,
      duplicateDisabled: true
    };
  }
  return {
    status: "ready",
    roomId: room.id,
    label: room.label,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    widthFeet: room.widthFeet,
    heightFeet: room.heightFeet,
    readOnly,
    deleteDisabled: readOnly,
    duplicateDisabled: readOnly
  };
}
