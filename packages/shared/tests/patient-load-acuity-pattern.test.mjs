import assert from "node:assert/strict";
import test from "node:test";

import {
  highLoadPatientLoadPattern,
  lowLoadPatientLoadPattern,
  overwhelmedLoadPatientLoadPattern,
  patientLoadAcuityPresets,
  typicalLoadAcuityPattern,
  typicalLoadPatientLoadPattern,
  validateAcuityPatternContract,
  validatePatientLoadPatternContract
} from "../dist/index.js";

test("patient load and acuity preset fixtures validate", () => {
  for (const preset of patientLoadAcuityPresets) {
    assert.equal(validatePatientLoadPatternContract(preset.patientLoadPattern).syntheticDataOnly, true);
    assert.equal(validateAcuityPatternContract(preset.acuityPattern).syntheticDataOnly, true);
  }
  assert.equal(lowLoadPatientLoadPattern.patientLoadPatternId, "low_load");
  assert.equal(typicalLoadPatientLoadPattern.patientLoadPatternId, "typical_load");
  assert.equal(highLoadPatientLoadPattern.patientLoadPatternId, "high_load");
  assert.equal(overwhelmedLoadPatientLoadPattern.patientLoadPatternId, "overwhelmed_load");
});

test("load and acuity contracts reject identity and clinical-like fields", () => {
  assert.throws(
    () => validatePatientLoadPatternContract({ ...typicalLoadPatientLoadPattern, ["patient" + "Record"]: "record-like" }),
    /forbidden/
  );
  assert.throws(
    () => validateAcuityPatternContract({ ...typicalLoadAcuityPattern, diagnosisText: "not allowed" }),
    /forbidden|not allowed/
  );
  assert.throws(
    () => validateAcuityPatternContract({ ...typicalLoadAcuityPattern, ["medication" + "Name"]: "not allowed" }),
    /forbidden/
  );
});

test("acuity distribution must sum to 100", () => {
  assert.throws(
    () => validateAcuityPatternContract({ ...typicalLoadAcuityPattern, highAcuityShare: 40 }),
    /sum to 100/
  );
});
