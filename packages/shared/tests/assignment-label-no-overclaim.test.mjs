import {
  assignmentTargetIdFor,
  createManualAssignmentSetEntry,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract,
  validateManualStaffMemberContract
} from "../dist/index.js";

const floorplanId = "assignment-label-no-overclaim-proof";
const target = validateAssignmentFoundationTargetContract({
  assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind: "room", sourceId: "room-14" }),
  targetKind: "room",
  sourceId: "room-14",
  displayLabel: "Room 14",
  floorplanId,
  active: true
});

validateManualStaffMemberContract({
  staffMemberId: "staff-rn-proof",
  displayName: "RN Proof",
  role: "rn",
  active: true,
  notes: "Manual-only fixture"
});

validateManualAssignmentSetContract({
  assignmentSetId: "assignment-label-proof-set",
  floorplanId,
  label: "Manual assignment proof set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [
    createManualAssignmentSetEntry({
      assignmentSetId: "assignment-label-proof-set",
      staffMemberId: manualStaffFixture[0].staffMemberId,
      target,
      notes: "Manual placement note"
    })
  ],
  mode: "manual"
});

expectRejected("assignment target display label", () => validateAssignmentFoundationTargetContract({
  ...target,
  displayLabel: "Recommended Room 14"
}));

expectRejected("manual staff display name", () => validateManualStaffMemberContract({
  staffMemberId: "staff-rn-bad",
  displayName: "Best RN",
  role: "rn",
  active: true
}));

expectRejected("manual assignment set label", () => validateManualAssignmentSetContract({
  assignmentSetId: "assignment-label-bad-set",
  floorplanId,
  label: "Optimal assignment set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [],
  mode: "manual"
}));

expectRejected("manual assignment notes", () => validateManualAssignmentSetContract({
  assignmentSetId: "assignment-label-bad-notes-set",
  floorplanId,
  label: "Manual assignment set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [
    createManualAssignmentSetEntry({
      assignmentSetId: "assignment-label-bad-notes-set",
      staffMemberId: manualStaffFixture[0].staffMemberId,
      target,
      notes: "Balanced assignment"
    })
  ],
  mode: "manual"
}));

function expectRejected(label, run) {
  try {
    run();
  } catch (error) {
    if (error instanceof Error && /overclaim language/u.test(error.message)) {
      return;
    }
    throw error;
  }
  throw new Error(`${label} must reject assignment overclaim language`);
}
