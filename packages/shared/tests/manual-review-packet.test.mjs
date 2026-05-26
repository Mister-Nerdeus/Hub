import assert from "node:assert/strict";
import test from "node:test";
import { buildManualReviewPacket } from "../dist/index.js";

test("manual review packet is a safe non-approval packet", () => {
  const packet = buildManualReviewPacket({
    planId: "plan-2",
    sourceDefaultPlanId: "default-er-layout-plan-2",
    renderedEvidencePath: "docs/verification/rendered-plans/plan-2-rendered-review.png",
    renderedEvidenceMetadataPath: "docs/verification/rendered-plans/plan-2-rendered-review.metadata.json",
    renderedEvidenceHash: "a".repeat(64),
    renderedEvidenceMetadata: {
      objectCounts: { rooms: 1, doors: 1, hallways: 1, pathNodes: 1, pathEdges: 1 },
      drawCounts: { roomsDrawn: 1, doorsDrawn: 1, hallwaysDrawn: 1, pathNodesDrawn: 1, pathEdgesDrawn: 1 },
      renderedFromCorrectedSavedCopy: true,
      privateSourceScreenshotStored: false,
      exactParityClaimMade: false
    },
    repairedSavedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json",
    repairedSavedCopyHash: "b".repeat(64),
    simulationReadyExportPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-simulation-ready-export.json",
    simulationReadyExportHash: "c".repeat(64),
    routeReadinessStatus: "ready",
    simulationReadyExportStatus: "simulation_ready",
    blockingIssues: [],
    warningIssues: [],
    limitations: ["Manual review required."]
  });
  assert.match(packet, /manual_review_required/u);
  assert.doesNotMatch(packet, /manualReviewStatus\s*[:=]\s*approved/u);
});
