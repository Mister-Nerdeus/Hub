import { manualAssignmentReducer, type ManualAssignmentPaintState } from "./manualAssignmentState";

const baseState: ManualAssignmentPaintState = {
  selectedNurseId: "nurse-blue",
  assignments: [
    {
      assignmentId: "a1",
      roomId: "room-02",
      nurseId: "nurse-green",
      assignmentType: "primary",
      startMinute: 0,
      endMinute: null,
      source: "manual",
      syntheticDataOnly: true
    }
  ]
};

const reassigned = manualAssignmentReducer(baseState, { type: "togglePrimaryRoom", roomId: "room-02" });
assertPaint(reassigned.assignments.length === 1, "reassignment must keep one primary assignment");
assertPaint(reassigned.assignments[0]?.nurseId === "nurse-blue", "selected nurse must receive the room");
assertPaint(baseState.assignments[0]?.nurseId === "nurse-green", "reducer must not mutate prior assignment state");

const unassigned = manualAssignmentReducer(reassigned, { type: "togglePrimaryRoom", roomId: "room-02" });
assertPaint(unassigned.assignments.length === 0, "clicking an already assigned selected nurse room must unassign it");

function assertPaint(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
