import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_CO_ASSIGNMENT_POLICY,
  assignmentTargetIdFor,
  createManualAssignmentSetEntry,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateCoAssignmentPolicyContract,
  validateManualAssignmentSetContract,
  validateManualAssignmentSetReferences
} from "../dist/index.js";

const floorplanId = "co-assignment-policy-proof";
const roomTarget = target("room", "room-14", "Room 14");
const bedTarget = target("bed_position", "room-02:bed-a", "Room 2A");
const zoneTarget = target("zone", "zone-fast-track", "Zone Fast Track");

test("default co-assignment policy warns for multiple staff on patient-care targets", () => {
  const policy = validateCoAssignmentPolicyContract(DEFAULT_CO_ASSIGNMENT_POLICY);
  const result = validateManualAssignmentSetReferences({
    assignmentSet: assignmentSet([
      assignment("staff-rn-a", roomTarget),
      assignment("staff-rn-b", roomTarget),
      assignment("staff-rn-c", bedTarget),
      assignment("staff-charge-a", bedTarget)
    ]),
    staffMembers: manualStaffFixture,
    assignmentTargets: [roomTarget, bedTarget, zoneTarget],
    coAssignmentPolicy: policy
  });

  const policyWarnings = result.issues.filter((issue) => issue.code === "multiple_staff_on_restricted_target");
  assert.equal(policyWarnings.length, 2);
  assert.equal(policyWarnings[0].message, "Multiple staff assigned to target");
  assert.equal(result.status, "passed");
});

test("explicit co-assignment policy allows configured support or zone targets", () => {
  const result = validateManualAssignmentSetReferences({
    assignmentSet: assignmentSet([
      assignment("staff-rn-a", zoneTarget),
      assignment("staff-rn-b", zoneTarget)
    ]),
    staffMembers: manualStaffFixture,
    assignmentTargets: [roomTarget, bedTarget, zoneTarget],
    coAssignmentPolicy: DEFAULT_CO_ASSIGNMENT_POLICY
  });

  assert.equal(result.issues.some((issue) => issue.code === "multiple_staff_on_restricted_target"), false);
});

test("co-assignment policy can be configured as blocking", () => {
  const result = validateManualAssignmentSetReferences({
    assignmentSet: assignmentSet([
      assignment("staff-rn-a", roomTarget),
      assignment("staff-rn-b", roomTarget)
    ]),
    staffMembers: manualStaffFixture,
    assignmentTargets: [roomTarget, bedTarget, zoneTarget],
    coAssignmentPolicy: {
      ...DEFAULT_CO_ASSIGNMENT_POLICY,
      warningOnly: false
    }
  });

  assert.equal(result.status, "failed");
  assert.equal(result.issues.find((issue) => issue.code === "multiple_staff_on_restricted_target")?.severity, "error");
});

function target(targetKind, sourceId, displayLabel) {
  return validateAssignmentFoundationTargetContract({
    assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind, sourceId }),
    targetKind,
    sourceId,
    displayLabel,
    floorplanId,
    active: true
  });
}

function assignment(staffMemberId, target) {
  return createManualAssignmentSetEntry({
    assignmentSetId: "co-assignment-policy-set",
    staffMemberId,
    target
  });
}

function assignmentSet(assignments) {
  return validateManualAssignmentSetContract({
    assignmentSetId: "co-assignment-policy-set",
    floorplanId,
    label: "Manual co-assignment policy proof",
    createdAtIso: "2026-06-01T00:00:00.000Z",
    updatedAtIso: "2026-06-01T00:00:00.000Z",
    assignments,
    mode: "manual"
  });
}
