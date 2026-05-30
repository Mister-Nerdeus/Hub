import {
  safeAddDoorToRoom,
  safeAssignDoorToRoom,
  safeDeleteDoor,
  safeMoveDoor,
  safeUpdateDoorWidth
} from "../dist/index.js";
import { testEditableLayout } from "./authoring-test-helpers.mjs";

const added = safeAddDoorToRoom({
  layout: testEditableLayout,
  readOnly: false,
  doorId: "safe-door-one",
  roomId: "room-01",
  wall: "north",
  offsetFeet: 1,
  widthFeet: 2
});
if (added.status !== "applied" || added.layout.doors.every((door) => door.id !== "safe-door-one")) {
  throw new Error("safe add door wrapper must apply valid door changes");
}

const invalidAdd = safeAddDoorToRoom({
  layout: testEditableLayout,
  readOnly: false,
  doorId: "safe-door-invalid",
  roomId: "missing-room",
  wall: "north",
  offsetFeet: 1,
  widthFeet: 2
});
assertBlockedPreservesLayout(invalidAdd, testEditableLayout, "safe add door wrapper must block invalid room IDs");

const invalidMove = safeMoveDoor({
  layout: added.layout,
  readOnly: false,
  doorId: "missing-door",
  wall: "south",
  offsetFeet: 1
});
assertBlockedPreservesLayout(invalidMove, added.layout, "safe move door wrapper must block missing doors");

const invalidWidth = safeUpdateDoorWidth({
  layout: added.layout,
  readOnly: false,
  doorId: "safe-door-one",
  wall: "north",
  offsetFeet: 1,
  widthFeet: Number.NaN
});
assertBlockedPreservesLayout(invalidWidth, added.layout, "safe width wrapper must block non-finite widths");

const invalidAssign = safeAssignDoorToRoom({
  layout: added.layout,
  readOnly: false,
  doorId: "safe-door-one",
  roomId: "missing-room",
  wall: "north",
  offsetFeet: 1
});
assertBlockedPreservesLayout(invalidAssign, added.layout, "safe assignment wrapper must block invalid targets");

const invalidDelete = safeDeleteDoor({
  layout: added.layout,
  readOnly: false,
  doorId: "missing-door"
});
assertBlockedPreservesLayout(invalidDelete, added.layout, "safe delete wrapper must block missing doors");

function assertBlockedPreservesLayout(result, layout, message) {
  if (result.status !== "blocked") {
    throw new Error(message);
  }
  if (result.layout !== layout) {
    throw new Error("blocked door result must return the previous layout reference");
  }
  if (result.warning == null || result.warning.message.length === 0) {
    throw new Error("blocked door result must include a visible warning message");
  }
}
