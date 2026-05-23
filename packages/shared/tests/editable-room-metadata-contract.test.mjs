import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  EDITABLE_ROOM_CAPACITY_TYPES,
  EDITABLE_ROOM_TYPES,
  validateEditableLayoutGeometryContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("editable room metadata is required on every room", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const invalid = clone(fixture);
  delete invalid.rooms[0].roomNumber;

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalid),
    /roomNumber/
  );
});

test("editable room metadata validates operational room types and capacity types", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const validated = validateEditableLayoutGeometryContract(fixture);

  assert.equal(validated.rooms.every((room) => EDITABLE_ROOM_TYPES.includes(room.roomType)), true);
  assert.equal(
    validated.rooms.every((room) => EDITABLE_ROOM_CAPACITY_TYPES.includes(room.capacityType)),
    true
  );
  assert.equal(validated.rooms.some((room) => room.roomType === "trauma"), true);
  assert.equal(validated.rooms.some((room) => room.isTraumaAdjacent === true), true);
});

test("editable room metadata rejects unsupported diagnosis-oriented room type text", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const invalid = clone(fixture);
  invalid.rooms[0].roomType = "cardiac symptom";

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalid),
    /operational room type/i
  );
});

test("editable room metadata rejects room numbers that look like identity labels", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const invalid = clone(fixture);
  invalid.rooms[0].roomNumber = "patient tag 123";

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalid),
    /patient identifier/i
  );
});

test("editable room metadata rejects unsupported room and capacity enum values", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const invalidRoomType = clone(fixture);
  invalidRoomType.rooms[0].roomType = "observation";

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalidRoomType),
    /roomType/
  );

  const invalidCapacity = clone(fixture);
  invalidCapacity.rooms[0].capacityType = "triple";

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalidCapacity),
    /capacityType/
  );
});

test("editable room metadata requires hall_bed room type to set isHallBed", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const invalid = clone(fixture);
  invalid.rooms[0].roomType = "hall_bed";
  invalid.rooms[0].capacityType = "hall";
  invalid.rooms[0].isHallBed = false;

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalid),
    /isHallBed/
  );

  const valid = clone(fixture);
  valid.rooms[0].roomType = "hall_bed";
  valid.rooms[0].capacityType = "hall";
  valid.rooms[0].isHallBed = true;

  assert.equal(validateEditableLayoutGeometryContract(valid).rooms[0].isHallBed, true);
});
