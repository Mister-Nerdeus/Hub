import test from "node:test";
import assert from "node:assert/strict";

import {
  manualScenarioStaffRosterFixture,
  manualScenarioStaffRosterIdFor,
  validateManualScenarioStaffRosterContract
} from "../dist/index.js";

const validRoster = {
  staffRosterId: manualScenarioStaffRosterIdFor({ label: "Manual Scenario Roster Alpha" }),
  label: "Manual Scenario Roster Alpha",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  staffMembers: [
    {
      staffMemberId: "manual-staff-alpha",
      displayName: "Nurse Blue",
      role: "rn",
      active: true
    },
    {
      staffMemberId: "manual-staff-beta",
      displayName: "Tech Green",
      role: "tech",
      active: true
    }
  ],
  mode: "manual_roster"
};

test("manual scenario staff roster contract accepts manual roster records", () => {
  const roster = validateManualScenarioStaffRosterContract(validRoster);
  assert.equal(roster.mode, "manual_roster");
  assert.equal(roster.staffMembers.length, 2);
  assert.equal(roster.staffRosterId, "manual-staff-roster:manual-scenario-roster-alpha");
});

test("manual scenario staff roster fixture is demo-safe and deterministic", () => {
  const roster = validateManualScenarioStaffRosterContract(manualScenarioStaffRosterFixture);
  assert.equal(roster.mode, "manual_roster");
  assert.deepEqual(roster.staffMembers.map((staff) => staff.staffMemberId), [
    "manual-staff-blue",
    "manual-staff-green"
  ]);
});

test("manual scenario staff roster rejects duplicate staff member ids", () => {
  assert.throws(
    () => validateManualScenarioStaffRosterContract({
      ...validRoster,
      staffMembers: [
        validRoster.staffMembers[0],
        { ...validRoster.staffMembers[0] }
      ]
    }),
    /duplicate staffMemberId/u
  );
});

test("manual scenario staff roster rejects forbidden roster fields", () => {
  for (const field of [
    "competencyScore",
    "recommendationScore",
    "workloadScore",
    "staffingCompliance",
    "clinicalSafety",
    "patientOutcome"
  ]) {
    assert.throws(
      () => validateManualScenarioStaffRosterContract({ ...validRoster, [field]: "blocked" }),
      new RegExp(`manualScenarioStaffRoster\\.${field} is not allowed`)
    );
  }
});

test("manual scenario staff roster labels reject overclaim text", () => {
  assert.throws(
    () => validateManualScenarioStaffRosterContract({
      ...validRoster,
      staffRosterId: manualScenarioStaffRosterIdFor({ label: "Recommended roster" }),
      label: "Recommended roster"
    }),
    /overclaim language|NO_PHI_RUNTIME_REJECTION/u
  );
});
