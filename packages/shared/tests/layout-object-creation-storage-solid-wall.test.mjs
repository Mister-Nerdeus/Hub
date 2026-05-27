import assert from "node:assert/strict";
import test from "node:test";

import {
  addRoomToEditableLayout,
  createEditableLayoutRoomObject
} from "../dist/index.js";

const baseLayout = {
  schemaVersion: "1.0.0",
  layoutId: "layout-object-creation-proof",
  units: "feet",
  rooms: [],
  doors: [],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Local layout object creation proof only; no scenario execution."]
};

test("layout object creation creates explicit patient, storage, and solid-wall room semantics", () => {
  assert.equal(createEditableLayoutRoomObject(baseInput("patient_room")).roomType, "standard");
  assert.equal(createEditableLayoutRoomObject(baseInput("storage")).roomType, "storage");
  assert.equal(createEditableLayoutRoomObject(baseInput("solid_wall")).roomType, "solid_wall");
});

test("solid-wall placement creates no missing door or room-door path-node warning", () => {
  const result = addRoomToEditableLayout({
    layout: baseLayout,
    readOnly: false,
    roomId: "solid-wall-proof",
    label: "Solid Wall Proof",
    roomType: "solid_wall",
    xFeet: 10,
    yFeet: 10,
    widthFeet: 8,
    heightFeet: 8,
    boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 100 }
  });
  assert.equal(result.layout.rooms[0].roomType, "solid_wall");
  assert.deepEqual(result.warnings.map((warning) => warning.code), []);
});

test("patient-care placement remains a normal assignable room path", () => {
  const result = addRoomToEditableLayout({
    layout: baseLayout,
    readOnly: false,
    roomId: "patient-care-proof",
    label: "Care Bay Proof",
    roomType: "patient_room",
    xFeet: 10,
    yFeet: 10,
    widthFeet: 8,
    heightFeet: 8,
    boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 100 }
  });
  assert.equal(result.layout.rooms[0].roomType, "standard");
  assert.deepEqual(result.warnings.map((warning) => warning.code), [
    "ROOM_MISSING_DOOR",
    "ROOM_MISSING_PATH_NODE"
  ]);
});

function baseInput(roomType) {
  return {
    roomId: `${roomType}-proof`,
    label: `${roomType} proof`,
    roomType,
    xFeet: 1,
    yFeet: 2,
    widthFeet: 8,
    heightFeet: 8
  };
}
