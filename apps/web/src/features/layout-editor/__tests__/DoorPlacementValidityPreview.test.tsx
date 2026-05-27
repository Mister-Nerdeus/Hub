import type { EditableDoorGeometry, EditableRoomGeometry } from "@nerdeus/shared";
import { DoorPlacementValidityPreview } from "../DoorPlacementValidityPreview";
import { buildDoorPlacementValidityViewModel } from "../doorPlacementValidityViewModel";

const rooms = [room("owner", "Owner", 0, 10), room("target", "Target", 0, 0)];
const door: EditableDoorGeometry = {
  objectType: "door",
  id: "door-01",
  label: "Door 01",
  ownerKind: "room",
  ownerId: "owner",
  wall: "north",
  offsetFeet: 2,
  widthFeet: 4
};

const valid = buildDoorPlacementValidityViewModel({ door, rooms });
if (valid.status !== "valid") throw new Error("valid door placement should be labeled valid");
if (DoorPlacementValidityPreview({ viewModel: valid }).props["data-door-placement-validity"] !== "valid") {
  throw new Error("valid preview should expose status");
}

const invalid = buildDoorPlacementValidityViewModel({
  door: { ...door, offsetFeet: 99 },
  rooms
});
if (invalid.status !== "invalid" || !invalid.reasonCodes.includes("offset_outside_wall_bounds")) {
  throw new Error("invalid offset should be warned before export");
}

function room(id: string, label: string, xFeet: number, yFeet: number): EditableRoomGeometry {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 12,
    heightFeet: 10
  };
}
