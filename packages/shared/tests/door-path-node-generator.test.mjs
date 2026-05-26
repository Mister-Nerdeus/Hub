import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  auditPathSyncStatus,
  generateDoorPathNodes
} from "../dist/index.js";
import { testAuthoringDraft, testEditableLayout, testPlan } from "./authoring-test-helpers.mjs";

const issueDir = resolve(process.cwd(), "../..", "docs/verification/issues/issue-287");
const fixturePath = resolve(
  process.cwd(),
  "fixtures/authoring-proof/plan-1-door-path-node-fixture.json"
);

const hallwayNode = {
  id: "node-hallway-01",
  nodeType: "hallway",
  x: 16,
  y: 24,
  linkedObjectId: "hall-manual",
  entryOperationalMetadata: null
};
const planWithHallway = {
  ...testPlan,
  pathNodes: [...testPlan.pathNodes, hallwayNode],
  pathEdges: [
    {
      id: "edge-station-hallway",
      fromNodeId: "node-station-01",
      toNodeId: "node-hallway-01",
      lengthFeet: 12,
      hallwayWidthFeet: 8,
      congestionFactor: 1,
      doorPenaltySeconds: 0,
      turnPenaltySeconds: 0,
      blocked: false
    }
  ]
};

const generated = generateDoorPathNodes({
  sourcePlan: planWithHallway,
  editableLayout: testEditableLayout,
  replaceGenerated: true
});
if (generated.generatedNodes.length !== 1 || generated.generatedEdgeIds.length !== 1) {
  throw new Error("door path node generation must create a node and valid hallway edge");
}
if (!generated.generatedNodes[0].generated || generated.generatedNodes[0].generationMethod !== "nearest_hallway_connection") {
  throw new Error("generated node must be tagged with generation metadata");
}
if (!generated.preservedExistingNodeIds.includes("node-station-01")) {
  throw new Error("existing path nodes must be preserved");
}
if (generated.pathSyncStatus !== "fresh") {
  throw new Error("path sync can become fresh only when generated nodes connect to the route graph");
}

const repeated = generateDoorPathNodes({
  sourcePlan: planWithHallway,
  editableLayout: testEditableLayout,
  replaceGenerated: true
});
if (stableJson(generated.generatedNodes) !== stableJson(repeated.generatedNodes)) {
  throw new Error("door path node generation must be deterministic for the same input");
}

const staleGeneratedPlan = {
  ...planWithHallway,
  pathNodes: [
    ...planWithHallway.pathNodes,
    {
      id: "legacy-generated-node-for-door",
      nodeType: "room_door",
      x: 1,
      y: 1,
      linkedObjectId: "door-room-01",
      entryOperationalMetadata: null
    }
  ],
  pathEdges: [
    ...planWithHallway.pathEdges,
    {
      id: "legacy-edge-to-replaced-generated-node",
      fromNodeId: "legacy-generated-node-for-door",
      toNodeId: "node-hallway-01",
      lengthFeet: 20,
      hallwayWidthFeet: 8,
      congestionFactor: 1,
      doorPenaltySeconds: 0,
      turnPenaltySeconds: 0,
      blocked: false
    }
  ]
};
const replaced = generateDoorPathNodes({
  sourcePlan: staleGeneratedPlan,
  editableLayout: testEditableLayout,
  replaceGenerated: true
});
if (replaced.plan.pathNodes.some((node) => node.id === "legacy-generated-node-for-door")) {
  throw new Error("replaceGenerated must remove stale generated nodes linked to the same authored door");
}
if (replaced.plan.pathEdges.some((edge) => edge.id === "legacy-edge-to-replaced-generated-node")) {
  throw new Error("replaceGenerated must remove stale edges referencing replaced generated nodes");
}

