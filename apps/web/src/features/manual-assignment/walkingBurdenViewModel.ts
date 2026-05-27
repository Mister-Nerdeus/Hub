import {
  calculateManualAssignmentWalkingBurden,
  type ManualNurseWalkingBurdenSummary,
  type ManualWalkingBurdenInput
} from "@nerdeus/shared";
import { selectManualAssignments } from "./manualAssignmentSelectors";
import type { ManualAssignmentState } from "./manualAssignmentState";

const demoWalkingLayout: Pick<ManualWalkingBurdenInput, "station" | "rooms" | "pathNodes" | "pathEdges"> = {
  station: { stationId: "station-a", pathNodeId: "station", x: 0, y: 0 },
  rooms: [
    { roomId: "room-101", pathNodeId: "room-101-node", x: 30, y: 0 },
    { roomId: "room-102", pathNodeId: "room-102-node", x: 60, y: 0 },
    { roomId: "room-103", pathNodeId: "room-103-node", x: 60, y: 38 }
  ],
  pathNodes: [
    { nodeId: "station", x: 0, y: 0 },
    { nodeId: "room-101-node", x: 30, y: 0 },
    { nodeId: "room-102-node", x: 60, y: 0 },
    { nodeId: "room-103-node", x: 60, y: 38 }
  ],
  pathEdges: [
    { edgeId: "station-room-101", fromNodeId: "station", toNodeId: "room-101-node", distanceUnits: 30 },
    { edgeId: "room-101-room-102", fromNodeId: "room-101-node", toNodeId: "room-102-node", distanceUnits: 30 },
    { edgeId: "room-102-room-103", fromNodeId: "room-102-node", toNodeId: "room-103-node", distanceUnits: 38 }
  ]
};

export type NurseWalkingBurdenViewModel = ManualNurseWalkingBurdenSummary & {
  displaySummary: string;
};

export function createWalkingBurdenSummaryByNurse(
  state: ManualAssignmentState
): Record<string, NurseWalkingBurdenViewModel> {
  const summaries = calculateManualAssignmentWalkingBurden({
    nurses: state.nurses.map((nurse) => ({ nurseId: nurse.nurseId })),
    assignments: selectManualAssignments(state).map((assignment) => ({
      nurseId: assignment.nurseId,
      roomId: assignment.roomId
    })),
    ...demoWalkingLayout
  });

  return Object.fromEntries(
    summaries.map((summary) => [
      summary.nurseId,
      {
        ...summary,
        displaySummary: `${summary.estimatedWalkingBurdenUnits} walk units / spread ${summary.roomToRoomSpread}`
      }
    ])
  );
}
