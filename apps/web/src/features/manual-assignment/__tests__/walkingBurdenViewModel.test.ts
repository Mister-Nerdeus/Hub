import { syntheticManualAssignmentNurseProfiles, syntheticManualAssignmentRoomLoads } from "@nerdeus/shared";
import { assignRoomToNurse } from "../manualAssignmentActions";
import { manualAssignmentReducer } from "../manualAssignmentReducer";
import { createManualAssignmentInitialState } from "../manualAssignmentState";
import { createWalkingBurdenSummaryByNurse } from "../walkingBurdenViewModel";

const initialState = createManualAssignmentInitialState(
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads
);
const assignedState = manualAssignmentReducer(
  manualAssignmentReducer(initialState, assignRoomToNurse("room-101", "nurse-blue")),
  assignRoomToNurse("room-103", "nurse-blue")
);

const summary = createWalkingBurdenSummaryByNurse(assignedState)["nurse-blue"];
if (!summary) {
  throw new Error("walking burden view model must include nurse-blue summary");
}

if (!summary.usedGraphDistance || summary.fallbackDistanceCount !== 0) {
  throw new Error("walking burden view model must prefer graph distance for configured rooms");
}

if (summary.roomToRoomSpread <= 0 || !summary.displaySummary.includes("walk units")) {
  throw new Error("walking burden view model must expose room spread and walk units");
}
