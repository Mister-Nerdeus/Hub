import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  validatePlanContract,
  validateSimulationReadyExport
} from "../dist/index.js";
import { testAuthoringDraft, testEditableLayout, testPlan } from "./authoring-test-helpers.mjs";

const issueDir = resolve(process.cwd(), "../..", "docs/verification/issues/issue-288");
const fixturePath = resolve(
  process.cwd(),
  "fixtures/authoring-proof/plan-1-simulation-ready-export-fixture.json"
);

const connectedPlan = {
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
};

const readyDraft = testAuthoringDraft({
  pathSyncStatus: "fresh",
  authoringStatus: "simulation_ready",
  authoringWarnings: [],
  sourcePlan: connectedPlan
});
const ready = validateSimulationReadyExport({ authoringDraft: readyDraft });
if (ready.status !== "simulation_ready" || ready.simulationReadyPlan == null) {
  throw new Error("fresh route access must export a valid simulation-ready plan");
}
validatePlanContract(ready.simulationReadyPlan);

const stale = validateSimulationReadyExport({ authoringDraft: testAuthoringDraft() });
if (stale.status !== "blocked_path_sync" || stale.simulationReadyPlan !== null) {
  throw new Error("stale path sync must block simulation-ready export");
}

const warningDraft = testAuthoringDraft({
  pathSyncStatus: "fresh",
  authoringStatus: "draft_has_warnings",
  authoringWarnings: ["ROOM_MISSING_PATH_NODE"],
  sourcePlan: testPlan
});
const warningBlocked = validateSimulationReadyExport({ authoringDraft: warningDraft });
if (warningBlocked.status !== "draft_has_warnings" || warningBlocked.simulationReadyPlan !== null) {
  throw new Error("route-access warnings must block simulation-ready export without blocking draft save");
}

const invalidGeometry = validateSimulationReadyExport({
  authoringDraft: testAuthoringDraft({
    editableLayout: {
      ...testEditableLayout,
      rooms: [{ ...testEditableLayout.rooms[0], widthFeet: Number.NaN }]
    }
  })
});
if (invalidGeometry.status !== "blocked_invalid_geometry") {
  throw new Error("invalid geometry must block simulation-ready export");
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

writeJson("simulation-ready-export-output.json", {
  issue: "288",
  status: "passed",
  exportStatus: ready.status,
  planId: ready.planId,
  sourceDraftId: ready.sourceDraftId,
  simulationReadyPlanPresent: ready.simulationReadyPlan != null,
  privateSourcePayloadStored: ready.privateSourcePayloadStored,
  pathSyncStatus: ready.pathSyncStatus,
  limitations: ready.limitations
});
writeJson("blocked-path-sync-output.json", {
  issue: "288",
  status: "passed",
  exportStatus: stale.status,
  blockingIssues: stale.blockingIssues,
  warningIssues: stale.warningIssues,
  pathSyncStatus: stale.pathSyncStatus
});
writeJson("invalid-geometry-block-output.json", {
  issue: "288",
  status: "passed",
  exportStatus: invalidGeometry.status,
  blockingIssues: invalidGeometry.blockingIssues
});
writeJson("private-source-block-output.json", {
  issue: "288",
  status: "passed",
  exportStatus: privatePayload.status,
  privateSourcePayloadStored: privatePayload.privateSourcePayloadStored,
  blockingIssues: privatePayload.blockingIssues
});
writeJson("route-access-summary-output.json", {
  issue: "288",
  status: "passed",
  readyRouteAccessSummary: ready.routeAccessSummary,
  warningRouteAccessSummary: warningBlocked.routeAccessSummary,
  warningExportStatus: warningBlocked.status
});
writeJson("validated-plan-contract-output.json", {
  issue: "288",
  status: "passed",
  planId: validatePlanContract(ready.simulationReadyPlan).planId,
  roomCount: ready.simulationReadyPlan.rooms.length,
  doorCount: ready.simulationReadyPlan.doors.length,
  hallwayCount: ready.simulationReadyPlan.hallways.length,
  zoneCount: ready.simulationReadyPlan.zones.length,
  pathNodeCount: ready.simulationReadyPlan.pathNodes.length,
  pathEdgeCount: ready.simulationReadyPlan.pathEdges.length
});
writeJsonToAbsolute(fixturePath, {
  issue: "288",
  status: "passed",
  exportResult: {
    status: ready.status,
    planId: ready.planId,
    sourceDraftId: ready.sourceDraftId,
    simulationReadyPlan: ready.simulationReadyPlan,
    blockingIssues: ready.blockingIssues,
    warningIssues: ready.warningIssues,
    pathSyncStatus: ready.pathSyncStatus,
    routeAccessSummary: ready.routeAccessSummary,
    privateSourcePayloadStored: ready.privateSourcePayloadStored,
    limitations: ready.limitations
  },
  blockedPathSyncStatus: stale.status,
  invalidGeometryStatus: invalidGeometry.status,
  privateSourceStatus: privatePayload.status,
  draftWarningStatus: warningBlocked.status
});

function writeJson(name, payload) {
  writeJsonToAbsolute(resolve(issueDir, name), payload);
}

function writeJsonToAbsolute(target, payload) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}
