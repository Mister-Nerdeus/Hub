import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  auditPathSyncStatus,
  validateSimulationReadyExport
} from "../dist/index.js";
import { testAuthoringDraft, testEditableLayout, testPlan } from "./authoring-test-helpers.mjs";

const issueDir = resolve(process.cwd(), "../..", "docs/verification/issues/issue-286");
const fixturePath = resolve(
  process.cwd(),
  "fixtures/authoring-proof/plan-1-path-sync-fixture.json"
);

const connectedPlan = {
  ...testPlan,
  rooms: testPlan.rooms.map((room) => ({ ...room, pathNodeId: "node-room-01" })),
  pathNodes: [
    ...testPlan.pathNodes,
    {
      id: "node-room-01",
      nodeType: "room_door",
      x: 16,
      y: 20,
      linkedObjectId: "door-room-01",
      entryOperationalMetadata: null
    }
  ],
  pathEdges: [
    {
      id: "edge-station-room-01",
      fromNodeId: "node-station-01",
      toNodeId: "node-room-01",
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
  authoringStatus: "draft_valid",
  authoringWarnings: []
});
const readyAudit = auditPathSyncStatus({ authoringDraft: readyDraft, plan: connectedPlan });
if (!readyAudit.simulationReady || readyAudit.blockingIssues.length !== 0) {
  throw new Error("connected room door/path graph must pass route access audit");
}

const staleAudit = auditPathSyncStatus({ authoringDraft: testAuthoringDraft(), plan: connectedPlan });
if (!staleAudit.warningIssues.includes("PATH_SYNC_STALE")) {
  throw new Error("stale path sync must be visible in audit warnings");
}
if (!staleAudit.blockingIssues.includes("SIMULATION_READY_EXPORT_BLOCKED")) {
  throw new Error("stale path sync must block simulation-ready export");
}

const missingDoorDraft = testAuthoringDraft({
  editableLayout: {
    ...testEditableLayout,
    doors: []
  },
  pathSyncStatus: "fresh",
  authoringStatus: "draft_valid"
});
const missingDoorAudit = auditPathSyncStatus({ authoringDraft: missingDoorDraft, plan: connectedPlan });
if (!missingDoorAudit.roomsMissingDoor.includes("room-01")) {
  throw new Error("audit must identify rooms missing door access");
}

const missingPathAudit = auditPathSyncStatus({ authoringDraft: testAuthoringDraft(), plan: testPlan });
if (!missingPathAudit.roomsMissingPathNode.includes("room-01")) {
  throw new Error("audit must identify rooms missing path node access");
}
if (!missingPathAudit.blockingIssues.includes("ROOM_MISSING_PATH_NODE")) {
  throw new Error("missing path nodes must block simulation-ready export");
}

const unreachablePlan = {
  ...connectedPlan,
  pathEdges: []
};
const unreachableAudit = auditPathSyncStatus({ authoringDraft: readyDraft, plan: unreachablePlan });
if (!unreachableAudit.unreachableRoomIds.includes("room-01")) {
  throw new Error("audit must identify rooms unreachable from the route graph");
}

const blockedExport = validateSimulationReadyExport({
  authoringDraft: testAuthoringDraft(),
  reviewedPathPlan: connectedPlan
});
if (blockedExport.status !== "blocked_path_sync") {
  throw new Error("simulation-ready export must block stale path sync");
}

writeJson("path-sync-audit-output.json", {
  issue: "286",
  status: "passed",
  ...staleAudit
});
writeJson("route-access-output.json", {
  issue: "286",
  status: "passed",
  pathSyncStatus: readyAudit.pathSyncStatus,
  roomCount: readyAudit.roomCount,
  roomsWithDoorCount: readyAudit.roomsWithDoorCount,
  roomsWithPathNodeCount: readyAudit.roomsWithPathNodeCount,
  simulationReady: readyAudit.simulationReady,
  blockingIssues: readyAudit.blockingIssues
});
writeJson("missing-door-output.json", {
  issue: "286",
  status: "passed",
  roomsMissingDoor: missingDoorAudit.roomsMissingDoor,
  blockingIssues: missingDoorAudit.blockingIssues
});
writeJson("missing-path-node-output.json", {
  issue: "286",
  status: "passed",
  roomsMissingPathNode: missingPathAudit.roomsMissingPathNode,
  blockingIssues: missingPathAudit.blockingIssues
});
writeJson("unreachable-room-output.json", {
  issue: "286",
  status: "passed",
  unreachableRoomIds: unreachableAudit.unreachableRoomIds,
  blockingIssues: unreachableAudit.blockingIssues
});
writeJson("simulation-ready-block-output.json", {
  issue: "286",
  status: "passed",
  exportStatus: blockedExport.status,
  blockingIssues: blockedExport.blockingIssues,
  warningIssues: blockedExport.warningIssues,
  pathSyncStatus: blockedExport.pathSyncStatus
});
writeJsonToAbsolute(fixturePath, {
  issue: "286",
  status: "passed",
  audit: staleAudit,
  routeAccess: readyAudit,
  blockedExportStatus: blockedExport.status
});

function writeJson(name, payload) {
  writeJsonToAbsolute(resolve(issueDir, name), payload);
}

function writeJsonToAbsolute(target, payload) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}
