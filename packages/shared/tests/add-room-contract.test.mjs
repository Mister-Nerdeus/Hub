import { addRoomToEditableLayout } from "../dist/index.js";
import { testEditableLayout, throws } from "./authoring-test-helpers.mjs";

const result = addRoomToEditableLayout({
  layout: testEditableLayout,
  readOnly: false,
  roomId: "room-added",
  label: "Room Added",
  roomType: "patient_room",
  xFeet: 40,
  yFeet: 40,
  widthFeet: 12,
  heightFeet: 10,
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 100 }
});
if (!result.layout.rooms.some((room) => room.id === "room-added") || result.selectedRoomId !== "room-added") {
  throw new Error("added room must be selected and persisted in layout");
}
if (!result.warnings.some((warning) => warning.includes("no authored door"))) {
  throw new Error("added room must warn when no door exists");
}
throws(() => addRoomToEditableLayout({ ...argumentsFixture(), readOnly: true }), /read-only/);
throws(() => addRoomToEditableLayout({ ...argumentsFixture(), roomId: "room-01" }), /unique/);
throws(() => addRoomToEditableLayout({ ...argumentsFixture(), xFeet: 500 }), /bounds/);
throws(() => addRoomToEditableLayout({ ...argumentsFixture(), roomType: "icu" }), /roomType/);

function argumentsFixture() {
  return {
    layout: testEditableLayout,
    readOnly: false,
    roomId: "room-added-2",
    label: "Room Added 2",
    roomType: "patient_room",
    xFeet: 40,
    yFeet: 40,
    widthFeet: 12,
    heightFeet: 10,
    boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 100 }
  };
}
