import { validateSimulationReadyExport } from "../dist/index.js";
import { testAuthoringDraft, testPlan } from "./authoring-test-helpers.mjs";

const stale = validateSimulationReadyExport({ authoringDraft: testAuthoringDraft() });
if (stale.status !== "blocked_path_sync" || stale.simulationReadyPlan !== null) {
  throw new Error("stale path sync must block simulation-ready export");
}

const readyDraft = testAuthoringDraft({
  pathSyncStatus: "fresh",
  authoringStatus: "simulation_ready",
  authoringWarnings: [],
  sourcePlan: {
    ...testPlan,
    rooms: [{ ...testPlan.rooms[0], pathNodeId: "node-room-01-door" }],
    doors: [{ ...testPlan.doors[0], pathNodeId: "node-room-01-door" }],
    pathNodes: [
      ...testPlan.pathNodes,
      {
        id: "node-room-01-door",
        nodeType: "room_door",
        x: 16,
        y: 20,
        linkedObjectId: "door-room-01",
        entryOperationalMetadata: null
      }
    ],
    pathEdges: [
      {
        id: "edge-station-room",
        fromNodeId: "node-station-01",
        toNodeId: "node-room-01-door",
        lengthFeet: 10,
        hallwayWidthFeet: 8,
        congestionFactor: 1,
        doorPenaltySeconds: 0,
        turnPenaltySeconds: 0,
        blocked: false
      }
    ]
  }
});
const ready = validateSimulationReadyExport({ authoringDraft: readyDraft });
if (ready.status !== "simulation_ready" || ready.simulationReadyPlan == null) {
  throw new Error("fresh route access must export a valid simulation-ready plan");
}

const privatePayload = validateSimulationReadyExport({
  authoringDraft: {
    ...readyDraft,
    sourceDocumentPath: "not-allowed"
  }
});
if (privatePayload.status !== "blocked_private_source_payload") {
  throw new Error("private source payload must block export");
}
