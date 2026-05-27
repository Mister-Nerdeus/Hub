import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  filterEligibleRoomLoads,
  selectScenarioSeedRoomLoadRoomIds,
  summarizeRoomLoadEligibility,
  validateDefaultSavedPlanFixtureContract,
  validateManualAssignment,
  validatePlan1RoomLoads
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixture = validateDefaultSavedPlanFixtureContract(
  readJson("packages/shared/fixtures/default-plans/default-er-layout-plan-1.json"),
  {
    sourcePlanIds: new Set(["source-er-layout-plan-1"]),
    mappingIds: new Set(["mapping-er-layout-plan-1"])
  }
);
const plan = fixture.plan;
const roomLoads = readJson("packages/shared/fixtures/assignments/plan-1/room-loads-baseline.json").roomLoads;

test("Plan 1 room-load fixture excludes canonical storage", () => {
  const validated = validatePlan1RoomLoads(roomLoads, plan);
  assert.equal(validated.some((roomLoad) => roomLoad.roomId === "room-14"), false);
});

test("room-load eligibility excludes storage and solid wall semantics", () => {
  const withSolidWall = addSolidWall(plan);
  const summary = summarizeRoomLoadEligibility(withSolidWall);
  assert.equal(summary.excludedRoomIds.includes("room-14"), true);
  assert.equal(summary.excludedRoomIds.includes("room-solid-wall-proof"), true);
});

test("Plan 1 room-load validation rejects storage and solid wall room loads", () => {
  const storageLoad = { ...roomLoads[0], roomId: "room-14" };
  assert.throws(
    () => validatePlan1RoomLoads([storageLoad], plan),
    /excluded from room-load inputs/u
  );

  const withSolidWall = addSolidWall(plan);
  assert.throws(
    () => validatePlan1RoomLoads([{ ...roomLoads[0], roomId: "room-solid-wall-proof" }], withSolidWall),
    /excluded from room-load inputs/u
  );
});

test("generated room-load arrays and scenario seed room targets exclude non-patient rooms", () => {
  const withSolidWall = addSolidWall(plan);
  const generated = filterEligibleRoomLoads([
    { ...roomLoads[0], roomId: "room-level-1-trauma" },
    { ...roomLoads[0], roomId: "room-14" },
    { ...roomLoads[0], roomId: "room-solid-wall-proof" }
  ], withSolidWall);
  assert.deepEqual(generated.map((roomLoad) => roomLoad.roomId), ["room-level-1-trauma"]);
  const seedRoomIds = selectScenarioSeedRoomLoadRoomIds(withSolidWall);
  assert.equal(seedRoomIds.includes("room-14"), false);
  assert.equal(seedRoomIds.includes("room-solid-wall-proof"), false);
});

test("generic manual assignment validation flags room loads on storage", () => {
  const result = validateManualAssignment(plan, [
    {
      roomId: "room-14",
      occupied: true,
      acuity: 3,
      traumaActive: false,
      isolationActive: false,
      behavioralRisk: false,
      fallRisk: false,
      sitterRequired: false,
      medicationFrequency: "low",
      monitoringFrequency: "low",
      procedureBurden: "none",
      expectedTurnover: "low"
    }
  ], {
    schemaVersion: "1.0.0",
    assignmentSetId: "storage-room-load-negative",
    planId: plan.planId,
    name: "Storage room load negative",
    nurses: [],
    assignments: []
  });
  assert.equal(result.warnings.some((warning) => warning.message.includes("excluded from room-load inputs")), true);
});

function addSolidWall(sourcePlan) {
  return {
    ...sourcePlan,
    rooms: [
      ...sourcePlan.rooms,
      {
        ...sourcePlan.rooms[0],
        id: "room-solid-wall-proof",
        label: "Solid Wall Proof",
        roomType: "solid_wall",
        doorPoint: null,
        pathNodeId: null,
        roomOperationalMetadata: {
          ...sourcePlan.rooms[0].roomOperationalMetadata,
          roomClass: "solid_wall"
        }
      }
    ]
  };
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8"));
}
