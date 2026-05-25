import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validatePlan1NurseProfiles, validatePlanContract } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const nurses = readJson("assignments/plan-1/synthetic-nurses.json").nurses;

test("validates the four Plan 1 synthetic nurse profiles", () => {
  const validated = validatePlan1NurseProfiles(nurses, plan);
  assert.deepEqual(validated.map((nurse) => nurse.displayName), [
    "Nurse Blue",
    "Nurse Green",
    "Nurse Orange",
    "Nurse Purple"
  ]);
});

for (const [name, patch, expected] of [
  ["real-looking staff name", { displayName: "Alex Smith" }, "synthetic nurse display name"],
  ["email address field", { email: "nurse@example.test" }, "email is not allowed"],
  ["phone number field", { phoneNumber: "555-0100" }, "phoneNumber is not allowed"],
  ["employee ID field", { employeeId: "E123" }, "employeeId is not allowed"],
  ["badge number field", { badgeNumber: "B123" }, "badgeNumber is not allowed"],
  ["empty nurse ID", { nurseId: "" }, "non-empty string"],
  ["invalid home station", { homeStationId: "station-missing" }, "Plan 1 nurse station"],
  ["target over max", { targetPatientCount: 5, maxPatientCount: 4 }, "less than or equal"],
  ["synthetic flag false", { syntheticDataOnly: false }, "must be true"]
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => validatePlan1NurseProfiles([{ ...nurses[0], ...patch }], plan), new RegExp(expected));
  });
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}
