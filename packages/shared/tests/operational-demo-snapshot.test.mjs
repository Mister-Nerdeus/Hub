import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOperationalDemoSnapshot,
  OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME
} from "../dist/index.js";

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
    objectCounts: {
      rooms: 6,
      hallways: 18,
      doors: 6,
      nurseStations: 2,
      zones: 5,
      pathNodes: 12,
      pathEdges: 11
    },
    drawCounts: {
      roomsDrawn: 6,
      hallwaysDrawn: 18,
      doorsDrawn: 6,
      stationsDrawn: 2,
      zonesDrawn: 5,
      pathNodesDrawn: 12,
      pathEdgesDrawn: 11,
      labelsDrawn: 8
    },
    exactParityClaimMade: false,
    privateSourceScreenshotStored: false
  }
};

test("operator snapshot exposes safe display labels only", () => {
  const snapshot = buildOperationalDemoSnapshot({ plans: [basePlan] });
  assert.equal(snapshot.productDisplayName, OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME);
  assert.equal(snapshot.promotionStatus, "blocked");
  assert.equal(snapshot.manualReviewRequired, true);
  assert.equal(snapshot.operatorPlans[0].routeReadinessLabel, "Route ready");
  assert.equal(snapshot.operatorPlans[0].simulationExportLabel, "Route-ready export");
  assert.equal(snapshot.operatorPlans[0].manualReviewStatusLabel, "Manual review required");
  assert.equal(snapshot.operatorPlans[0].promotionStatusLabel, "Promotion blocked");

  const operatorPayload = JSON.stringify(snapshot.operatorPlans);
  assert.equal(/manual_review_required|simulation_ready|docs\/verification|docs\/manual-review|[a-f0-9]{64}/u.test(operatorPayload), false);
});

test("developer evidence is explicit and isolated from operator plans", () => {
  const snapshot = buildOperationalDemoSnapshot({ plans: [basePlan], includeDeveloperEvidence: true });
  assert.equal(snapshot.developerEvidence?.[0].reviewPacketPath, "docs/manual-review/plan-2-review-packet.md");
  assert.equal(JSON.stringify(snapshot.operatorPlans).includes("docs/manual-review"), false);
});

test("forbidden approval and promotion drift is rejected", () => {
  assert.throws(
    () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, canPromote: true }] }),
    /manual review or promotion boundaries/u
  );
  assert.throws(
    () => buildOperationalDemoSnapshot({ plans: [{ ...basePlan, codexClaimedApproval: true }] }),
    /manual review or promotion boundaries/u
  );
});

test("private paths and source document references are rejected in developer evidence", () => {
  assert.throws(
    () => buildOperationalDemoSnapshot({
      plans: [{ ...basePlan, renderedEvidencePath: "C:\\private\\source.docx" }],
      includeDeveloperEvidence: true
    }),
    /safe repo-relative evidence path/u
  );
});
