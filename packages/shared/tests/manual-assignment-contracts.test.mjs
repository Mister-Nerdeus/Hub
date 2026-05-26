import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  syntheticManualAssignmentFixture,
  validateManualAssignmentNurse,
  validateManualAssignmentRoomLoad,
  validateManualAssignmentSet,
  validateManualAssignmentWarning,
  validateManualNurseBurdenScore,
  validateManualRoomAssignment
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/manual-assignment/", import.meta.url));

test("valid manual assignment fixture validates through shared contract", () => {
  const fixture = readJson("manual-assignment-set-valid.json");
  assert.equal(validateManualAssignmentSet(fixture).assignmentSetId, "manual-assignment-foundation-basic");
  assert.equal(validateManualAssignmentSet(syntheticManualAssignmentFixture).nurses.length, 2);
});

test("individual manual assignment contracts validate", () => {
  const fixture = readJson("manual-assignment-set-valid.json");
  assert.equal(validateManualAssignmentNurse(fixture.nurses[0]).displayLabel, "Nurse Blue");
  assert.equal(validateManualAssignmentRoomLoad(fixture.roomLoads[0]).acuity, 3);
  assert.equal(validateManualRoomAssignment(fixture.assignments[0]).primary, true);
  assert.equal(validateManualAssignmentWarning(fixture.warnings[0]).code, "TRAUMA_QUALIFICATION_MISMATCH");
  assert.equal(validateManualNurseBurdenScore(fixture.burdenScores[0]).totalBurden, 6);
});

test("manual assignment contracts reject forbidden identity and clinical fields", () => {
  for (const fixtureName of [
    "invalid-phi-field.json",
    "invalid-clinical-note.json",
    "invalid-medication-name.json",
    "invalid-diagnosis.json",
    "invalid-employee-id.json"
  ]) {
    assert.throws(() => validateManualAssignmentSet(readJson(fixtureName)), /forbidden|not allowed/u);
  }
});

test("manual assignment nurse rejects real-name style display labels", () => {
  assert.throws(() => validateManualAssignmentNurse(readJson("invalid-real-nurse-name.json")), /displayLabel/u);
});

test("manual assignment set rejects unsupported assignment references", () => {
  assert.throws(() => validateManualAssignmentSet(readJson("invalid-unsupported-assignment-reference.json")), /unsupported roomId/u);
});

function readJson(fileName) {
  return JSON.parse(readFileSync(join(fixturesDir, fileName), "utf8"));
}
