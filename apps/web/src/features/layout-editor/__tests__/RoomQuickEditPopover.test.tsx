import type { EditableRoomGeometry } from "@nerdeus/shared";
import { RoomQuickEditPopover } from "../RoomQuickEditPopover";
import { buildRoomQuickEdit } from "../roomQuickEditViewModel";

const room: EditableRoomGeometry = {
  objectType: "room",
  id: "room-01",
  label: "Room 01",
  roomNumber: "01",
  xFeet: 1,
  yFeet: 2,
  widthFeet: 12,
  heightFeet: 10,
  roomType: "standard",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false
};

const editableViewModel = buildRoomQuickEdit({ room, readOnly: false });
if (editableViewModel.status !== "ready") {
  throw new Error("room quick edit should be ready when a room is selected");
}
if (editableViewModel.deleteDisabled || editableViewModel.duplicateDisabled) {
  throw new Error("room duplicate/delete controls should be enabled for editable layouts");
}

const readOnlyViewModel = buildRoomQuickEdit({ room, readOnly: true });
if (!readOnlyViewModel.deleteDisabled || !readOnlyViewModel.duplicateDisabled) {
  throw new Error("room delete/duplicate controls must be protected for read-only layouts");
}

const calls: string[] = [];
const element = RoomQuickEditPopover({
  viewModel: editableViewModel,
  onRoomTypeChange: () => calls.push("room-type"),
  onWidthStep: () => calls.push("width"),
  onHeightStep: () => calls.push("height"),
  onAssignNurse: () => calls.push("assign-nurse"),
  onAddDoor: () => calls.push("add-door"),
  onDuplicateRoom: () => calls.push("duplicate-room"),
  onDeleteRoom: () => calls.push("delete-room")
});

if (element.type !== "div") {
  throw new Error("RoomQuickEditPopover must render room controls");
}
if (element.props["data-room-quick-edit"] !== "ready") {
  throw new Error("RoomQuickEditPopover must expose ready DOM assertion data");
}

const children = element.props.children;
const actionButtons = children[3].props.children;
for (const [index, expected] of ["assign-nurse", "add-door", "duplicate-room", "delete-room"].entries()) {
  actionButtons[index].props.onClick();
  if (calls.at(-1) !== expected) {
    throw new Error(`Expected ${expected} callback`);
  }
}
