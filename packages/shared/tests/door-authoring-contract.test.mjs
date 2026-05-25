import { addDoorToRoom, assignDoorToRoom, deleteDoor, moveDoor } from "../dist/index.js";
import { testEditableLayout, throws } from "./authoring-test-helpers.mjs";

const added = addDoorToRoom({
  layout: testEditableLayout,
  readOnly: false,
  doorId: "door-room-01-second",
  roomId: "room-01",
  wall: "north",
  offsetFeet: 2,
  widthFeet: 3
});
if (added.layout.doors.filter((door) => door.ownerId === "room-01").length !== 2) {
  throw new Error("rooms must support multiple authored doors");
}
const moved = moveDoor({
  layout: added.layout,
  readOnly: false,
  doorId: "door-room-01-second",
  wall: "south",
  offsetFeet: 1
});
if (moved.pathSyncStatus !== "stale_warning") {
  throw new Error("door edits must mark path sync stale");
}
const reassigned = assignDoorToRoom({
  layout: moved.layout,
  readOnly: false,
  doorId: "door-room-01-second",
  roomId: "room-01",
  wall: "east",
  offsetFeet: 1
});
const deleted = deleteDoor({
  layout: reassigned.layout,
  readOnly: false,
  doorId: "door-room-01-second"
});
if (deleted.layout.doors.some((door) => door.id === "door-room-01-second")) {
  throw new Error("deleted door must be removed");
}
throws(() => addDoorToRoom({ ...addedInput(), readOnly: true }), /read-only/);
throws(() => addDoorToRoom({ ...addedInput(), roomId: "missing" }), /valid room/);
throws(() => addDoorToRoom({ ...addedInput(), offsetFeet: 99 }), /perimeter/);
throws(() => addDoorToRoom({ ...addedInput(), doorId: "door-room-01" }), /unique/);

function addedInput() {
  return {
    layout: testEditableLayout,
    readOnly: false,
    doorId: "door-new",
    roomId: "room-01",
    wall: "north",
    offsetFeet: 1,
    widthFeet: 3
  };
}
