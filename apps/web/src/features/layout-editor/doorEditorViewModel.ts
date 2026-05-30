import type { EditableDoorGeometry, EditableHallwayGeometry, EditableRoomGeometry } from "@nerdeus/shared";
import {
  buildDoorOwnerViewModel,
  doorOwnerDisplayLabel,
  doorOwnerKindLabel,
  doorOwnerWarning,
  type DoorOwnerViewModel
} from "./doorOwnerViewModel";

export type DoorEditorViewModel = {
  selectedDoorLabel: string;
  ownerLabel: string;
  ownerKindLabel: string;
  owner: DoorOwnerViewModel;
  invalidPlacementWarning: string | null;
  patientDoorControlsEnabled: boolean;
};

export function buildDoorEditorViewModel(input: {
  door: EditableDoorGeometry | null;
  rooms: EditableRoomGeometry[];
  hallways?: EditableHallwayGeometry[];
}): DoorEditorViewModel | null {
  if (input.door == null) return null;
  const owner = buildDoorOwnerViewModel({
    door: input.door,
    rooms: input.rooms,
    hallways: input.hallways ?? []
  });
  if (owner == null) return null;
  const ownerRoom = owner.status === "room"
    ? input.rooms.find((room) => room.id === owner.roomId) ?? null
    : null;
  const maxOffset = ownerRoom == null
    ? 0
    : (input.door.wall === "north" || input.door.wall === "south" ? ownerRoom.widthFeet : ownerRoom.heightFeet) -
      input.door.widthFeet;
  return {
    selectedDoorLabel: input.door.label,
    ownerLabel: doorOwnerDisplayLabel(owner),
    ownerKindLabel: doorOwnerKindLabel(owner),
    owner,
    invalidPlacementWarning:
      doorOwnerWarning(owner) ??
      (owner.status !== "room"
        ? null
        : ownerRoom == null || input.door.offsetFeet < 0 || input.door.offsetFeet > maxOffset
        ? "Invalid door placement; offset must stay on the selected room wall."
        : null),
    patientDoorControlsEnabled: owner.status === "room" && owner.doorEligible
  };
}
