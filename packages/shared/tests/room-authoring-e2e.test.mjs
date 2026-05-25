import {
  AUTHORING_WARNING_CODES,
  addRoomToEditableLayout,
  authoringRoomTypeToPlanRoomType,
  buildPlanContractFromEditableLayout,
  validateAuthoringWarningCode,
  validateEditableLayoutGeometryContract
} from "../dist/index.js";
import { testEditableLayout, testPlan, throws } from "./authoring-test-helpers.mjs";

const requiredWarningCodes = [
  "ROOM_MISSING_DOOR",
  "ROOM_MISSING_PATH_NODE",
  "PATH_SYNC_STALE",
  "ROOM_OUTSIDE_BOUNDS",
  "ROOM_TYPE_INVALID",
  "READONLY_AUTHORING_BLOCKED"
];

for (const code of requiredWarningCodes) {
  if (!AUTHORING_WARNING_CODES.includes(code)) {
    throw new Error(`missing required authoring warning code: ${code}`);
  }
  if (validateAuthoringWarningCode(code) !== code) {
    throw new Error(`warning code did not validate: ${code}`);
  }
}

const resizedLayout = validateEditableLayoutGeometryContract({
  ...testEditableLayout,
  rooms: testEditableLayout.rooms.map((room) =>
    room.id === "room-01" ? { ...room, widthFeet: room.widthFeet + 2 } : room
  )
});
const typedLayout = validateEditableLayoutGeometryContract({
  ...resizedLayout,
  rooms: resizedLayout.rooms.map((room) =>
    room.id === "room-01"
      ? { ...room, roomType: "trauma", isTraumaAdjacent: true }
      : room
  )
});
const addRoomResult = addRoomToEditableLayout({
  layout: typedLayout,
  readOnly: false,
  roomId: "room-authoring-added",
  label: "Authored Room",
  roomType: "trauma_room",
  xFeet: 52,
  yFeet: 10,
  widthFeet: 10,
  heightFeet: 8,
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 80 }
});

const warningCodes = addRoomResult.warnings.map((warning) => warning.code).sort();
if (JSON.stringify(warningCodes) !== JSON.stringify(["ROOM_MISSING_DOOR", "ROOM_MISSING_PATH_NODE"])) {
  throw new Error(`added room warnings must use structured codes, got ${warningCodes.join(", ")}`);
}
if (addRoomResult.selectedRoomId !== "room-authoring-added") {
  throw new Error("added room must be selected by the add-room result");
}

const exportedPlan = buildPlanContractFromEditableLayout({
  sourcePlan: testPlan,
  editableLayout: addRoomResult.layout,
  planId: "room-authoring-export"
});
const resizedExportedRoom = exportedPlan.rooms.find((room) => room.id === "room-01");
const addedExportedRoom = exportedPlan.rooms.find((room) => room.id === "room-authoring-added");
if (resizedExportedRoom?.widthFeet !== testEditableLayout.rooms[0].widthFeet + 2) {
  throw new Error("export must preserve resized room geometry");
}
if (resizedExportedRoom.roomType !== "trauma") {
  throw new Error("export must preserve changed room type");
}
if (addedExportedRoom?.roomType !== authoringRoomTypeToPlanRoomType("trauma_room")) {
  throw new Error("export must preserve added room type");
}

throws(
  () =>
    addRoomToEditableLayout({
      layout: typedLayout,
      readOnly: true,
      roomId: "readonly-room",
      label: "Readonly Room",
      roomType: "patient_room",
      xFeet: 20,
      yFeet: 20,
      widthFeet: 10,
      heightFeet: 8,
      boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 80 }
    }),
  /read-only default plans/
);
throws(
  () =>
    addRoomToEditableLayout({
      layout: typedLayout,
      readOnly: false,
      roomId: "outside-room",
      label: "Outside Room",
      roomType: "patient_room",
      xFeet: 98,
      yFeet: 20,
      widthFeet: 10,
      heightFeet: 8,
      boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 80 }
    }),
  /within layout bounds/
);
throws(
  () =>
    addRoomToEditableLayout({
      layout: typedLayout,
      readOnly: false,
      roomId: "invalid-type-room",
      label: "Invalid Type Room",
      roomType: "invalid_type",
      xFeet: 20,
      yFeet: 20,
      widthFeet: 10,
      heightFeet: 8,
      boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 80 }
    }),
  /roomType must be one of/
);
