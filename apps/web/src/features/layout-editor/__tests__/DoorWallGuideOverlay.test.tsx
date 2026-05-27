import type { EditableDoorGeometry, EditableRoomGeometry } from "@nerdeus/shared";
import { DoorWallGuideOverlay } from "../DoorWallGuideOverlay";
import { buildDoorWallGuideViewModel } from "../doorWallGuideViewModel";

const room: EditableRoomGeometry = {
  objectType: "room",
  id: "room-01",
  label: "Room 01",
  roomNumber: "01",
  roomType: "standard",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 0,
  yFeet: 0,
  widthFeet: 12,
  heightFeet: 10
};
const door: EditableDoorGeometry = { objectType: "door", id: "door-01", label: "Door", ownerKind: "room", ownerId: "room-01", wall: "north", offsetFeet: 3, widthFeet: 4 };
const viewModel = buildDoorWallGuideViewModel({ door, ownerRoom: room });
if (viewModel.status !== "ready" || viewModel.centerOffsetFeet !== 4 || viewModel.currentOffsetFeet !== 3) {
  throw new Error("wall guide should expose centerline and offset marker");
}
const element = DoorWallGuideOverlay({ viewModel });
if (element?.props["data-door-wall-guide"] !== "door-01") throw new Error("wall guide overlay should render selected door guide");
