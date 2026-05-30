import type { EditableRoomGeometry } from "@nerdeus/shared";
import { RoomQuickEditPopover } from "../RoomQuickEditPopover";
import { buildRoomQuickEdit } from "../roomQuickEditViewModel";

const solidWall: EditableRoomGeometry = {
  objectType: "room",
  id: "solid-wall-01",
  label: "Solid wall",
  roomNumber: "Wall",
  xFeet: 1,
  yFeet: 2,
  widthFeet: 12,
  heightFeet: 10,
  roomType: "solid_wall",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false
};

const viewModel = buildRoomQuickEdit({ room: solidWall, readOnly: false });
if (!viewModel.addDoorDisabled) {
  throw new Error("solid wall Add Door control must be disabled");
}
if (viewModel.addDoorDisabledReason !== "Solid wall / blocked area cannot accept doors.") {
  throw new Error("solid wall Add Door disabled reason must be explicit");
}

const element = RoomQuickEditPopover({
  viewModel,
  onRoomTypeChange: () => undefined,
  onRoomIdentityChange: () => undefined,
  onWidthStep: () => undefined,
  onHeightStep: () => undefined,
  onAssignNurse: () => undefined,
  onAddDoor: () => {
    throw new Error("disabled add door should not be invoked by test");
  },
  onRemoveAttachedDoors: () => undefined,
  onDuplicateRoom: () => undefined,
  onDeleteRoom: () => undefined
});

const actionButtons = element.props.children[5].props.children;
if (actionButtons[0].props.disabled !== true) {
  throw new Error("Assign nurse button must render disabled for solid walls");
}
if (actionButtons[1].props.disabled !== true) {
  throw new Error("Add Door button must render disabled for solid walls");
}

const storageViewModel = buildRoomQuickEdit({
  room: { ...solidWall, id: "storage-01", roomType: "storage", label: "Storage", roomNumber: "Storage" },
  readOnly: false
});
if (!storageViewModel.addDoorDisabled) {
  throw new Error("storage Add Door control must be disabled");
}
if (storageViewModel.addDoorDisabledReason !== "Storage/support-only rooms use non-patient access workflows.") {
  throw new Error("storage Add Door disabled reason must be explicit");
}
