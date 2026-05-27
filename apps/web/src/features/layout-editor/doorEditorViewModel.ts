import type { EditableDoorGeometry, EditableRoomGeometry } from "@nerdeus/shared";

export type DoorEditorViewModel = {
  selectedDoorLabel: string;
  ownerRoomLabel: string;
  invalidPlacementWarning: string | null;
};

export function buildDoorEditorViewModel(input: {
  door: EditableDoorGeometry | null;
  rooms: EditableRoomGeometry[];
}): DoorEditorViewModel | null {
  if (input.door == null) return null;
  const ownerRoom = input.rooms.find((room) => room.id === input.door?.ownerId) ?? null;
  const maxOffset = ownerRoom == null
    ? 0
    : (input.door.wall === "north" || input.door.wall === "south" ? ownerRoom.widthFeet : ownerRoom.heightFeet) -
      input.door.widthFeet;
  return {
    selectedDoorLabel: input.door.label,
    ownerRoomLabel: ownerRoom?.label ?? "Unknown room",
    invalidPlacementWarning:
      ownerRoom == null || input.door.offsetFeet < 0 || input.door.offsetFeet > maxOffset
        ? "Invalid door placement; offset must stay on the selected room wall."
        : null
  };
}
