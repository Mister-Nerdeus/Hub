import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_CO_ASSIGNMENT_POLICY,
  assignmentTargetIdFor,
  coAssignmentPolicyAllowsMultipleStaff,
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
const hallBedTarget = target("hall_bed", "hall-01", "Hall Bed 1");
const supportTarget = target("support_area", "support-team-room", "Support Team Room");
const zoneTarget = target("zone", "zone-fast-track", "Zone Fast Track");

test("default co-assignment policy warns for multiple staff on patient-care targets", () => {
  const policy = validateCoAssignmentPolicyContract(DEFAULT_CO_ASSIGNMENT_POLICY);
  const result = validateManualAssignmentSetReferences({
    assignmentSet: assignmentSet([
      assignment("staff-rn-a", roomTarget),
      assignment("staff-rn-b", roomTarget),
      assignment("staff-rn-c", bedTarget),
      assignment("staff-charge-a", bedTarget),
      assignment("staff-rn-a", hallBedTarget),
      assignment("staff-rn-b", hallBedTarget)
    ]),
    staffMembers: manualStaffFixture,
    assignmentTargets: [roomTarget, bedTarget, hallBedTarget, supportTarget, zoneTarget],
    coAssignmentPolicy: policy
  });

  const policyWarnings = result.issues.filter((issue) => issue.code === "multiple_staff_on_restricted_target");
  assert.equal(policyWarnings.length, 3);
  assert.equal(policyWarnings[0].message, "Multiple staff assigned to target");
  assert.equal(result.status, "passed");
});

test("explicit co-assignment policy allows configured support or zone targets", () => {
  const result = validateManualAssignmentSetReferences({
    assignmentSet: assignmentSet([
      assignment("staff-rn-a", supportTarget),
      assignment("staff-rn-b", supportTarget),
      assignment("staff-rn-a", zoneTarget),
      assignment("staff-rn-b", zoneTarget)
    ]),
    staffMembers: manualStaffFixture,
    assignmentTargets: [roomTarget, bedTarget, hallBedTarget, supportTarget, zoneTarget],
    coAssignmentPolicy: DEFAULT_CO_ASSIGNMENT_POLICY
  });

  assert.equal(result.issues.some((issue) => issue.code === "multiple_staff_on_restricted_target"), false);
});

test("single primary mode uses allow list as explicit override list", () => {
  const policy = validateCoAssignmentPolicyContract(DEFAULT_CO_ASSIGNMENT_POLICY);

  assert.equal(coAssignmentPolicyAllowsMultipleStaff(policy, "room"), false);
  assert.equal(coAssignmentPolicyAllowsMultipleStaff(policy, "bed_position"), false);
  assert.equal(coAssignmentPolicyAllowsMultipleStaff(policy, "hall_bed"), false);
  assert.equal(coAssignmentPolicyAllowsMultipleStaff(policy, "support_area"), true);
  assert.equal(coAssignmentPolicyAllowsMultipleStaff(policy, "zone"), true);
});

test("allow multiple mode permits all target kinds regardless of allow list", () => {
  const policy = validateCoAssignmentPolicyContract({
    policyId: "manual-allow-multiple-policy",
    mode: "allow_multiple_manual_staff",
    allowMultipleForTargetKinds: [],
    warningOnly: true
  });

  for (const targetKind of ["room", "bed_position", "hall_bed", "support_area", "zone"]) {
    assert.equal(coAssignmentPolicyAllowsMultipleStaff(policy, targetKind), true);
  }
});

test("co-assignment policy can be configured as blocking", () => {
  const result = validateManualAssignmentSetReferences({
    assignmentSet: assignmentSet([
      assignment("staff-rn-a", roomTarget),
      assignment("staff-rn-b", roomTarget)
    ]),
    staffMembers: manualStaffFixture,
    assignmentTargets: [roomTarget, bedTarget, hallBedTarget, supportTarget, zoneTarget],
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
