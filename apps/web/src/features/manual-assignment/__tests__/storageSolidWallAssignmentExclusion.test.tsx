import { manualAssignmentReducer } from "../manualAssignmentReducer";
import { createManualAssignmentInitialState } from "../manualAssignmentState";
import { createManualAssignmentWorkspaceViewModel } from "../manualAssignmentWorkspaceViewModel";

const nurse = {
  nurseId: "nurse-blue",
  displayLabel: "Nurse Blue",
  color: "#2563eb",
  role: "primary",
  targetPatientCount: 4,
  maxPatientCount: 4,
  traumaQualified: true,
  psychQualified: true,
  chargeQualified: false,
  active: true,
  syntheticDataOnly: true
} as const;

const roomLoad = {
  roomId: "storage-01",
  occupied: true,
  acuity: 3,
  traumaActive: false,
  isolationActive: false,
  behavioralRisk: false,
  fallRisk: false,
  sitterRequired: false,
  medicationFrequency: "low",
  monitoringFrequency: "low",
  procedureBurden: "none",
  expectedTurnover: "none",
  syntheticDataOnly: true
} as const;

const state = createManualAssignmentInitialState([nurse], [roomLoad], {
  "storage-01": "storage"
});
const assigned = manualAssignmentReducer(state, {
  type: "assignRoom",
  roomId: "storage-01",
  nurseId: "nurse-blue"
});
if (assigned.assignmentsByRoomId["storage-01"] != null) {
  throw new Error("storage must not receive manual nurse assignment state");
}

const updatedLoad = manualAssignmentReducer(state, {
  type: "setRoomLoad",
  roomLoad: { ...roomLoad, acuity: 5 }
});
if (updatedLoad.roomLoadsByRoomId["storage-01"]?.acuity === 5) {
  throw new Error("storage must not receive manual room-load state changes");
}

const viewModel = createManualAssignmentWorkspaceViewModel(state);
if (viewModel.roomCards[0]?.assignmentDisabled !== true) {
  throw new Error("storage room card must disable assignment controls");
}
if (viewModel.roomCards[0]?.assignmentDisabledReason !== "Storage is excluded from nurse assignment.") {
  throw new Error("storage disabled reason must be explicit");
}
