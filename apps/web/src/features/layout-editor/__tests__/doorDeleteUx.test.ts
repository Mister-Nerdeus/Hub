import { createLayoutEditorState } from "../layoutEditorState";
import { layoutEditorReducer } from "../layoutEditorReducer";
import { buildLayoutValidationWarning } from "../layoutValidationWarningContract";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
  },
  ok(value: unknown, message: string): void {
    if (!value) throw new Error(message);
  }
};

const room = {
  objectType: "room" as const,
  id: "room-delete",
  label: "Room Delete",
  roomNumber: "D1",
  roomType: "standard" as const,
  capacityType: "single" as const,
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 0,
  yFeet: 0,
  widthFeet: 4,
  heightFeet: 4
};
const invalidDoor = {
  objectType: "door" as const,
  id: "door-delete",
  label: "Door Delete",
  ownerKind: "room" as const,
  ownerId: room.id,
  wall: "north" as const,
  offsetFeet: 3,
  widthFeet: 6
};
const layout = {
  schemaVersion: "1.0.0" as const,
  layoutId: "door-delete-ux",
  units: "feet" as const,
  rooms: [room],
  doors: [invalidDoor],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Synthetic door delete test fixture."]
};

const warning = buildLayoutValidationWarning({
  code: "door_exceeds_resized_room_wall",
  severity: "warning",
  source: "door_sync",
  message: "Door span exceeds resized room wall length.",
  objectType: "room",
  objectId: room.id,
  relatedObjectType: "door",
  relatedObjectId: invalidDoor.id,
  isGenerated: true
});

const selectedDoorState = createLayoutEditorState({
  editableLayout: layout,
  selectedObjectType: "door",
  selectedObjectId: invalidDoor.id,
  validationWarnings: [warning]
});
const afterDoorDelete = layoutEditorReducer(selectedDoorState, {
  type: "deleteDoor",
  doorId: invalidDoor.id
});
assert.equal(afterDoorDelete.editableLayout?.doors.length, 0);
assert.equal(afterDoorDelete.editableLayout?.rooms.length, 1);
assert.equal(afterDoorDelete.selectedObjectType, "room");
assert.equal(afterDoorDelete.selectedObjectId, room.id);
assert.equal(
  afterDoorDelete.validationWarnings.some((candidate) => candidate.relatedObjectId === invalidDoor.id),
  false
);

const selectedRoomState = createLayoutEditorState({
  editableLayout: layout,
  selectedObjectType: "room",
  selectedObjectId: room.id,
  validationWarnings: [warning]
});
const afterRoomDoorRemoval = layoutEditorReducer(selectedRoomState, {
  type: "removeSelectedRoomDoors"
});
assert.equal(afterRoomDoorRemoval.editableLayout?.rooms.length, 1);
assert.equal(afterRoomDoorRemoval.editableLayout?.doors.length, 0);
assert.equal(afterRoomDoorRemoval.selectedObjectType, "room");
assert.equal(afterRoomDoorRemoval.selectedObjectId, room.id);
assert.ok(
  afterRoomDoorRemoval.validationWarnings.some((candidate) => candidate.code === "path_sync_stale_after_door_edit"),
  "path sync stale warning remains after room-level door removal"
);
