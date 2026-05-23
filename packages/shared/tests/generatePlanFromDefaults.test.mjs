import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildPlanGenerationPreview,
  generatePlanFromDefaults,
  validatePlanBuilderDefaultsContract,
  validatePlanContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function basicDefaults() {
  return validatePlanBuilderDefaultsContract(readFixture("plan-builder-defaults-basic.json"));
}

test("basic defaults generate a valid deterministic plan", () => {
  const defaults = basicDefaults();
  const first = generatePlanFromDefaults(defaults);
  const second = generatePlanFromDefaults(defaults);

  assert.deepEqual(first, second);
  validatePlanContract(first);
  assert.equal(first.rooms.length, defaults.roomDefaults.roomCount);
  assert.equal(first.rooms[0].id, "room-001");
  assert.equal(first.doors[0].id, "door-room-001");
  assert.equal(first.pathNodes.some((node) => node.id === "node-hall-mid"), true);
});

test("door count follows autoCreateDoors", () => {
  const defaults = basicDefaults();
  defaults.doorDefaults.autoCreateDoors = false;
  defaults.doorDefaults.defaultDoorWidthFeet = 0;
  defaults.doorDefaults.autoCreateDoorPathNodes = false;
  defaults.pathGraphDefaults.autoCreatePathEdges = false;
  defaults.pathGraphDefaults.autoConnectRoomsToHallway = false;
  defaults.pathGraphDefaults.defaultHallwayEdgeWidthFeet = 0;

  const plan = generatePlanFromDefaults(validatePlanBuilderDefaultsContract(defaults));

  assert.equal(plan.doors.length, 0);
  assert.equal(plan.rooms.every((room) => room.pathNodeId == null), true);
});

test("station count follows defaults", () => {
  const defaults = basicDefaults();
  defaults.nurseStationDefaults.nurseStationCount = 0;

  const plan = generatePlanFromDefaults(validatePlanBuilderDefaultsContract(defaults));

  assert.equal(plan.nurseStations.length, 0);
  assert.equal(plan.rooms.every((room) => room.nearestStationId == null), true);
});

test("path edges follow autoCreatePathEdges", () => {
  const defaults = basicDefaults();
  defaults.pathGraphDefaults.autoCreatePathEdges = false;
  defaults.pathGraphDefaults.autoConnectRoomsToHallway = false;
  defaults.pathGraphDefaults.defaultHallwayEdgeWidthFeet = 0;

  const plan = generatePlanFromDefaults(validatePlanBuilderDefaultsContract(defaults));

  assert.equal(plan.pathEdges.length, 0);
});

test("generated references are valid and preview summary matches output", () => {
  const preview = buildPlanGenerationPreview(basicDefaults());

  validatePlanContract(preview.plan);
  assert.equal(preview.summary.roomCount, preview.plan.rooms.length);
  assert.equal(preview.summary.doorCount, preview.plan.doors.length);
  assert.equal(preview.summary.pathNodeCount, preview.plan.pathNodes.length);
  assert.equal(preview.summary.pathEdgeCount, preview.plan.pathEdges.length);
});
