import type { EditableRoomGeometry } from "@nerdeus/shared";
import { RoomQuickEditPopover } from "../RoomQuickEditPopover";
import { buildRoomQuickEdit } from "../roomQuickEditViewModel";

type RenderedElement = {
  props: {
    className?: string;
    children?: unknown;
    [key: string]: unknown;
  };
};
type RenderedChild = RenderedElement | null | undefined | boolean;

function isRenderedElement(child: RenderedChild): child is RenderedElement {
  return typeof child === "object" && child != null && "props" in child;
}

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

const children: RenderedChild[] = Array.isArray(element.props.children) ? element.props.children : [element.props.children];
const actionGroup = children.find(
  (child): child is RenderedElement => isRenderedElement(child) && child.props.className === "room-quick-edit-popover__actions"
);
if (actionGroup == null) {
  throw new Error("solid wall quick edit must render action controls");
}
const actionButtons = actionGroup.props.children as Array<{ props: { disabled?: boolean } }>;
const assignNurseButton = actionButtons[0];
const addDoorButton = actionButtons[1];
if (assignNurseButton == null || assignNurseButton.props.disabled !== true) {
  throw new Error("Assign nurse button must render disabled for solid walls");
}
if (addDoorButton == null || addDoorButton.props.disabled !== true) {
  throw new Error("Add Door button must render disabled for solid walls");
}
const visibleAddDoorReason = children.find(
  (child): child is RenderedElement => isRenderedElement(child) && child.props.children === "Solid wall / blocked area cannot accept doors."
);
if (visibleAddDoorReason == null) {
  throw new Error("solid wall Add Door disabled reason must render visibly");
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
