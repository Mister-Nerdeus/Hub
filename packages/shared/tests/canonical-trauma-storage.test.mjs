import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  getRoomTypeRule,
  validateDefaultSavedPlanFixtureContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturePath = join(
  repoRoot,
  "packages",
  "shared",
  "fixtures",
  "default-plans",
  "default-er-layout-plan-1.json"
);

function readPlan1() {
  return validateDefaultSavedPlanFixtureContract(JSON.parse(readFileSync(fixturePath, "utf8")), {
    sourcePlanIds: new Set(["source-er-layout-plan-1"]),
    mappingIds: new Set(["mapping-er-layout-plan-1"])
  }).plan;
}

test("canonical Trauma One rear box is classified as storage without geometry change", () => {
  const plan = readPlan1();
  const storage = plan.rooms.find((room) => room.id === "room-14");
  assert.ok(storage);
  assert.equal(storage.label, "14");
  assert.equal(storage.roomType, "storage");
  assert.equal(storage.x, 34);
  assert.equal(storage.y, 18);
  assert.equal(storage.widthFeet, 16);
  assert.equal(storage.lengthFeet, 14);
  assert.equal(storage.roomOperationalMetadata?.roomClass, "storage");
});

test("canonical Trauma One storage object is excluded by centralized room semantics", () => {
  const plan = readPlan1();
  const storage = plan.rooms.find((room) => room.id === "room-14");
  assert.ok(storage);
  const rule = getRoomTypeRule(storage.roomType);
  assert.equal(rule.nurseAssignable, false);
  assert.equal(rule.roomLoadEligible, false);
  assert.equal(rule.ratioCountEligible, false);
  assert.equal(rule.burdenScoreEligible, false);
});

test("Issue 432 does not introduce unrelated storage rooms", () => {
  const plan = readPlan1();
  const storageRooms = plan.rooms.filter((room) => room.roomType === "storage");
  assert.deepEqual(storageRooms.map((room) => room.id), ["room-14"]);
});
