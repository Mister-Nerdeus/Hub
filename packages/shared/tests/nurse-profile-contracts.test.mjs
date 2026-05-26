import assert from "node:assert/strict";
import test from "node:test";

import {
  syntheticManualAssignmentNurseProfiles,
  validateManualAssignmentNurse
} from "../dist/index.js";

test("synthetic manual assignment nurse profile defaults validate", () => {
  assert.deepEqual(
    syntheticManualAssignmentNurseProfiles.map((nurse) => nurse.displayLabel),
    ["Nurse Blue", "Nurse Green", "Nurse Purple", "Nurse Orange"]
  );
  for (const nurse of syntheticManualAssignmentNurseProfiles) {
    assert.equal(validateManualAssignmentNurse(nurse).syntheticDataOnly, true);
  }
});

test("nurse profile contracts reject identity, payroll, and scheduling fields", () => {
  const base = syntheticManualAssignmentNurseProfiles[0];
  assert.throws(() => validateManualAssignmentNurse({ ...base, legalName: "Synthetic Name" }), /forbidden|not allowed/u);
  assert.throws(() => validateManualAssignmentNurse({ ...base, employeeId: "EMP-000" }), /forbidden|not allowed/u);
  assert.throws(() => validateManualAssignmentNurse({ ...base, payrollCode: "PAY-000" }), /forbidden|not allowed/u);
  assert.throws(() => validateManualAssignmentNurse({ ...base, scheduleBlock: "day" }), /not allowed/u);
});