const noHallway = generateDoorPathNodes({
  sourcePlan: testPlan,
  editableLayout: testEditableLayout,
  replaceGenerated: true
});
if (!noHallway.warningCodes.includes("NO_NEARBY_HALLWAY_NODE")) {
  throw new Error("missing hallway connection must emit no-nearby-hallway warning");
}
if (!noHallway.warningCodes.includes("PATH_EDGE_GENERATION_SKIPPED")) {
  throw new Error("missing hallway connection must emit skipped edge warning");
}
if (!noHallway.warningCodes.includes("MANUAL_PATH_REVIEW_REQUIRED")) {
  throw new Error("missing hallway connection must require manual path review");
}
if (noHallway.pathSyncStatus !== "stale_warning") {
  throw new Error("manual-review generation must keep path sync stale");
}

const pathSyncAudit = auditPathSyncStatus({
  authoringDraft: testAuthoringDraft({
    pathSyncStatus: generated.pathSyncStatus,
    authoringStatus: "draft_valid",
    authoringWarnings: []
  }),
  plan: generated.plan
});
if (!pathSyncAudit.simulationReady) {
  throw new Error("generated door path nodes must pass route access audit when connected");
}

writeJson("door-path-node-generator-output.json", {
  issue: "287",
  status: "passed",
  generatedNodeCount: generated.generatedNodes.length,
  generatedEdgeCount: generated.generatedEdgeIds.length,
  deterministic: stableJson(generated.generatedNodes) === stableJson(repeated.generatedNodes),
  generationMethods: generated.generatedNodes.map((node) => node.generationMethod),
  warningCodes: generated.warningCodes,
  limitations: generated.limitations
});
writeJson("generated-node-output.json", {
  issue: "287",
  status: "passed",
  generatedNodes: generated.generatedNodes
});
writeJson("generated-edge-output.json", {
  issue: "287",
  status: "passed",
  generatedEdgeIds: generated.generatedEdgeIds,
  generatedEdges: generated.plan.pathEdges.filter((edge) => generated.generatedEdgeIds.includes(edge.id))
});
writeJson("no-nearby-hallway-negative-output.json", {
  issue: "287",
  status: "passed",
  warningCodes: noHallway.warningCodes,
  generatedEdgeIds: noHallway.generatedEdgeIds
});
writeJson("manual-review-warning-output.json", {
  issue: "287",
  status: "passed",
  pathSyncStatus: noHallway.pathSyncStatus,
  warningCodes: noHallway.warningCodes
});
writeJson("existing-node-preservation-output.json", {
  issue: "287",
  status: "passed",
  preservedExistingNodeIds: generated.preservedExistingNodeIds,
  staleLinkedNodeRemoved: !replaced.plan.pathNodes.some((node) => node.id === "legacy-generated-node-for-door"),
  staleLinkedEdgeRemoved: !replaced.plan.pathEdges.some((edge) => edge.id === "legacy-edge-to-replaced-generated-node")
});
writeJson("path-sync-status-after-generation-output.json", {
  issue: "287",
  status: "passed",
  pathSyncStatus: generated.pathSyncStatus,
  routeAuditSimulationReady: pathSyncAudit.simulationReady,
  blockingIssues: pathSyncAudit.blockingIssues,
  warningIssues: pathSyncAudit.warningIssues
});
writeJsonToAbsolute(fixturePath, {
  issue: "287",
  status: "passed",
  generatedNodeCount: generated.generatedNodes.length,
  generatedEdgeCount: generated.generatedEdgeIds.length,
  generatedNodes: generated.generatedNodes,
  generatedEdgeIds: generated.generatedEdgeIds,
  manualReviewWarnings: noHallway.warningCodes,
  pathSyncStatusAfterGeneration: generated.pathSyncStatus,
  routeAuditSimulationReady: pathSyncAudit.simulationReady,
  limitations: generated.limitations
});

function writeJson(name, payload) {
  writeJsonToAbsolute(resolve(issueDir, name), payload);
}

function writeJsonToAbsolute(target, payload) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}

function stableJson(value) {
  return JSON.stringify(value);
}
