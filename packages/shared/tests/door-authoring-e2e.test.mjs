import {
  addDoorToRoom,
  assignDoorToRoom,
  buildPlanContractFromEditableLayout,
  deleteDoor,
  moveDoor,
  validateEditableLayoutGeometryContract
} from "../dist/index.js";
import { testEditableLayout, testPlan, throws } from "./authoring-test-helpers.mjs";

const secondRoom = {
  ...testEditableLayout.rooms[0],
  id: "room-02",
  label: "Room 02",
  roomNumber: "02",
  xFeet: 28
};
const twoRoomLayout = validateEditableLayoutGeometryContract({
  ...testEditableLayout,
  rooms: [...testEditableLayout.rooms, secondRoom]
});

const addedOne = addDoorToRoom({
  layout: twoRoomLayout,
  readOnly: false,
  doorId: "door-authored-one",
  roomId: "room-01",
  wall: "north",
  offsetFeet: 1,
  widthFeet: 3
});
const addedTwo = addDoorToRoom({
  layout: addedOne.layout,
  readOnly: false,
  doorId: "door-authored-two",
  roomId: "room-01",
  wall: "south",
  offsetFeet: 2,
  widthFeet: 3
});
if (addedTwo.layout.doors.filter((door) => door.ownerId === "room-01").length < 3) {
  throw new Error("multiple doors per room must persist");
}

const moved = moveDoor({
  layout: addedTwo.layout,
  readOnly: false,
  doorId: "door-authored-one",
  wall: "east",
  offsetFeet: 1
});
const assigned = assignDoorToRoom({
  layout: moved.layout,
  readOnly: false,
  doorId: "door-authored-two",
  roomId: "room-02",
  wall: "north",
  offsetFeet: 1
});
const deleted = deleteDoor({
  layout: assigned.layout,
  readOnly: false,
  doorId: "door-authored-one"
});
if (deleted.layout.doors.some((door) => door.id === "door-authored-one")) {
  throw new Error("deleted authored door must not persist");
}
const assignedDoor = deleted.layout.doors.find((door) => door.id === "door-authored-two");
if (assignedDoor?.ownerId !== "room-02") {
  throw new Error("assigned door must persist on the reassigned room");
}
for (const result of [addedOne, addedTwo, moved, assigned, deleted]) {
  if (result.pathSyncStatus !== "stale_warning") {
    throw new Error("every door edit must mark path sync stale_warning");
  }
}

const exported = buildPlanContractFromEditableLayout({
  sourcePlan: {
    ...testPlan,
    rooms: [...testPlan.rooms, { ...testPlan.rooms[0], id: "room-02", label: "Room 02", x: 28 }],
    doors: testPlan.doors,
    pathNodes: testPlan.pathNodes,
    pathEdges: testPlan.pathEdges
  },
  editableLayout: deleted.layout,
  planId: "door-authoring-export"
});
if (exported.doors.some((door) => door.id === "door-authored-one")) {
  throw new Error("export must preserve door deletion");
}
if (exported.doors.find((door) => door.id === "door-authored-two")?.roomId !== "room-02") {
  throw new Error("export must preserve door assignment");
}

throws(() => addDoorToRoom({ ...doorInput(), offsetFeet: Number.NaN }), /finite number/);
throws(() => addDoorToRoom({ ...doorInput(), offsetFeet: Number.POSITIVE_INFINITY }), /finite number/);
throws(() => addDoorToRoom({ ...doorInput(), widthFeet: Number.NaN }), /finite number/);
throws(() => addDoorToRoom({ ...doorInput(), widthFeet: 0 }), /greater than 0/);
throws(() => addDoorToRoom({ ...doorInput(), offsetFeet: 99 }), /perimeter/);
throws(() => addDoorToRoom({ ...doorInput(), readOnly: true }), /read-only default plans/);

function doorInput() {
  return {
    layout: twoRoomLayout,
    readOnly: false,
    doorId: "door-negative",
    roomId: "room-01",
    wall: "north",
    offsetFeet: 1,
    widthFeet: 3
  };
}
