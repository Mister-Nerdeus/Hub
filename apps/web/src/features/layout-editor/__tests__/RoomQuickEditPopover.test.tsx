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

const layout = {
  schemaVersion: "1.0.0" as const,
  layoutId: "quick-edit-test",
  units: "feet" as const,
  rooms: [
    room,
    {
      ...room,
      id: "room-02",
      label: "Room 02",
      roomNumber: "02",
      xFeet: 13
    }
  ],
  doors: [],
  supportAccessPoints: [],
  stations: [],
  hallways: [],
  zones: [],
  splitBays: [],
  limitations: ["Synthetic quick edit test layout."]
};

const editableViewModel = buildRoomQuickEdit({ room, layout, readOnly: false });
if (editableViewModel.status !== "ready") {
  throw new Error("room quick edit should be ready when a room is selected");
}
if (editableViewModel.deleteDisabled || editableViewModel.duplicateDisabled) {
  throw new Error("room duplicate/delete controls should be enabled for editable layouts");
}

const readOnlyViewModel = buildRoomQuickEdit({ room, layout, readOnly: true });
if (!readOnlyViewModel.deleteDisabled || !readOnlyViewModel.duplicateDisabled) {
  throw new Error("room delete/duplicate controls must be protected for read-only layouts");
}

const calls: string[] = [];
const element = RoomQuickEditPopover({
  viewModel: editableViewModel,
  onRoomTypeChange: () => calls.push("room-type"),
  onRoomIdentityChange: () => calls.push("room-identity"),
  onWidthStep: () => calls.push("width"),
  onHeightStep: () => calls.push("height"),
  onAssignNurse: () => calls.push("assign-nurse"),
  onAddDoor: () => calls.push("add-door"),
  onPreviewSplitRoom: () => calls.push("preview-split-room"),
  onCreateSplitRoom: () => calls.push("create-split-room"),
  onShowSplitRoomHelp: () => calls.push("split-room-help"),
  onRemoveAttachedDoors: () => calls.push("remove-attached-doors"),
  onDuplicateRoom: () => calls.push("duplicate-room"),
  onDeleteRoom: () => calls.push("delete-room")
});

if (element.type !== "div") {
  throw new Error("RoomQuickEditPopover must render room controls");
}
if (element.props["data-room-quick-edit"] !== "ready") {
  throw new Error("RoomQuickEditPopover must expose ready DOM assertion data");
}

const children: RenderedChild[] = Array.isArray(element.props.children) ? element.props.children : [element.props.children];
const actionGroup = children.find(
  (child): child is RenderedElement => isRenderedElement(child) && child.props?.className === "room-quick-edit-popover__actions"
);
if (actionGroup == null) {
  throw new Error("RoomQuickEditPopover must render the primary action group");
}
const actionButtons = actionGroup.props.children as Array<{ props: { disabled?: boolean; onClick?: () => void } }>;
for (const [index, expected] of ["assign-nurse", "add-door", "remove-attached-doors", "duplicate-room", "delete-room"].entries()) {
  const actionButton = actionButtons[index];
  if (actionButton == null) {
    throw new Error(`Missing ${expected} button`);
  }
  if (actionButton.props.disabled) {
    continue;
  }
  if (actionButton.props.onClick == null) {
    throw new Error(`Missing ${expected} callback`);
  }
  actionButton.props.onClick();
  if (calls.at(-1) !== expected) {
    throw new Error(`Expected ${expected} callback`);
  }
}

const splitRoomSection = children.find(
  (child): child is RenderedElement => isRenderedElement(child) && child.props?.["data-split-room-workflow"] != null
);
if (splitRoomSection == null) {
  throw new Error("RoomQuickEditPopover must render split-room workflow context");
}
if (splitRoomSection.props["data-split-room-workflow"] !== "blocked") {
  throw new Error("Room 01 should not expose a canonical split room action");
}
