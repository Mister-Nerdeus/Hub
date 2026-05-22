import { planErPodPhase2 } from "../../fixtures/planErPodPhase2";
import {
  manualAssignmentBasic,
  manualAssignmentRoomLoads
} from "../../fixtures/manualAssignmentBasic";
import { createManualAssignmentViewModel } from "./manualAssignmentViewModel";

const viewModel = createManualAssignmentViewModel(
  planErPodPhase2,
  manualAssignmentRoomLoads,
  manualAssignmentBasic
);

if (viewModel.burdenRows.length !== manualAssignmentBasic.nurses.length) {
  throw new Error("nurse burden table rows must include every nurse");
}

if (!viewModel.warnings.some((warning) => warning.code === "UNASSIGNED_OCCUPIED_ROOM")) {
  throw new Error("warning list must include unassigned occupied room warnings");
}

if (!viewModel.warnings.some((warning) => warning.code === "OVER_TARGET_RATIO")) {
  throw new Error("warning list must include over target warnings");
}

if (!viewModel.unassignedOccupiedRooms.some((room) => room.roomId === "hall-bed-01")) {
  throw new Error("unassigned room summary must include occupied hall bed");
}

if (!viewModel.sameCountDifferentBurdenProof.visible) {
  throw new Error("same occupied-room count with different burden must be visible");
}

const [firstBurden, secondBurden] = viewModel.sameCountDifferentBurdenProof.burdens;
if (firstBurden === secondBurden) {
  throw new Error("same occupied-room count proof must show different burden totals");
}
