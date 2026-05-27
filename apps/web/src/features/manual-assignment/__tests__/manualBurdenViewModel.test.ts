import { syntheticManualAssignmentNurseProfiles, syntheticManualAssignmentRoomLoads } from "@nerdeus/shared";
import { assignRoomToNurse } from "../manualAssignmentActions";
import { manualAssignmentReducer } from "../manualAssignmentReducer";
import { createManualAssignmentInitialState } from "../manualAssignmentState";
import { createManualBurdenViewModel } from "../manualBurdenViewModel";

const initialState = createManualAssignmentInitialState(
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads
);
const assignedState = manualAssignmentReducer(
  manualAssignmentReducer(initialState, assignRoomToNurse("room-101", "nurse-green")),
  assignRoomToNurse("room-102", "nurse-green")
);
const viewModel = createManualBurdenViewModel(assignedState);
const green = viewModel.burdenRows.find((row) => row.nurseId === "nurse-green");

if (!green) {
  throw new Error("manual burden view model must include nurse-green row");
}

if (green.totalBurden <= green.acuityBurden || !green.explanation.includes("walking burden")) {
  throw new Error("manual burden view model must expose score components and total burden");
}

if (!viewModel.warnings.some((warning) => warning.code === "TRAUMA_QUALIFICATION_MISMATCH")) {
  throw new Error("manual burden view model must expose trauma mismatch warning");
}

if (!viewModel.warnings.every((warning) => warning.visibleComponents.length > 0)) {
  throw new Error("manual burden warnings must expose visible components");
}
