import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_ER_POD_FLOORPLAN_ID,
  fourToOneAssignmentScenarioTemplate,
  threeToOneAssignmentScenarioTemplate,
  validateAssignmentScenarioTemplateContract
} from "../dist/index.js";

test("4:1 and 3:1 templates share the same canonical floorplan", () => {
  const fourToOne = validateAssignmentScenarioTemplateContract(fourToOneAssignmentScenarioTemplate);
  const threeToOne = validateAssignmentScenarioTemplateContract(threeToOneAssignmentScenarioTemplate);
  assert.equal(fourToOne.canonicalFloorplanId, CANONICAL_ER_POD_FLOORPLAN_ID);
  assert.equal(threeToOne.canonicalFloorplanId, CANONICAL_ER_POD_FLOORPLAN_ID);
  assert.equal(fourToOne.nurseGroups.length, 6);
  assert.equal(threeToOne.nurseGroups.length, 8);
});

test("assignment templates enforce ratio capacity", () => {
  const invalid = structuredClone(threeToOneAssignmentScenarioTemplate);
  invalid.nurseGroups[0].roomIds.push("room-04");
  assert.throws(() => validateAssignmentScenarioTemplateContract(invalid), /ratio capacity/);
});

test("assignment templates reject unsupported rooms and identity-like fields", () => {
  const unsupportedRoom = structuredClone(fourToOneAssignmentScenarioTemplate);
  unsupportedRoom.nurseGroups[0].roomIds[0] = "room-missing";
  assert.throws(() => validateAssignmentScenarioTemplateContract(unsupportedRoom), /roomIds/);

  assert.throws(
    () => validateAssignmentScenarioTemplateContract({
      ...fourToOneAssignmentScenarioTemplate,
      nurseGroups: [
        {
          ...fourToOneAssignmentScenarioTemplate.nurseGroups[0],
          realName: "Example Staff"
        }
      ]
    }),
    /forbidden|not allowed/
  );
  assert.throws(
    () => validateAssignmentScenarioTemplateContract({
      ...fourToOneAssignmentScenarioTemplate,
      ["patient" + "Identifier"]: "synthetic-identity"
    }),
    /forbidden/
  );
});
