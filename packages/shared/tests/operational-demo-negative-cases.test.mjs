import test from "node:test";
import assert from "node:assert/strict";

import { buildOperationalDemoSnapshot } from "../dist/index.js";

const basePlan = {
  planId: "plan-2",
  displayName: "Plan 2",
  safeReviewPacketLabel: "Plan 2 manual review packet",
  safeReviewTemplateLabel: "Plan 2 review record template",
  safeRenderedEvidenceLabel: "Plan 2 rendered operational review evidence",
  routeReadinessStatus: "ready",
  simulationReadyExportStatus: "simulation_ready",
  manualReviewStatus: "manual_review_required",
  promotionStatus: "blocked",
  reviewerDecisionSource: "none",
  canPromote: false,
  codexClaimedApproval: false,
  sampleRecordCountsAsApproval: false,
  exactParityClaimMade: false,
  privateSourcePayloadStored: false,
  reviewPacketPath: "docs/manual-review/plan-2-review-packet.md",
  reviewRecordTemplatePath: "docs/manual-review/plan-2-review-record.template.json",
  renderedEvidencePath: "docs/verification/rendered-plans/plan-2-rendered-review.png",
  renderedEvidenceHash: "a".repeat(64),
  renderedEvidenceMetadataHash: "b".repeat(64),
  renderedEvidenceMetadataSummary: {
    objectCounts: { rooms: 1, hallways: 1, doors: 1, nurseStations: 1, zones: 1, pathNodes: 1, pathEdges: 1 },
    drawCounts: { roomsDrawn: 1, hallwaysDrawn: 1, doorsDrawn: 1, stationsDrawn: 1, zonesDrawn: 1, pathNodesDrawn: 1, pathEdgesDrawn: 1, labelsDrawn: 1 },
    exactParityClaimMade: false,
    privateSourceScreenshotStored: false
  }
};

test("operational demo invalid inputs fail through real snapshot validators", () => {
  assert.throws(() => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, canPromote: true }] }), /manual review or promotion/u);
  assert.throws(() => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, codexClaimedApproval: true }] }), /manual review or promotion/u);
  assert.throws(() => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, sampleRecordCountsAsApproval: true }] }), /manual review or promotion/u);
  assert.throws(
    () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, renderedEvidencePath: "private/source.png" }], includeDeveloperEvidence: true }),
    /safe repo-relative evidence path/u
  );
  assert.throws(
    () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, renderedEvidenceHash: "bad" }], includeDeveloperEvidence: true }),
    /sha256 hash/u
  );
});
