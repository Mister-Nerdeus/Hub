import { syntheticManualAssignmentNurseProfiles, syntheticManualAssignmentRoomLoads } from "@nerdeus/shared";
import {
  assignRoomToNurse,
  clearManualAssignments,
  reassignRoomToNurse,
  setActiveManualAssignmentNurse,
  setManualAssignmentRoomLoad,
  unassignRoom
} from "../manualAssignmentActions";
import { manualAssignmentReducer } from "../manualAssignmentReducer";
import {
  selectAssignmentCountByNurse,
  selectOccupiedAssignmentCountByNurse,
  selectOverMaxCountByNurse,
  selectOverTargetCountByNurse,
  selectUnassignedOccupiedRooms
} from "../manualAssignmentSelectors";
import { createManualAssignmentInitialState } from "../manualAssignmentState";

const initialState = createManualAssignmentInitialState(
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads
);

const assigned = manualAssignmentReducer(initialState, assignRoomToNurse("room-101", "nurse-blue"));
if (assigned.assignmentsByRoomId["room-101"]?.nurseId !== "nurse-blue") {
  throw new Error("assign room action must create a primary room assignment");
}

const reassigned = manualAssignmentReducer(assigned, reassignRoomToNurse("room-101", "nurse-green"));
if (reassigned.assignmentsByRoomId["room-101"]?.nurseId !== "nurse-green") {
  throw new Error("reassign room action must replace the primary nurse deterministically");
}

if (Object.keys(reassigned.assignmentsByRoomId).length !== 1) {
  throw new Error("reassign room action must not create duplicate primary assignments");
}

const unassigned = manualAssignmentReducer(reassigned, unassignRoom("room-101"));
if (unassigned.assignmentsByRoomId["room-101"]) {
  throw new Error("unassign room action must remove the room assignment");
}

const cleared = manualAssignmentReducer(
  manualAssignmentReducer(unassigned, assignRoomToNurse("room-102", "nurse-blue")),
  clearManualAssignments()
);
if (Object.keys(cleared.assignmentsByRoomId).length !== 0) {
  throw new Error("clear assignments action must remove every assignment");
}

const active = manualAssignmentReducer(cleared, setActiveManualAssignmentNurse("nurse-purple"));
if (active.activeNurseId !== "nurse-purple") {
  throw new Error("set active nurse action must update active nurse");
}

const room103Load = syntheticManualAssignmentRoomLoads.find((roomLoad) => roomLoad.roomId === "room-103");
if (!room103Load) {
  throw new Error("synthetic room load defaults must include room-103");
}
const updatedRoomLoad = {
  ...room103Load,
  occupied: true,
  acuity: 5 as const
};
const loadUpdated = manualAssignmentReducer(active, setManualAssignmentRoomLoad(updatedRoomLoad));
if (loadUpdated.roomLoadsByRoomId["room-103"]?.acuity !== 5) {
  throw new Error("set room load action must replace structured room load data");
}

const overLimitState = syntheticManualAssignmentRoomLoads.reduce(
  (state, roomLoad) => manualAssignmentReducer(state, assignRoomToNurse(roomLoad.roomId, "nurse-purple")),
  loadUpdated
);
if (selectUnassignedOccupiedRooms(loadUpdated).length !== 3) {
  throw new Error("unassigned occupied rooms selector must detect occupied rooms without primary assignments");
}

if (selectAssignmentCountByNurse(overLimitState)["nurse-purple"] !== 3) {
  throw new Error("assignment count selector must count all assigned rooms");
}

if (selectOccupiedAssignmentCountByNurse(overLimitState)["nurse-purple"] !== 3) {
  throw new Error("occupied assignment count selector must count occupied assigned rooms");
}

if (selectOverTargetCountByNurse(overLimitState)["nurse-purple"] !== 0) {
  throw new Error("over target selector must compare occupied count to target count");
}

const lowMaxState = {
  ...overLimitState,
  nurses: overLimitState.nurses.map((nurse) =>
    nurse.nurseId === "nurse-purple" ? { ...nurse, targetPatientCount: 1, maxPatientCount: 2 } : nurse
  )
};
if (selectOverTargetCountByNurse(lowMaxState)["nurse-purple"] !== 2) {
  throw new Error("over target selector must report count over target");
}

if (selectOverMaxCountByNurse(lowMaxState)["nurse-purple"] !== 1) {
  throw new Error("over max selector must report count over max");
}

const repeated = manualAssignmentReducer(initialState, assignRoomToNurse("room-101", "nurse-blue"));
if (JSON.stringify(assigned) !== JSON.stringify(repeated)) {
  throw new Error("assignment reducer transitions must be deterministic");
}
