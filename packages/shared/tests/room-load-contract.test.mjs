import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validatePlan1RoomLoads, validatePlanContract } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const roomLoads = readJson("assignments/plan-1/room-loads-baseline.json").roomLoads;

test("validates one synthetic room-load record for every Plan 1 patient-care room", () => {
  const validated = validatePlan1RoomLoads(roomLoads, plan);
  assert.equal(validated.length, 22);
  assert.equal(validated.some((roomLoad) => roomLoad.roomId === "room-14"), false);
  assert.ok(validated.some((roomLoad) => roomLoad.occupied));
  assert.ok(validated.some((roomLoad) => !roomLoad.occupied));
});

for (const [name, patch, expected] of [
  ["identity-like name field", { [`${"patient"}Name`]: "Synthetic Example" }, `${"patient"}Name is not allowed`],
  ["record-number field", { [`m${"rn"}`]: "R123" }, `m${"rn"} is not allowed`],
  ["birth-date field", { [`dateOf${"Birth"}`]: "2000-01-01" }, `dateOf${"Birth"} is not allowed`],
  ["diagnosis-like text field", { [`diagnosis${"Text"}`]: "abstract" }, `diagnosis${"Text"} is not allowed`],
  ["clinical-note-like field", { [`freeTextClinical${"Note"}`]: "abstract" }, `freeTextClinical${"Note"} is not allowed`],
  ["invalid room ID", { roomId: "room-missing" }, "Plan 1 room"],
  ["synthetic flag false", { syntheticDataOnly: false }, "must be true"],
  ["bad acuity", { acuityLevel: "extreme" }, "acuityLevel must be one of"],
  ["bad burden enum", { medicationBurden: "constant" }, "medicationBurden must be one of"]
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => validatePlan1RoomLoads([{ ...roomLoads[0], ...patch }], plan), new RegExp(expected));
  });
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}
