import { generateDoorPathNodes } from "../dist/index.js";
import { testEditableLayout, testPlan } from "./authoring-test-helpers.mjs";

const planWithHallway = {
  ...testPlan,
  pathNodes: [
    ...testPlan.pathNodes,
    {
      id: "node-hallway-01",
      nodeType: "hallway",
      x: 16,
      y: 24,
      linkedObjectId: "hall-manual",
      entryOperationalMetadata: null
    }
  ],
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
const result = generateDoorPathNodes({
  sourcePlan: planWithHallway,
  editableLayout: testEditableLayout,
  replaceGenerated: true
});
if (result.generatedNodes.length !== 1 || result.generatedEdgeIds.length !== 1) {
  throw new Error("door path node generation must create a node and valid hallway edge");
}
if (!result.generatedNodes[0].generated || result.generatedNodes[0].generationMethod !== "nearest_hallway_connection") {
  throw new Error("generated node must be tagged with method");
}
if (!result.preservedExistingNodeIds.includes("node-station-01")) {
  throw new Error("existing path nodes must be preserved");
}

const noHallway = generateDoorPathNodes({
  sourcePlan: testPlan,
  editableLayout: testEditableLayout,
  replaceGenerated: true
});
if (!noHallway.warningCodes.includes("NO_NEARBY_HALLWAY_NODE")) {
  throw new Error("missing hallway connection must emit manual review warning");
}
