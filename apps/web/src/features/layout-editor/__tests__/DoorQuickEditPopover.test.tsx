import type { EditableDoorGeometry, EditableRoomGeometry } from "@nerdeus/shared";
import { DoorQuickEditPopover } from "../DoorQuickEditPopover";
import { buildDoorQuickEdit } from "../doorQuickEditViewModel";

const rooms: EditableRoomGeometry[] = [
  room("room-01", "Room 01", 0, 10),
  room("room-02", "Room 02", 0, 0)
];
const door: EditableDoorGeometry = {
  objectType: "door",
  id: "door-01",
  label: "Door 01",
  ownerKind: "room",
  ownerId: "room-01",
  wall: "north",
  offsetFeet: 3,
  widthFeet: 4
};

const editable = buildDoorQuickEdit({ door, rooms, readOnly: false });
if (editable.status !== "ready" || !editable.canUseAdjacent) {
  throw new Error("door quick edit should expose adjacent candidates for editable selected doors");
}
if (editable.deleteDisabled) {
  throw new Error("door delete should be enabled for editable layouts");
}

const readOnly = buildDoorQuickEdit({ door, rooms, readOnly: true });
if (!readOnly.deleteDisabled) {
  throw new Error("door delete must be protected for read-only layouts");
}

const solidWallRooms: EditableRoomGeometry[] = [
  { ...room("solid-wall-01", "Solid wall", 0, 10), roomType: "solid_wall" },
  room("room-03", "Room 03", 0, 0)
];
const solidWallDoor = { ...door, ownerId: "solid-wall-01" };
const solidWallDoorViewModel = buildDoorQuickEdit({ door: solidWallDoor, rooms: solidWallRooms, readOnly: false });
if (solidWallDoorViewModel.readOnly !== true || solidWallDoorViewModel.canUseAdjacent !== false) {
  throw new Error("solid-wall door quick edit tools must be disabled");
}
if (solidWallDoorViewModel.noCandidateReason !== "Solid wall / blocked area cannot accept doors.") {
  throw new Error("solid-wall door quick edit must explain why tools are disabled");
}

const calls: string[] = [];
const element = DoorQuickEditPopover({
  viewModel: editable,
  onWallChange: () => calls.push("wall"),
  onNudge: () => calls.push("nudge"),
  onCenter: () => calls.push("center"),
  onOpposite: () => calls.push("opposite"),
  onAdjacentCandidate: () => calls.push("candidate"),
  onWidthDecrease: () => calls.push("width-decrease"),
  onWidthIncrease: () => calls.push("width-increase"),
  onWidthPreset: () => calls.push("width-preset"),
  onDeleteDoor: () => calls.push("delete")
});

if (element.type !== "div") {
  throw new Error("DoorQuickEditPopover must render door controls");
}
if (element.props["data-door-quick-edit"] !== "ready") {
  throw new Error("DoorQuickEditPopover must expose ready DOM assertion data");
}

const children = element.props.children;
children[1].props.children[1].props.onClick();
if (calls.at(-1) !== "nudge") throw new Error("nudge callback missing");
children[1].props.children[3].props.onClick();
if (calls.at(-1) !== "center") throw new Error("center callback missing");
children[1].props.children[4].props.onClick();
if (calls.at(-1) !== "opposite") throw new Error("opposite callback missing");
children[2].props.children[1].props.onClick();
if (calls.at(-1) !== "delete") throw new Error("delete callback missing");
children[3].props.children[1].props.onChange({ currentTarget: { value: "room-02" } });
if (calls.at(-1) !== "candidate") throw new Error("candidate callback missing");
children[4].props.children[1].props.onClick();
if (calls.at(-1) !== "width-decrease") throw new Error("width decrease callback missing");

if (children[3].props.children[1].props.value !== "") {
  throw new Error("quick edit candidate selector must start at the neutral placeholder");
}

function room(id: string, label: string, xFeet: number, yFeet: number): EditableRoomGeometry {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    xFeet,
    yFeet,
    widthFeet: 12,
    heightFeet: 10,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false
  };
}
