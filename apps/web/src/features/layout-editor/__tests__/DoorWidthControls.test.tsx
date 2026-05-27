import type { EditableDoorGeometry, EditableRoomGeometry } from "@nerdeus/shared";
import { DoorWidthControls } from "../DoorWidthControls";
import { buildDoorWidthControlsViewModel } from "../doorWidthControlsViewModel";

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
const door: EditableDoorGeometry = {
  objectType: "door",
  id: "door-01",
  label: "Door 01",
  ownerKind: "room",
  ownerId: "room-01",
  wall: "north",
  offsetFeet: 2,
  widthFeet: 4
};
const viewModel = buildDoorWidthControlsViewModel({ door, ownerRoom: room, readOnly: false });
if (viewModel.status !== "ready" || viewModel.presetsFeet.length !== 3 || !viewModel.orientationLabel.includes("horizontal")) {
  throw new Error("door width controls should expose presets and wall orientation");
}
const calls: string[] = [];
const element = DoorWidthControls({
  viewModel,
  onDecrease: () => calls.push("decrease"),
  onIncrease: () => calls.push("increase"),
  onPreset: (widthFeet) => calls.push(`preset-${widthFeet}`)
});
if (element.props["data-door-width-controls"] !== "ready") throw new Error("width controls should expose ready status");
const children = element.props.children.flat();
children[2].props.onClick();
children[4].props.onClick();
if (calls.join(",") !== "decrease,preset-3") throw new Error("width callbacks should fire");
