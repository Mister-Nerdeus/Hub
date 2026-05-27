import { detectDoorAdjacency, type EditableDoorGeometry, type EditableRoomGeometry } from "@nerdeus/shared";

export type DoorEditorViewModel = {
  selectedDoorLabel: string;
  ownerRoomLabel: string;
  canUseAdjacentRoom: boolean;
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
  const adjacency = detectDoorAdjacency({
    layout: {
      schemaVersion: "1.0.0",
      layoutId: "door-editor-view-model",
      units: "feet",
      rooms: input.rooms,
      doors: [input.door],
      stations: [],
      hallways: [],
      zones: [],
      limitations: ["Editor-only adjacent candidate calculation."]
    },
    door: input.door
  });
  return {
    selectedDoorLabel: input.door.label,
    ownerRoomLabel: ownerRoom?.label ?? "Unknown room",
    canUseAdjacentRoom: adjacency.candidates.length > 0,
    invalidPlacementWarning:
      ownerRoom == null || input.door.offsetFeet < 0 || input.door.offsetFeet > maxOffset
        ? "Invalid door placement; offset must stay on the selected room wall."
        : null
  };
}
