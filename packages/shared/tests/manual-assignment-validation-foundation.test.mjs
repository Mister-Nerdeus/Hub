import {
  assignmentTargetIdFor,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract,
  validateManualAssignmentSetReferences
} from "../dist/index.js";

const floorplanId = "manual-validation-foundation-proof";
const roomTarget = target(floorplanId, "room", "room-14", "Room 14");
const zoneTarget = target(floorplanId, "zone", "zone-fast-track", "Zone Fast Track");
const baseSet = {
  assignmentSetId: "manual-validation-foundation-set",
  floorplanId,
  label: "Manual validation foundation set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  mode: "manual"
};

const restrictedSet = validateManualAssignmentSetContract({
  ...baseSet,
  assignments: [
    assignment("staff-rn-a", roomTarget),
    assignment("staff-rn-b", roomTarget)
  ]
});
const restrictedResult = validateManualAssignmentSetReferences({
  assignmentSet: restrictedSet,
  staffMembers: manualStaffFixture,
  assignmentTargets: [roomTarget, zoneTarget]
});
if (!restrictedResult.issues.some((issue) => issue.code === "multiple_staff_on_restricted_target")) {
  throw new Error("multiple staff on a room target must produce an explicit validation warning");
}

const supportSet = validateManualAssignmentSetContract({
  ...baseSet,
  assignments: [
    assignment("staff-rn-a", zoneTarget),
    assignment("staff-rn-b", zoneTarget)
  ]
});
const supportResult = validateManualAssignmentSetReferences({
  assignmentSet: supportSet,
  staffMembers: manualStaffFixture,
  assignmentTargets: [roomTarget, zoneTarget]
});
if (supportResult.issues.some((issue) => issue.code === "multiple_staff_on_restricted_target")) {
  throw new Error("multiple staff on an explicit zone target must be allowed by policy");
}

function target(floorplanId, targetKind, sourceId, displayLabel) {
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
  return {
    assignmentId: `manual-assignment:${baseSet.assignmentSetId}:${staffMemberId}:${target.assignmentTargetId}`,
    staffMemberId,
    assignmentTargetId: target.assignmentTargetId,
    assignmentTargetKind: target.targetKind
  };
}
