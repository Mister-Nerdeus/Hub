import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  auditRouteGraph,
  buildReviewedPlanFromCorrectedSavedCopy,
  isFreshPathSyncEligible,
  repairCorrectedPlanRoutes,
  validateSourceCorrectedSavedCopy
} from "../dist/index.js";

const repoRoot = resolve(process.cwd(), "../..");
const correctedPath = "packages/shared/fixtures/source-corrections/plan-2/plan-2-corrected-saved-copy.json";
const corrected = validateSourceCorrectedSavedCopy(JSON.parse(readFileSync(resolve(repoRoot, correctedPath), "utf8")));
const reviewedPlan = buildReviewedPlanFromCorrectedSavedCopy(corrected);

test("recomputed audit detects current corrected saved-copy blockers", () => {
  const audit = auditRouteGraph(corrected, reviewedPlan);
  assert.deepEqual(audit.roomsMissingDoor, []);
  assert.equal(audit.roomsMissingPathNode.includes("plan-2-source-review-added-room"), true);
  assert.equal(audit.unreachableRoomIds.includes("plan-2-source-review-added-room"), true);
  assert.equal(isFreshPathSyncEligible(audit), false);
});

test("route repair creates tagged node and finite positive edge", () => {
  const repaired = repairCorrectedPlanRoutes({
    correctedSavedCopy: corrected,
    correctedSavedCopyPath: correctedPath,
    repairedSavedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json",
    issue: "312"
  });
  assert.equal(repaired.report.generatedPathNodes.length, 1);
  assert.equal(repaired.report.generatedPathEdges.length, 1);
  const generatedNode = repaired.repairedPlan.pathNodes.find((node) => node.id === repaired.report.generatedPathNodes[0].id);
  const generatedEdge = repaired.repairedPlan.pathEdges.find((edge) => edge.id === repaired.report.generatedPathEdges[0].id);
  assert.equal(generatedNode.pathRepairMetadata.repairRule, "door_node_rule");
  assert.equal(generatedEdge.pathRepairMetadata.repairRule, "edge_rule");
  assert.equal(Number.isFinite(generatedEdge.lengthFeet), true);
  assert.equal(generatedEdge.lengthFeet > 0, true);
  assert.equal(repaired.report.afterAudit.roomsMissingPathNode.length, 0);
  assert.equal(repaired.report.afterAudit.unreachableRoomIds.length, 0);
});

test("negative blocker classes are recomputed from graph data", () => {
  const dangling = {
    ...reviewedPlan,
    pathEdges: [
      ...reviewedPlan.pathEdges,
      {
        ...reviewedPlan.pathEdges[0],
        id: "edge-dangling-negative",
        toNodeId: "missing-node"
      }
    ]
  };
  assert.deepEqual(auditRouteGraph(corrected, dangling).danglingPathEdgeIds, ["edge-dangling-negative"]);

  const nonFinite = {
    ...reviewedPlan,
    pathEdges: [{ ...reviewedPlan.pathEdges[0], id: "edge-non-finite-negative", lengthFeet: Number.POSITIVE_INFINITY }]
  };
  assert.deepEqual(auditRouteGraph(corrected, nonFinite).nonFinitePathEdgeIds, ["edge-non-finite-negative"]);

  const zero = {
    ...reviewedPlan,
    pathEdges: [{ ...reviewedPlan.pathEdges[0], id: "edge-zero-negative", lengthFeet: 0 }]
  };
  assert.deepEqual(auditRouteGraph(corrected, zero).nonPositivePathEdgeIds, ["edge-zero-negative"]);

  const negative = {
    ...reviewedPlan,
    pathEdges: [{ ...reviewedPlan.pathEdges[0], id: "edge-negative-negative", lengthFeet: -1 }]
  };
  assert.deepEqual(auditRouteGraph(corrected, negative).nonPositivePathEdgeIds, ["edge-negative-negative"]);

  const orphan = {
    ...reviewedPlan,
    pathNodes: [
      ...reviewedPlan.pathNodes,
      {
        id: "node-orphan-negative",
        nodeType: "hallway",
        x: 999,
        y: 999,
        linkedObjectId: reviewedPlan.hallways[0].id
      }
    ]
  };
  assert.equal(auditRouteGraph(corrected, orphan).orphanPathNodeIds.includes("node-orphan-negative"), true);

  const blocked = {
    ...reviewedPlan,
    pathEdges: reviewedPlan.pathEdges.map((edge) => ({ ...edge, blocked: true }))
  };
  assert.equal(auditRouteGraph(corrected, blocked).unreachableRoomIds.length > 0, true);
});
