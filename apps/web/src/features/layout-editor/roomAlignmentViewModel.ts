import type { EditableRoomGeometry } from "@nerdeus/shared";

export type RoomAlignmentActionId =
  | "alignTop"
  | "alignBottom"
  | "alignLeft"
  | "alignRight"
  | "matchWidth"
  | "matchHeight"
  | "snapToGrid";

export type RoomAlignmentViewModel = {
  status: "missing" | "ready" | "no-reference";
  selectedRoomId: string | null;
  referenceRoomId: string | null;
  readOnly: boolean;
  actions: readonly { id: RoomAlignmentActionId; label: string; disabled: boolean }[];
};

export function buildRoomAlignmentViewModel(input: {
  selectedRoom: EditableRoomGeometry | null;
  rooms: readonly EditableRoomGeometry[];
  readOnly: boolean;
}): RoomAlignmentViewModel {
  const reference = input.rooms.find((room) => room.id !== input.selectedRoom?.id) ?? null;
  const status = input.selectedRoom == null ? "missing" : reference == null ? "no-reference" : "ready";
  const disabled = input.readOnly || status !== "ready";
  return {
    status,
    selectedRoomId: input.selectedRoom?.id ?? null,
    referenceRoomId: reference?.id ?? null,
    readOnly: input.readOnly,
    actions: [
      { id: "alignTop", label: "Top", disabled },
      { id: "alignBottom", label: "Bottom", disabled },
      { id: "alignLeft", label: "Left", disabled },
      { id: "alignRight", label: "Right", disabled },
      { id: "matchWidth", label: "Width", disabled },
      { id: "matchHeight", label: "Height", disabled },
      { id: "snapToGrid", label: "Grid", disabled: input.readOnly || input.selectedRoom == null }
    ]
  };
}
