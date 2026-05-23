import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  validateEditableLayoutGeometryContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("editable layout geometry fixture validates with feet-based editable objects", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const validated = validateEditableLayoutGeometryContract(fixture);

  assert.deepEqual(validated, fixture);
  assert.equal(validated.units, "feet");
  assert.equal(validated.rooms.length > 0, true);
  assert.equal(validated.doors.length > 0, true);
  assert.equal(validated.stations.some((station) => station.stationType === "nurse_station"), true);
  assert.equal(validated.stations.some((station) => station.stationType === "desk"), true);
  assert.equal(validated.hallways.length > 0, true);
  assert.equal(validated.zones.some((zone) => zone.zoneType === "ems_entry"), true);
  assert.equal(validated.zones.some((zone) => zone.zoneType === "trauma"), true);
  assert.equal(validated.zones.some((zone) => zone.zoneType === "provider_pharmacy"), true);
});

test("editable layout geometry rejects negative geometry", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const invalid = clone(fixture);
  invalid.rooms[0].widthFeet = -1;

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalid),
    /widthFeet/
  );
});

test("editable layout geometry rejects doors outside their wall span", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const invalid = clone(fixture);
  invalid.doors[0].offsetFeet = 99;

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalid),
    /door.*wall/i
  );
});

test("editable layout geometry rejects pixel fields", () => {
  const fixture = readFixture("layout-editor/editable-layout-basic.json");
  const invalid = clone(fixture);
  invalid.rooms[0].xPixels = 120;

  assert.throws(
    () => validateEditableLayoutGeometryContract(invalid),
    /pixel/i
  );
});
