import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultNurseProfiles,
  validateAssignmentSetContract
} from "../dist/index.js";

function buildAssignmentSet(overrides = {}) {
  const nurseProfiles = createDefaultNurseProfiles();
  return {
    schemaVersion: "1.0.0",
    assignmentSetId: "assignment-set-test",
    floorplanVersionId: "floorplan-version-test",
    displayName: "Test Assignment Set",
    status: "draft",
    nurseProfiles,
    assignmentsByRoomId: {
      "room-01": nurseProfiles[0].nurseProfileId
    },
    roomLoadsByRoomId: {
      "room-01": {
        schemaVersion: "1.0.0",
        roomId: "room-01",
        occupied: true,
        acuity: 3,
        traumaActive: false,
        isolationActive: false,
        behavioralRisk: false,
        fallRisk: false,
        sitterRequired: false,
        medicationFrequency: "medium",
        monitoringFrequency: "medium",
        procedureBurden: "low",
        expectedTurnover: "normal"
      }
    },
    createdAt: "2026-05-30T00:00:00.000Z",
    updatedAt: "2026-05-30T00:00:00.000Z",
    ...overrides
  };
}

test("assignment set contract validates durable floorplan-linked records", () => {
  const assignmentSet = validateAssignmentSetContract(buildAssignmentSet());

  assert.equal(assignmentSet.schemaVersion, "1.0.0");
  assert.equal(assignmentSet.floorplanVersionId, "floorplan-version-test");
  assert.equal(assignmentSet.assignmentsByRoomId["room-01"], "nurse-blue");
});

test("assignment set contract rejects duplicate nurse profile ids", () => {
  const nurseProfiles = createDefaultNurseProfiles();

  assert.throws(
    () => validateAssignmentSetContract(buildAssignmentSet({
      nurseProfiles: [
        nurseProfiles[0],
        {
          ...nurseProfiles[1],
          nurseProfileId: nurseProfiles[0].nurseProfileId
        }
      ]
    })),
    /nurseProfileId must be unique/u
  );
});

test("assignment set contract rejects assignments to inactive nurses", () => {
  const nurseProfiles = createDefaultNurseProfiles();

  assert.throws(
    () => validateAssignmentSetContract(buildAssignmentSet({
      nurseProfiles: [
        {
          ...nurseProfiles[0],
          active: false
        }
      ]
    })),
    /inactive nurse profile/u
  );
});

test("assignment set contract rejects identity-like nurse labels", () => {
  const nurseProfiles = createDefaultNurseProfiles();

  assert.throws(
    () => validateAssignmentSetContract(buildAssignmentSet({
      nurseProfiles: [
        {
          ...nurseProfiles[0],
          displayLabel: "Jane" + " Doe"
        }
      ]
    })),
    /NO_PHI_RUNTIME_REJECTION/u
  );
});

test("assignment set contract rejects non-hex nurse colors", () => {
  const nurseProfiles = createDefaultNurseProfiles();

  assert.throws(
    () => validateAssignmentSetContract(buildAssignmentSet({
      nurseProfiles: [
        {
          ...nurseProfiles[0],
          color: "blue"
        }
      ]
    })),
    /hex color/u
  );
});
