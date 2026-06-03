import {
  assignmentTargetIdFor,
  createManualAssignmentSetEntry,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract,
  type AssignmentFoundationTargetContract
} from "@nerdeus/shared";
import {
  createManualAssignmentEditorState,
  reconcileManualAssignmentEditorStateForLayout
} from "../manualAssignmentState";
import {
  readManualAssignmentSetForFloorplan,
  type ManualAssignmentStorage
} from "../manualAssignmentStorage";

const layoutAFloorplanId = "layout-a-reset-proof";
const layoutBFloorplanId = "layout-b-reset-proof";
const layoutATarget = target(layoutAFloorplanId, "room-a", "Room A");
const layoutBTarget = target(layoutBFloorplanId, "room-b", "Room B");
const primaryStaff = manualStaffFixture[0];
if (primaryStaff == null) {
  throw new Error("manual staff fixture must include at least one staff member");
}
const layoutASet = validateManualAssignmentSetContract({
  assignmentSetId: "manual-layout-a-set",
  floorplanId: layoutAFloorplanId,
  label: "Manual layout A set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [
    createManualAssignmentSetEntry({
      assignmentSetId: "manual-layout-a-set",
      staffMemberId: primaryStaff.staffMemberId,
      target: layoutATarget
    })
  ],
  mode: "manual"
});

const layoutAState = createManualAssignmentEditorState({
  floorplanId: layoutAFloorplanId,
  staffMembers: manualStaffFixture,
  assignmentTargets: [layoutATarget],
  initialAssignmentSet: layoutASet
});

const layoutBState = reconcileManualAssignmentEditorStateForLayout({
  currentState: layoutAState,
  floorplanId: layoutBFloorplanId,
  staffMembers: manualStaffFixture,
  assignmentTargets: [layoutBTarget],
  matchingAssignmentSet: null
});

if (layoutBState.assignmentSet.floorplanId !== layoutBFloorplanId) {
  throw new Error("layout change must create an assignment set for the new floorplan");
}
if (layoutBState.assignmentSet.assignments.length !== 0) {
  throw new Error("layout change must not carry stale assignments into the new floorplan");
}
if (layoutBState.selectedAssignmentTargetId !== layoutBTarget.assignmentTargetId) {
  throw new Error("layout change must reset invalid selected assignment target");
}
if (layoutBState.selectedStaffMemberId !== layoutAState.selectedStaffMemberId) {
  throw new Error("layout change must preserve selected staff when still valid");
}

const invalidStaffState = reconcileManualAssignmentEditorStateForLayout({
  currentState: { ...layoutAState, selectedStaffMemberId: "missing-staff-member" },
  floorplanId: layoutAFloorplanId,
  staffMembers: manualStaffFixture,
  assignmentTargets: [layoutATarget],
  matchingAssignmentSet: layoutASet
});
if (invalidStaffState.selectedStaffMemberId !== primaryStaff.staffMemberId) {
  throw new Error("invalid selected staff must reset to the first valid staff member");
}

const storage = fakeStorage(JSON.stringify(layoutASet));
if (readManualAssignmentSetForFloorplan(storage, layoutAFloorplanId)?.assignmentSetId !== layoutASet.assignmentSetId) {
  throw new Error("stored assignment set must load for matching floorplan");
}
if (readManualAssignmentSetForFloorplan(storage, layoutBFloorplanId) !== null) {
  throw new Error("stored assignment set must not load for a mismatched floorplan");
}

function target(floorplanId: string, sourceId: string, displayLabel: string): AssignmentFoundationTargetContract {
  return validateAssignmentFoundationTargetContract({
    assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind: "room", sourceId }),
    targetKind: "room",
    sourceId,
    displayLabel,
    floorplanId,
    active: true
  });
}

function fakeStorage(value: string): ManualAssignmentStorage {
  let storedValue: string | null = value;
  return {
    getItem: () => storedValue,
    setItem: (_key, nextValue) => {
      storedValue = nextValue;
    },
    removeItem: () => {
      storedValue = null;
    }
  };
}
