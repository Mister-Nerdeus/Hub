import { syntheticManualAssignmentNurseProfiles, syntheticManualAssignmentRoomLoads } from "@nerdeus/shared";
import { assignRoomToNurse, clearManualAssignments, reassignRoomToNurse, setActiveManualAssignmentNurse } from "../manualAssignmentActions";
import { manualAssignmentReducer } from "../manualAssignmentReducer";
import { createManualAssignmentInitialState } from "../manualAssignmentState";
import { createManualAssignmentWorkspaceViewModel } from "../manualAssignmentWorkspaceViewModel";

let state = createManualAssignmentInitialState(
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads
);

let viewModel = createManualAssignmentWorkspaceViewModel(state);
if (!viewModel.nurseOptions.some((nurse) => nurse.selected && nurse.displayLabel === "Nurse Blue")) {
  throw new Error("manual assignment workspace must expose selected synthetic nurse");
}

state = manualAssignmentReducer(state, assignRoomToNurse("room-101", "nurse-blue"));
viewModel = createManualAssignmentWorkspaceViewModel(state);
const assignedRoom = viewModel.roomCards.find((room) => room.roomId === "room-101");
if (assignedRoom?.assignedNurseLabel !== "Nurse Blue" || assignedRoom.assignedColor == null) {
  throw new Error("manual assignment workspace must color-code assigned room cards");
}

state = manualAssignmentReducer(state, setActiveManualAssignmentNurse("nurse-green"));
state = manualAssignmentReducer(state, reassignRoomToNurse("room-101", "nurse-green"));
viewModel = createManualAssignmentWorkspaceViewModel(state);
if (viewModel.roomCards.find((room) => room.roomId === "room-101")?.assignedNurseLabel !== "Nurse Green") {
  throw new Error("manual assignment workspace must support reassignment by selected nurse");
}

if (viewModel.nurseCards.find((card) => card.nurseId === "nurse-green")?.assignedRoomCount !== 1) {
  throw new Error("manual assignment workspace must expose nurse assignment cards");
}

if (viewModel.unassignedOccupiedRoomCount !== 1) {
  throw new Error("manual assignment workspace must expose unassigned occupied rooms");
}

state = manualAssignmentReducer(state, clearManualAssignments());
viewModel = createManualAssignmentWorkspaceViewModel(state);
if (viewModel.assignedRoomCount !== 0 || viewModel.unassignedOccupiedRoomCount !== 2) {
  throw new Error("manual assignment workspace must support clear-all assignments");
}
