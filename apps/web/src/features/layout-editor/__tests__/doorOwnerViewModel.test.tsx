import type {
  EditableDoorGeometry,
  EditableHallwayGeometry,
  EditableRoomGeometry,
  EditableSupportAccessPointGeometry,
  EditableZoneGeometry
} from "@nerdeus/shared";
import { DoorQuickEditPopover } from "../DoorQuickEditPopover";
import { buildDoorEditorViewModel } from "../doorEditorViewModel";
import { buildDoorOwnerViewModel } from "../doorOwnerViewModel";
import { buildDoorQuickEdit } from "../doorQuickEditViewModel";

const rooms: EditableRoomGeometry[] = [
  room("room-01", "Room 01", "standard"),
  room("storage-01", "Storage", "storage")
];
const hallways: EditableHallwayGeometry[] = [
  {
    objectType: "hallway",
    id: "hallway-01",
    label: "Main Hallway",
    xFeet: 0,
    yFeet: 0,
    widthFeet: 40,
    heightFeet: 8
  }
];
const zones: EditableZoneGeometry[] = [
  {
    objectType: "zone",
    id: "zone-provider",
    label: "Provider Pharmacy",
    zoneType: "provider_pharmacy",
    xFeet: 0,
    yFeet: 0,
    widthFeet: 12,
    heightFeet: 10
  }
];
const roomDoor = door("room-door", "room", "room-01");
const hallwayDoor = door("hallway-door", "hallway", "hallway-01");
const storageDoor = door("storage-door", "room", "storage-01");
const missingDoor = door("missing-door", "room", "missing-room");
const supportAccess: EditableSupportAccessPointGeometry = {
  objectType: "support_access",
  id: "support-access-01",
  label: "Provider access",
  ownerKind: "zone",
  ownerId: "zone-provider",
  wall: "south",
  offsetFeet: 1,
  widthFeet: 4
};

const roomOwner = buildDoorOwnerViewModel({ door: roomDoor, rooms, hallways });
if (roomOwner?.status !== "room" || !roomOwner.doorEligible) {
  throw new Error("room-owned door should resolve as a valid room owner");
}

const hallwayOwner = buildDoorOwnerViewModel({ door: hallwayDoor, rooms, hallways });
if (hallwayOwner?.status !== "hallway" || hallwayOwner.hallwayId !== "hallway-01") {
  throw new Error("hallway-owned opening should resolve as a hallway owner");
}

const supportOwner = buildDoorOwnerViewModel({ accessPoint: supportAccess, zones });
if (supportOwner?.status !== "support_access" || supportOwner.zoneId !== "zone-provider") {
  throw new Error("support access point should resolve to a support access owner model");
}

const missingOwner = buildDoorOwnerViewModel({ door: missingDoor, rooms, hallways });
if (missingOwner?.status !== "missing" || !missingOwner.warning.includes("missing")) {
  throw new Error("missing door owner should produce a warning model");
}

const invalidOwner = buildDoorOwnerViewModel({ door: storageDoor, rooms, hallways });
if (invalidOwner?.status !== "invalid" || !invalidOwner.warning.includes("Storage/support-only")) {
  throw new Error("storage-owned patient door should produce an invalid owner model");
}

const hallwayQuickEdit = buildDoorQuickEdit({ door: hallwayDoor, rooms, hallways, readOnly: false });
if (hallwayQuickEdit.ownerStatus !== "hallway" || !hallwayQuickEdit.readOnly || hallwayQuickEdit.canUseAdjacent) {
  throw new Error("hallway openings must not expose patient-room quick-edit controls");
}
const hallwayPopover = DoorQuickEditPopover({
  viewModel: hallwayQuickEdit,
  onWallChange: () => undefined,
  onNudge: () => undefined,
  onCenter: () => undefined,
  onOpposite: () => undefined,
  onDeleteDoor: () => undefined
});
if (hallwayPopover.type !== "div" || !String(hallwayPopover.props.children[2].props.children[0].props.children).includes("Hallway opening")) {
  throw new Error("hallway quick-edit popover must show hallway opening controls");
}

const hallwayEditor = buildDoorEditorViewModel({ door: hallwayDoor, rooms, hallways });
if (hallwayEditor?.owner.status !== "hallway" || hallwayEditor.patientDoorControlsEnabled) {
  throw new Error("hallway-owned opening must not enable patient door controls in the side panel");
}

const storageEditor = buildDoorEditorViewModel({ door: storageDoor, rooms, hallways });
if (storageEditor?.owner.status !== "invalid" || storageEditor.patientDoorControlsEnabled) {
  throw new Error("invalid door owner must disable patient door controls in the side panel");
}

function door(
  id: string,
  ownerKind: EditableDoorGeometry["ownerKind"],
  ownerId: string
): EditableDoorGeometry {
  return {
    objectType: "door",
    id,
    label: id,
    ownerKind,
    ownerId,
    wall: "south",
    offsetFeet: 1,
    widthFeet: 4
  };
}

function room(
  id: string,
  label: string,
  roomType: EditableRoomGeometry["roomType"]
): EditableRoomGeometry {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType,
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet: 0,
    yFeet: 0,
    widthFeet: 12,
    heightFeet: 10
  };
}
